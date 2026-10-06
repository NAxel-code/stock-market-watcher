from unittest.mock import patch

from fastapi.testclient import TestClient

from app.models.schemas import StockQuoteResponse


def test_health_check(client: TestClient) -> None:
    """Health check returns 200 OK."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "StockPulse API"


def test_stock_quote_success(client: TestClient) -> None:
    """Stock quote endpoint returns data for a valid ticker."""
    mock_quote = StockQuoteResponse(
        ticker="AAPL",
        company_name="Apple Inc.",
        current_price=150.0,
        previous_close=148.0,
        change=2.0,
        change_percent=1.35,
    )
    with patch("app.api.v1.stocks.yf_service.get_quote", return_value=mock_quote):
        response = client.get("/api/v1/stocks/AAPL/quote")
    assert response.status_code == 200
    data = response.json()
    assert data["ticker"] == "AAPL"
    assert data["current_price"] == 150.0


def test_stock_quote_not_found(client: TestClient) -> None:
    """Stock quote returns 404 for invalid ticker."""
    from app.core.exceptions import StockNotFoundError
    with patch("app.api.v1.stocks.yf_service.get_quote", side_effect=StockNotFoundError("INVALID")):
        response = client.get("/api/v1/stocks/INVALID/quote")
    assert response.status_code == 404
    assert "not found" in response.json()["error"].lower()


def test_stock_search(client: TestClient) -> None:
    """Search returns a list of results."""
    from app.models.schemas import StockSearchResult
    mock_results = [StockSearchResult(ticker="AAPL", name="Apple Inc.", exchange="NASDAQ")]
    with patch("app.api.v1.stocks.yf_service.search_tickers", return_value=mock_results):
        response = client.get("/api/v1/stocks/search?q=apple")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["ticker"] == "AAPL"


def test_stock_history(client: TestClient) -> None:
    """History endpoint returns data."""
    from app.models.schemas import StockHistoryResponse
    mock_hist = StockHistoryResponse(ticker="AAPL", period="1m", data=[])
    with patch("app.api.v1.stocks.yf_service.get_history", return_value=mock_hist):
        response = client.get("/api/v1/stocks/AAPL/history?period=1m")
    assert response.status_code == 200
    assert response.json()["ticker"] == "AAPL"


def test_market_summary(client: TestClient) -> None:
    """Market summary endpoint returns indices."""
    from app.models.schemas import MarketSummaryResponse
    mock_summary = MarketSummaryResponse(indices=[], top_gainers=[], top_losers=[])
    with patch("app.api.v1.market.yf_service.get_market_summary", return_value=mock_summary):
        response = client.get("/api/v1/market/summary")
    assert response.status_code == 200


def test_market_status(client: TestClient) -> None:
    """Market status endpoint returns IDX and US operational statuses."""
    response = client.get("/api/v1/market/status")
    assert response.status_code == 200
    data = response.json()
    assert "idx" in data
    assert "us" in data
    assert "is_open" in data["idx"]
    assert "session_name" in data["idx"]
    assert "is_open" in data["us"]


def test_default_watchlist(client: TestClient) -> None:
    """Default watchlist returns pre-seeded tickers."""
    response = client.get("/api/v1/watchlist/default")
    assert response.status_code == 200
    tickers = response.json()
    assert "AAPL" in tickers
    assert "BBCA.JK" in tickers


def test_batch_quotes(client: TestClient) -> None:
    """Batch quotes endpoint returns multiple stock quotes."""
    mock_quotes = [
        StockQuoteResponse(
            ticker="AAPL",
            company_name="Apple Inc.",
            current_price=150.0,
            previous_close=148.0,
            change=2.0,
            change_percent=1.35,
        ),
        StockQuoteResponse(
            ticker="MSFT",
            company_name="Microsoft Corp.",
            current_price=300.0,
            previous_close=295.0,
            change=5.0,
            change_percent=1.69,
        ),
    ]
    with patch("app.api.v1.stocks.yf_service.get_batch_quotes", return_value=mock_quotes):
        response = client.get("/api/v1/stocks/batch?tickers=AAPL,MSFT")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["ticker"] == "AAPL"
    assert data[1]["ticker"] == "MSFT"


def test_watchlist_validate_valid_ticker(client: TestClient) -> None:
    """Validate returns valid=True when ticker exists."""
    mock_quote = StockQuoteResponse(
        ticker="AAPL",
        company_name="Apple Inc.",
        current_price=150.0,
        previous_close=148.0,
        change=2.0,
        change_percent=1.35,
    )
    with patch("app.api.v1.watchlist.yf_service.get_quote", return_value=mock_quote):
        response = client.post("/api/v1/watchlist/validate", json={"ticker": "AAPL"})
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["ticker"] == "AAPL"
    assert data["name"] == "Apple Inc."


def test_watchlist_validate_invalid_ticker(client: TestClient) -> None:
    """Validate returns valid=False when ticker does not exist."""
    from app.core.exceptions import StockNotFoundError
    with patch("app.api.v1.watchlist.yf_service.get_quote", side_effect=StockNotFoundError("XYZ")):
        response = client.post("/api/v1/watchlist/validate", json={"ticker": "XYZ"})
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert data["ticker"] == "XYZ"


def test_stock_history_invalid_period(client: TestClient) -> None:
    """Invalid period query parameter returns 422 Unprocessable Entity."""
    response = client.get("/api/v1/stocks/AAPL/history?period=invalid_period")
    assert response.status_code == 422


def test_stock_search_empty_query(client: TestClient) -> None:
    """Empty query param returns 422."""
    response = client.get("/api/v1/stocks/search?q=")
    assert response.status_code == 422

