from unittest.mock import MagicMock, patch

import pytest

from app.core.exceptions import ExternalAPIError, StockNotFoundError
from app.services import yahoo_finance as yf_service


def test_safe_float() -> None:
    assert yf_service._safe_float("123.45") == 123.45
    assert yf_service._safe_float(None, 10.0) == 10.0
    assert yf_service._safe_float("invalid", 0.0) == 0.0
    assert yf_service._safe_float(42) == 42.0


def test_safe_int() -> None:
    assert yf_service._safe_int("100") == 100
    assert yf_service._safe_int(None, 5) == 5
    assert yf_service._safe_int("invalid", 0) == 0
    assert yf_service._safe_int(3.14) == 3


def test_get_quote_cache_hit() -> None:
    yf_service._quote_cache["MOCK_HIT"] = {
        "ticker": "MOCK_HIT",
        "company_name": "Mock Hit Co",
        "current_price": 100.0,
        "previous_close": 98.0,
        "change": 2.0,
        "change_percent": 2.04,
        "currency": "USD",
        "market_cap": None,
        "volume": None,
        "day_high": None,
        "day_low": None,
        "fifty_two_week_high": None,
        "fifty_two_week_low": None,
    }

    quote = yf_service.get_quote("MOCK_HIT")
    assert quote.ticker == "MOCK_HIT"
    assert quote.current_price == 100.0
    assert quote.is_stale is False


def test_get_quote_zero_price_raises_not_found() -> None:
    with patch("yfinance.Ticker") as mock_ticker:
        mock_instance = MagicMock()
        mock_instance.info = {"regularMarketPrice": 0.0}
        mock_ticker.return_value = mock_instance

        with pytest.raises(StockNotFoundError):
            yf_service.get_quote("ZERO_PRICE_TICKER")


def test_get_quote_stale_fallback_on_exception() -> None:
    yf_service._stale_quote_cache["STALE_TICKER"] = {
        "ticker": "STALE_TICKER",
        "company_name": "Stale Co",
        "current_price": 50.0,
        "previous_close": 49.0,
        "change": 1.0,
        "change_percent": 2.04,
        "currency": "USD",
    }
    # Clear active cache to force fetch
    yf_service._quote_cache.pop("STALE_TICKER", None)

    with patch("yfinance.Ticker", side_effect=Exception("Network error")):
        quote = yf_service.get_quote("STALE_TICKER")
        assert quote.ticker == "STALE_TICKER"
        assert quote.is_stale is True


def test_get_history_empty_raises_not_found() -> None:
    yf_service._history_cache.clear()
    with patch("yfinance.Ticker") as mock_ticker:
        mock_instance = MagicMock()
        import pandas as pd
        mock_instance.history.return_value = pd.DataFrame()
        mock_ticker.return_value = mock_instance

        with pytest.raises(StockNotFoundError):
            yf_service.get_history("EMPTY_HISTORY", "1d")


def test_get_history_unexpected_error_raises_external_error() -> None:
    yf_service._history_cache.clear()
    with patch("yfinance.Ticker", side_effect=Exception("Timeout")):
        with pytest.raises(ExternalAPIError):
            yf_service.get_history("FAIL_TICKER", "1d")


def test_search_tickers_cached_and_fallback() -> None:
    yf_service._search_cache["query_cached"] = [
        {"ticker": "ABC", "name": "ABC Corp", "exchange": "NYSE", "type": "EQUITY"}
    ]
    results = yf_service.search_tickers("query_cached")
    assert len(results) == 1
    assert results[0].ticker == "ABC"

    with patch("yfinance.Search", side_effect=Exception("Search down")):
        results_fail = yf_service.search_tickers("new_failing_query")
        assert results_fail == []


def test_get_batch_quotes_skips_errors() -> None:
    valid_quote = {
        "ticker": "GOOD",
        "company_name": "Good Co",
        "current_price": 10.0,
        "previous_close": 9.0,
        "change": 1.0,
        "change_percent": 11.11,
        "currency": "USD",
    }
    yf_service._quote_cache["GOOD"] = valid_quote

    with patch("app.services.yahoo_finance.get_quote") as mock_get_quote:
        def side_effect(ticker: str):
            if ticker == "GOOD":
                from app.models.schemas import StockQuoteResponse
                return StockQuoteResponse(**valid_quote)
            raise StockNotFoundError(ticker)

        mock_get_quote.side_effect = side_effect
        batch = yf_service.get_batch_quotes(["GOOD", "BAD"])
        assert len(batch) == 1
        assert batch[0].ticker == "GOOD"
