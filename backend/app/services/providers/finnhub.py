"""Finnhub market data provider fallback (free tier support)."""

import logging
from typing import Any

import httpx

from app.services.providers.base import BaseMarketDataProvider

logger = logging.getLogger(__name__)


class FinnhubProvider(BaseMarketDataProvider):
    """Secondary market data provider using Finnhub REST API."""

    BASE_URL = "https://finnhub.io/api/v1"

    def __init__(self, api_key: str = "") -> None:
        self.api_key = api_key

    @property
    def name(self) -> str:
        return "Finnhub"

    def get_quote(self, ticker: str) -> dict[str, Any] | None:
        """Fetch quote via Finnhub REST API."""
        if not self.api_key:
            return None

        # Finnhub free tier primarily supports US symbols (e.g. AAPL, not BBCA.JK)
        clean_ticker = ticker.upper()
        if clean_ticker.endswith(".JK"):
            return None

        try:
            with httpx.Client(timeout=4.0) as client:
                res = client.get(
                    f"{self.BASE_URL}/quote",
                    params={"symbol": clean_ticker, "token": self.api_key},
                )
                if res.status_code != 200:
                    return None

                data = res.json()
                current_price = float(data.get("c", 0.0))
                prev_close = float(data.get("pc", 0.0))

                if current_price <= 0.0:
                    return None

                change = float(data.get("d", current_price - prev_close))
                change_pct = float(data.get("dp", (change / prev_close * 100) if prev_close else 0.0))

                return {
                    "ticker": clean_ticker,
                    "company_name": clean_ticker,
                    "current_price": current_price,
                    "previous_close": prev_close,
                    "change": round(change, 4),
                    "change_percent": round(change_pct, 4),
                    "day_high": float(data.get("h", 0.0)) or None,
                    "day_low": float(data.get("l", 0.0)) or None,
                    "currency": "USD",
                }
        except Exception as exc:
            logger.debug("Finnhub quote fetch failed for %s: %s", ticker, exc)
            return None

    def get_history(self, ticker: str, period: str) -> dict[str, Any] | None:
        return None

    def search(self, query: str) -> list[dict[str, Any]]:
        return []
