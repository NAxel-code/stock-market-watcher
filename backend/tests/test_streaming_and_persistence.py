"""Tests for real-time SSE streaming hub, auth/IDOR isolation, cloud persistence, and 24/7 alert evaluation."""

import asyncio
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.db.store import PersistenceStore
from app.models.schemas import FXRateItem, FXRatesResponse, StockQuoteResponse
from app.services import alert_worker
from app.services.stream_hub import QuoteStreamHub


@pytest.fixture
def isolated_store(tmp_path, monkeypatch):
    """Provide an isolated temporary SQLite store patched into routers and workers."""
    db_file = str(tmp_path / "test_stockpulse.db")
    test_store = PersistenceStore(db_path=db_file)
    monkeypatch.setattr("app.db.store.store", test_store)
    monkeypatch.setattr("app.api.v1.auth.store", test_store)
    monkeypatch.setattr("app.api.v1.alerts.store", test_store)
    monkeypatch.setattr("app.api.v1.watchlist.store", test_store)
    monkeypatch.setattr("app.api.v1.portfolio.store", test_store)
    monkeypatch.setattr("app.api.v1.paper.store", test_store)
    monkeypatch.setattr("app.services.alert_worker.store", test_store)
    return test_store


def _mock_quote(ticker: str, price: float) -> StockQuoteResponse:
    return StockQuoteResponse(
        ticker=ticker.upper(),
        company_name=f"{ticker.upper()} Corp",
        current_price=price,
        previous_close=price * 0.99,
        change=round(price * 0.01, 2),
        change_percent=1.01,
        currency="USD",
        is_stale=False,
    )


def test_auth_lifecycle_and_idor_isolation(client: TestClient, isolated_store) -> None:
    # 1. Guest workspace creates alert before signing up
    ws_headers = {"X-Workspace-ID": "guest-browser-123"}
    ws_alert = client.post(
        "/api/v1/alerts",
        json={"ticker": "NVDA", "target_price": 150.0, "condition": "ABOVE"},
        headers=ws_headers,
    )
    assert ws_alert.status_code == 200

    # 2. User A registers with workspace_id -> migrates workspace alert into User A account
    reg_a = client.post(
        "/api/v1/auth/register",
        json={
            "email": "alice@quant.io",
            "password": "StrongPassword123",
            "display_name": "Alice",
            "workspace_id": "guest-browser-123",
        },
    )
    assert reg_a.status_code == 200
    token_a = reg_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Verify /auth/me
    me_res = client.get("/api/v1/auth/me", headers=headers_a)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "alice@quant.io"

    # User A sees migrated alert
    alerts_a = client.get("/api/v1/alerts", headers=headers_a).json()
    assert len(alerts_a) == 1
    alert_a_id = alerts_a[0]["id"]

    # 3. Duplicate registration fails with 409
    dup = client.post(
        "/api/v1/auth/register",
        json={"email": "alice@quant.io", "password": "StrongPassword123"},
    )
    assert dup.status_code == 409

    # 4. Wrong password login returns 401
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": "alice@quant.io", "password": "WrongPassword"},
    )
    assert bad_login.status_code == 401

    # 5. User B registers and CANNOT read or delete User A's alerts (IDOR check)
    reg_b = client.post(
        "/api/v1/auth/register",
        json={"email": "bob@quant.io", "password": "AnotherPassword123"},
    )
    token_b = reg_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    alerts_b = client.get("/api/v1/alerts", headers=headers_b).json()
    assert alerts_b == []

    del_attempt = client.delete(f"/api/v1/alerts/{alert_a_id}", headers=headers_b)
    assert del_attempt.status_code == 404


