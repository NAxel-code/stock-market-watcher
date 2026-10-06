import pytest
from pydantic import ValidationError

from app.models.schemas import StockQuoteResponse, WatchlistAddRequest


def test_stock_quote_schema_valid() -> None:
    data = {
        "ticker": "TSLA",
        "company_name": "Tesla Inc.",
        "current_price": 200.50,
        "previous_close": 198.0,
        "change": 2.5,
        "change_percent": 1.26,
    }
    stock = StockQuoteResponse(**data)
    assert stock.ticker == "TSLA"
    assert stock.current_price == 200.50
    assert stock.is_stale is False


def test_stock_quote_schema_invalid_price() -> None:
    with pytest.raises(ValidationError):
        StockQuoteResponse(
            ticker="TSLA",
            company_name="Tesla",
            current_price="not_a_number",
            previous_close=198.0,
            change=0,
            change_percent=0,
        )


def test_watchlist_add_request_valid() -> None:
    req = WatchlistAddRequest(ticker="MSFT")
    assert req.ticker == "MSFT"


def test_watchlist_add_request_too_long() -> None:
    with pytest.raises(ValidationError):
        WatchlistAddRequest(ticker="TOOLONGTICKER")
