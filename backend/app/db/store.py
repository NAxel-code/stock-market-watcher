"""Durable multi-tenant state persistence store (SQLite WAL + optional Supabase sync)."""

import json
import logging
import os
import sqlite3
import tempfile
import threading
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


def _resolve_db_path() -> str:
    if settings.database_path:
        path = Path(settings.database_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        return str(path)

    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        return str(Path(tempfile.gettempdir()) / "stockpulse.db")

    local_data_dir = Path(__file__).resolve().parents[2] / "data"
    try:
        local_data_dir.mkdir(parents=True, exist_ok=True)
        probe = local_data_dir / ".write_test"
        probe.touch()
        probe.unlink(missing_ok=True)
        return str(local_data_dir / "stockpulse.db")
    except OSError:
        return str(Path(tempfile.gettempdir()) / "stockpulse.db")


class PersistenceStore:
    """Thread-safe relational store for users, watchlists, portfolios, paper accounts, and alerts."""

    def __init__(self, db_path: str | None = None) -> None:
        self.db_path = db_path or _resolve_db_path()
        self._lock = threading.RLock()
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False, timeout=15.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        return conn

    def _init_schema(self) -> None:
        with self._lock, self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    display_name TEXT,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS watchlists (
                    owner_id TEXT NOT NULL,
                    ticker TEXT NOT NULL,
                    added_at TEXT NOT NULL,
                    PRIMARY KEY (owner_id, ticker)
                );
                CREATE INDEX IF NOT EXISTS idx_watchlists_owner ON watchlists(owner_id);

                CREATE TABLE IF NOT EXISTS portfolio_holdings (
                    id TEXT NOT NULL,
                    owner_id TEXT NOT NULL,
                    ticker TEXT NOT NULL,
                    company_name TEXT NOT NULL,
                    exchange TEXT NOT NULL,
                    asset_type TEXT NOT NULL DEFAULT 'EQUITY',
                    shares REAL NOT NULL,
                    lot_size INTEGER NOT NULL DEFAULT 1,
                    cost_basis REAL NOT NULL,
                    currency TEXT NOT NULL,
                    purchase_date TEXT,
                    sector TEXT,
                    country TEXT,
                    fees REAL NOT NULL DEFAULT 0.0,
                    notes TEXT,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (owner_id, id)
                );
                CREATE INDEX IF NOT EXISTS idx_portfolio_owner ON portfolio_holdings(owner_id);

                CREATE TABLE IF NOT EXISTS paper_accounts (
                    owner_id TEXT PRIMARY KEY,
                    cash_balance_usd REAL NOT NULL,
                    initial_capital_usd REAL NOT NULL,
                    positions_json TEXT NOT NULL DEFAULT '[]',
                    trades_json TEXT NOT NULL DEFAULT '[]',
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS price_alerts (
                    id TEXT PRIMARY KEY,
                    owner_id TEXT NOT NULL,
                    ticker TEXT NOT NULL,
                    target_price REAL NOT NULL,
                    condition TEXT NOT NULL,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    triggered_at TEXT,
                    triggered_price REAL,
                    message TEXT,
                    created_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_alerts_owner_active ON price_alerts(owner_id, is_active);
                CREATE INDEX IF NOT EXISTS idx_alerts_active ON price_alerts(is_active);
                """
            )
            conn.commit()

    # ==========================================================
    # Users & Authentication
    # ==========================================================
    def create_user(self, email: str, password_hash: str, display_name: str | None = None) -> dict[str, Any]:
        norm_email = email.strip().lower()
        user_id = str(uuid.uuid4())
        created_at = datetime.now(UTC).isoformat()
        name = display_name.strip() if display_name and display_name.strip() else norm_email.split("@")[0]

        with self._lock, self._connect() as conn:
            conn.execute(
                "INSERT INTO users (id, email, password_hash, display_name, created_at) VALUES (?, ?, ?, ?, ?)",
                (user_id, norm_email, password_hash, name, created_at),
            )
            conn.commit()

        return {
            "id": user_id,
            "email": norm_email,
            "display_name": name,
            "created_at": created_at,
        }

    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        norm_email = email.strip().lower()
        with self._lock, self._connect() as conn:
            row = conn.execute(
                "SELECT id, email, password_hash, display_name, created_at FROM users WHERE email = ?",
                (norm_email,),
            ).fetchone()
            return dict(row) if row else None

    def get_user_by_id(self, user_id: str) -> dict[str, Any] | None:
        with self._lock, self._connect() as conn:
            row = conn.execute(
                "SELECT id, email, display_name, created_at FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()
            return dict(row) if row else None

    def migrate_workspace_to_user(self, workspace_id: str | None, user_id: str) -> None:
        """Merge guest workspace data (watchlist, holdings, alerts, paper account) into authenticated user account."""
        if not workspace_id:
            return
        src_owner = f"ws:{workspace_id.strip()}"
        dst_owner = f"user:{user_id}"
        if src_owner == dst_owner:
            return

        with self._lock, self._connect() as conn:
            # 1. Watchlist merge
            conn.execute(
                """
                INSERT OR IGNORE INTO watchlists (owner_id, ticker, added_at)
                SELECT ?, ticker, added_at FROM watchlists WHERE owner_id = ?
                """,
                (dst_owner, src_owner),
            )
            # 2. Holdings merge (only if dst has none yet, avoid duplicating defaults)
            dst_holdings_count = conn.execute(
                "SELECT COUNT(*) FROM portfolio_holdings WHERE owner_id = ?", (dst_owner,)
            ).fetchone()[0]
            if dst_holdings_count == 0:
                conn.execute(
                    """
                    INSERT OR IGNORE INTO portfolio_holdings
                    (id, owner_id, ticker, company_name, exchange, asset_type, shares, lot_size, cost_basis, currency, purchase_date, sector, country, fees, notes, updated_at)
                    SELECT id, ?, ticker, company_name, exchange, asset_type, shares, lot_size, cost_basis, currency, purchase_date, sector, country, fees, notes, updated_at
                    FROM portfolio_holdings WHERE owner_id = ?
                    """,
                    (dst_owner, src_owner),
                )
            # 3. Alerts merge
            conn.execute(
                "UPDATE price_alerts SET owner_id = ? WHERE owner_id = ?",
                (dst_owner, src_owner),
            )
            # 4. Paper account merge if user has no paper account yet
            dst_paper = conn.execute(
                "SELECT 1 FROM paper_accounts WHERE owner_id = ?", (dst_owner,)
            ).fetchone()
            if not dst_paper:
                src_paper = conn.execute(
                    "SELECT cash_balance_usd, initial_capital_usd, positions_json, trades_json, updated_at FROM paper_accounts WHERE owner_id = ?",
                    (src_owner,),
                ).fetchone()
                if src_paper:
                    conn.execute(
                        """
                        INSERT INTO paper_accounts (owner_id, cash_balance_usd, initial_capital_usd, positions_json, trades_json, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (
                            dst_owner,
                            src_paper["cash_balance_usd"],
                            src_paper["initial_capital_usd"],
                            src_paper["positions_json"],
                            src_paper["trades_json"],
                            src_paper["updated_at"],
                        ),
                    )
            conn.commit()

    # ==========================================================
    # Watchlists
    # ==========================================================
    def get_watchlist(self, owner_id: str) -> list[dict[str, str]]:
        with self._lock, self._connect() as conn:
            rows = conn.execute(
                "SELECT ticker, added_at FROM watchlists WHERE owner_id = ? ORDER BY added_at ASC",
                (owner_id,),
            ).fetchall()
            return [{"ticker": r["ticker"], "added_at": r["added_at"]} for r in rows]

    def add_watchlist_ticker(self, owner_id: str, ticker: str) -> list[dict[str, str]]:
        clean = ticker.strip().upper()
        now = datetime.now(UTC).isoformat()
        with self._lock, self._connect() as conn:
            conn.execute(
                "INSERT OR IGNORE INTO watchlists (owner_id, ticker, added_at) VALUES (?, ?, ?)",
                (owner_id, clean, now),
            )
            conn.commit()
        return self.get_watchlist(owner_id)

    def remove_watchlist_ticker(self, owner_id: str, ticker: str) -> list[dict[str, str]]:
        clean = ticker.strip().upper()
        with self._lock, self._connect() as conn:
            conn.execute(
                "DELETE FROM watchlists WHERE owner_id = ? AND ticker = ?",
                (owner_id, clean),
            )
            conn.commit()
        return self.get_watchlist(owner_id)

    def sync_watchlist(self, owner_id: str, tickers: list[str]) -> list[dict[str, str]]:
        now = datetime.now(UTC).isoformat()
        cleaned = []
        seen = set()
        for t in tickers:
            up = t.strip().upper()
            if up and up not in seen:
                seen.add(up)
                cleaned.append(up)

        with self._lock, self._connect() as conn:
            conn.execute("DELETE FROM watchlists WHERE owner_id = ?", (owner_id,))
            conn.executemany(
                "INSERT INTO watchlists (owner_id, ticker, added_at) VALUES (?, ?, ?)",
                [(owner_id, t, now) for t in cleaned],
            )
            conn.commit()
        return self.get_watchlist(owner_id)

    # ==========================================================
    # Portfolio Holdings
    # ==========================================================
    def list_portfolio_holdings(self, owner_id: str) -> list[dict[str, Any]]:
        with self._lock, self._connect() as conn:
            rows = conn.execute(
                """
                SELECT id, ticker, company_name, exchange, asset_type, shares, lot_size,
                       cost_basis, currency, purchase_date, sector, country, fees, notes
                FROM portfolio_holdings WHERE owner_id = ? ORDER BY updated_at ASC
                """,
                (owner_id,),
            ).fetchall()
            return [dict(r) for r in rows]

    def replace_portfolio_holdings(self, owner_id: str, holdings: list[dict[str, Any]]) -> list[dict[str, Any]]:
        now = datetime.now(UTC).isoformat()
        with self._lock, self._connect() as conn:
            conn.execute("DELETE FROM portfolio_holdings WHERE owner_id = ?", (owner_id,))
            for h in holdings:
                conn.execute(
                    """
                    INSERT INTO portfolio_holdings
                    (id, owner_id, ticker, company_name, exchange, asset_type, shares, lot_size,
                     cost_basis, currency, purchase_date, sector, country, fees, notes, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        h["id"],
                        owner_id,
                        h["ticker"].upper(),
                        h["company_name"],
                        h["exchange"],
                        h.get("asset_type", "EQUITY"),
                        float(h["shares"]),
                        int(h.get("lot_size", 1)),
                        float(h["cost_basis"]),
                        h["currency"],
                        h.get("purchase_date"),
                        h.get("sector"),
                        h.get("country"),
                        float(h.get("fees", 0.0)),
                        h.get("notes"),
                        now,
                    ),
                )
            conn.commit()
        return self.list_portfolio_holdings(owner_id)

    def upsert_portfolio_holding(self, owner_id: str, holding: dict[str, Any]) -> dict[str, Any]:
        now = datetime.now(UTC).isoformat()
        hid = holding.get("id") or f"pos-{uuid.uuid4().hex[:12]}"
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO portfolio_holdings
                (id, owner_id, ticker, company_name, exchange, asset_type, shares, lot_size,
                 cost_basis, currency, purchase_date, sector, country, fees, notes, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    hid,
                    owner_id,
                    holding["ticker"].upper(),
                    holding["company_name"],
                    holding["exchange"],
                    holding.get("asset_type", "EQUITY"),
                    float(holding["shares"]),
                    int(holding.get("lot_size", 1)),
                    float(holding["cost_basis"]),
                    holding["currency"],
                    holding.get("purchase_date"),
                    holding.get("sector"),
                    holding.get("country"),
                    float(holding.get("fees", 0.0)),
                    holding.get("notes"),
                    now,
                ),
            )
            conn.commit()
        return {**holding, "id": hid, "ticker": holding["ticker"].upper()}

    def delete_portfolio_holding(self, owner_id: str, holding_id: str) -> bool:
        with self._lock, self._connect() as conn:
            cur = conn.execute(
                "DELETE FROM portfolio_holdings WHERE owner_id = ? AND id = ?",
                (owner_id, holding_id),
            )
            conn.commit()
            return cur.rowcount > 0

    # ==========================================================
    # Paper Trading Accounts
    # ==========================================================
    def get_paper_state(self, owner_id: str) -> dict[str, Any] | None:
        with self._lock, self._connect() as conn:
            row = conn.execute(
                "SELECT cash_balance_usd, initial_capital_usd, positions_json, trades_json, updated_at FROM paper_accounts WHERE owner_id = ?",
                (owner_id,),
            ).fetchone()
            if not row:
                return None
            return {
                "cash_balance_usd": row["cash_balance_usd"],
                "initial_capital_usd": row["initial_capital_usd"],
                "positions": json.loads(row["positions_json"]),
                "trades": json.loads(row["trades_json"]),
                "updated_at": row["updated_at"],
            }

    def save_paper_state(self, owner_id: str, state: dict[str, Any]) -> dict[str, Any]:
        now = datetime.now(UTC).isoformat()
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO paper_accounts
                (owner_id, cash_balance_usd, initial_capital_usd, positions_json, trades_json, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    owner_id,
                    float(state["cash_balance_usd"]),
                    float(state.get("initial_capital_usd", 100000.0)),
                    json.dumps(state.get("positions", [])),
                    json.dumps(state.get("trades", [])),
                    now,
                ),
            )
            conn.commit()
        return {**state, "updated_at": now}

    def reset_paper_state(self, owner_id: str, initial_capital_usd: float = 100000.0) -> dict[str, Any]:
        return self.save_paper_state(
            owner_id,
            {
                "cash_balance_usd": initial_capital_usd,
                "initial_capital_usd": initial_capital_usd,
                "positions": [],
                "trades": [],
            },
        )

    # ==========================================================
    # Price Alerts (24/7 Server-Side Evaluation)
    # ==========================================================
    def create_alert(self, owner_id: str, ticker: str, target_price: float, condition: str) -> dict[str, Any]:
        alert_id = str(uuid.uuid4())
        created_at = datetime.now(UTC).isoformat()
        clean_ticker = ticker.strip().upper()
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                INSERT INTO price_alerts
                (id, owner_id, ticker, target_price, condition, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, 1, ?)
                """,
                (alert_id, owner_id, clean_ticker, float(target_price), condition, created_at),
            )
            conn.commit()
        return {
            "id": alert_id,
            "owner_id": owner_id,
            "ticker": clean_ticker,
            "target_price": float(target_price),
            "condition": condition,
            "is_active": True,
            "created_at": created_at,
            "triggered_at": None,
            "triggered_price": None,
            "message": None,
        }

    def list_alerts(self, owner_id: str, include_triggered: bool = True) -> list[dict[str, Any]]:
        with self._lock, self._connect() as conn:
            query = "SELECT * FROM price_alerts WHERE owner_id = ?"
            if not include_triggered:
                query += " AND is_active = 1"
            query += " ORDER BY created_at DESC"
            rows = conn.execute(query, (owner_id,)).fetchall()
            return [
                {
                    **dict(r),
                    "is_active": bool(r["is_active"]),
                }
                for r in rows
            ]

    def list_triggered_alerts(self, owner_id: str) -> list[dict[str, Any]]:
        with self._lock, self._connect() as conn:
            rows = conn.execute(
                """
                SELECT * FROM price_alerts
                WHERE owner_id = ? AND is_active = 0 AND triggered_at IS NOT NULL
                ORDER BY triggered_at DESC LIMIT 50
                """,
                (owner_id,),
            ).fetchall()
            return [{**dict(r), "is_active": False} for r in rows]

    def list_all_active_alerts(self) -> list[dict[str, Any]]:
        with self._lock, self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM price_alerts WHERE is_active = 1"
            ).fetchall()
            return [{**dict(r), "is_active": True} for r in rows]

    def mark_alert_triggered(self, alert_id: str, triggered_price: float, message: str) -> dict[str, Any] | None:
        triggered_at = datetime.now(UTC).isoformat()
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                UPDATE price_alerts
                SET is_active = 0, triggered_at = ?, triggered_price = ?, message = ?
                WHERE id = ? AND is_active = 1
                """,
                (triggered_at, float(triggered_price), message, alert_id),
            )
            conn.commit()
            row = conn.execute("SELECT * FROM price_alerts WHERE id = ?", (alert_id,)).fetchone()
            return {**dict(row), "is_active": bool(row["is_active"])} if row else None

    def delete_alert(self, owner_id: str, alert_id: str) -> bool:
        with self._lock, self._connect() as conn:
            cur = conn.execute(
                "DELETE FROM price_alerts WHERE id = ? AND owner_id = ?",
                (alert_id, owner_id),
            )
            conn.commit()
            return cur.rowcount > 0


# Singleton persistence store
store = PersistenceStore()