def test_persistent_watchlist_portfolio_and_paper_sync(client: TestClient, isolated_store) -> None:
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": "trader@quant.io", "password": "SecretPass99"},
    )
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # Watchlist persistence
    add_res = client.post("/api/v1/watchlist/items", json={"ticker": "MSFT"}, headers=headers)
    assert add_res.status_code == 200
    assert "MSFT" in add_res.json()["tickers"]

    sync_res = client.post(
        "/api/v1/watchlist/sync",
        json={"tickers": ["NVDA", "BBCA.JK"]},
        headers=headers,
    )
    assert sync_res.json()["tickers"] == ["NVDA", "BBCA.JK"]

    # Portfolio persistence
    holdings_res = client.get("/api/v1/portfolio/holdings", headers=headers)
    assert holdings_res.status_code == 200
    assert len(holdings_res.json()) > 0

    upsert_res = client.post(
        "/api/v1/portfolio/holdings",
        json={
            "id": "custom-1",
            "ticker": "AAPL",
            "company_name": "Apple Inc.",
            "exchange": "US",
            "asset_type": "EQUITY",
            "shares": 15,
            "lot_size": 1,
            "cost_basis": 200.0,
            "currency": "USD",
        },
        headers=headers,
    )
    assert upsert_res.status_code == 200
    assert upsert_res.json()["id"] == "custom-1"

    # Paper trading state persistence
    paper_save = client.put(
        "/api/v1/paper/state",
        json={
            "cash_balance_usd": 85000.0,
            "initial_capital_usd": 100000.0,
            "positions": [
                {
                    "id": "pos-1",
                    "ticker": "NVDA",
                    "side": "LONG",
                    "shares": 100,
                    "entry_price": 150.0,
                    "current_price": 155.0,
                    "currency": "USD",
                    "opened_at": "2026-11-26T00:00:00Z",
                }
            ],
            "trades": [],
        },
        headers=headers,
    )
    assert paper_save.status_code == 200
    paper_get = client.get("/api/v1/paper/state", headers=headers)
    assert paper_get.json()["cash_balance_usd"] == 85000.0
    assert len(paper_get.json()["positions"]) == 1


def test_background_alert_worker_evaluates_without_browser(isolated_store) -> None:
    alert = isolated_store.create_alert("user:owner-1", "BBCA.JK", 5900.0, "BELOW")
    assert alert["is_active"] is True

    with patch("app.services.alert_worker.yf_service.get_batch_quotes") as mock_batch:
        mock_batch.return_value = [_mock_quote("BBCA.JK", 5800.0)]
        triggered = alert_worker.evaluate_pending_alerts(owner_id=None)

    assert len(triggered) == 1
    assert triggered[0]["ticker"] == "BBCA.JK"
    assert triggered[0]["current_price"] == 5800.0

    # Alert should now be marked inactive and present in triggered history
    triggered_rows = isolated_store.list_triggered_alerts("user:owner-1")
    assert len(triggered_rows) == 1
    assert triggered_rows[0]["is_active"] is False
    assert triggered_rows[0]["triggered_price"] == 5800.0


def test_sse_stream_endpoint_emits_snapshot(client: TestClient) -> None:
    mock_fx = FXRatesResponse(
        rates=[FXRateItem(pair="USD/SGD", from_currency="USD", to_currency="SGD", rate=1.345)],
        as_of="2026-11-26T00:00:00Z",
    )
    with (
        patch("app.api.v1.stream.yf_service.get_batch_quotes", return_value=[_mock_quote("AAPL", 230.5)]),
        patch("app.api.v1.stream.yf_service.get_live_fx_rates", return_value=mock_fx),
    ):
        res = client.get("/api/v1/stream/quotes?tickers=AAPL&oneshot=true")
        assert res.status_code == 200
        assert "text/event-stream" in res.headers["content-type"]
        assert "event: snapshot" in res.text
        assert '"ticker": "AAPL"' in res.text
        assert "230.5" in res.text


def test_stream_hub_delta_deduplication() -> None:
    hub = QuoteStreamHub()
    loop = asyncio.new_event_loop()
    try:
        sub = hub.register("sub-1", "ws:test", ["AAPL"], loop)
        mock_fx = FXRatesResponse(
            rates=[FXRateItem(pair="USD/SGD", from_currency="USD", to_currency="SGD", rate=1.345)],
            as_of="2026-11-26T00:00:00Z",
        )
        with (
            patch("app.services.stream_hub.yf_service.get_batch_quotes", return_value=[_mock_quote("AAPL", 230.5)]),
            patch("app.services.stream_hub.yf_service.get_live_fx_rates", return_value=mock_fx),
        ):
            assert hub.broadcast_quotes() == 1
            # Same price again -> deduplicated, 0 dispatched
            assert hub.broadcast_quotes() == 0

        with (
            patch("app.services.stream_hub.yf_service.get_batch_quotes", return_value=[_mock_quote("AAPL", 231.0)]),
            patch("app.services.stream_hub.yf_service.get_live_fx_rates", return_value=mock_fx),
        ):
            # Changed price -> dispatched
            assert hub.broadcast_quotes() == 1
            loop.run_until_complete(asyncio.sleep(0))
            assert sub.queue.qsize() == 2
    finally:
        loop.close()
