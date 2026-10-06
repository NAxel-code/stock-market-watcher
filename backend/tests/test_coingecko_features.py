from app.services.yahoo_finance import _enrich_quote_metadata, DEFAULT_SECTORS
from app.models.schemas import StockQuoteResponse


def test_distance_from_52w_high_and_low() -> None:
    data = {
        "ticker": "AAPL",
        "company_name": "Apple Inc.",
        "current_price": 150.0,
        "previous_close": 148.0,
        "change": 2.0,
        "change_percent": 1.35,
        "fifty_two_week_high": 200.0,
        "fifty_two_week_low": 100.0,
    }
    _enrich_quote_metadata(data, "AAPL")

    # (150 - 200) / 200 * 100 = -25.0%
    assert data["distance_from_52w_high"] == -25.0
    # (150 - 100) / 100 * 100 = 50.0%
    assert data["distance_from_52w_low"] == 50.0
    # Sector for AAPL
    assert data["sector"] == "Technology"
    assert data["industry"] == "Consumer Electronics"
    assert isinstance(data["sparkline_7d"], list)


def test_distance_none_when_no_52w_bounds() -> None:
    data = {
        "ticker": "TEST",
        "company_name": "Test Co",
        "current_price": 50.0,
        "previous_close": 50.0,
        "change": 0.0,
        "change_percent": 0.0,
        "fifty_two_week_high": None,
        "fifty_two_week_low": None,
    }
    _enrich_quote_metadata(data, "TEST")

    assert data["distance_from_52w_high"] is None
    assert data["distance_from_52w_low"] is None


def test_stock_quote_response_schema_with_coingecko_fields() -> None:
    quote = StockQuoteResponse(
        ticker="BBCA.JK",
        company_name="PT Bank Central Asia Tbk",
        current_price=6200.0,
        previous_close=6150.0,
        change=50.0,
        change_percent=0.81,
        sector="Financial Services",
        industry="Banks—Regional",
        distance_from_52w_high=-15.4,
        distance_from_52w_low=28.6,
        sparkline_7d=[6000.0, 6050.0, 6100.0, 6150.0, 6200.0],
    )
    assert quote.sector == "Financial Services"
    assert quote.distance_from_52w_high == -15.4
    assert len(quote.sparkline_7d) == 5
