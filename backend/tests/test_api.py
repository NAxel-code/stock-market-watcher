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


def test_stock_technical_desk(client: TestClient) -> None:
    """Technical desk endpoint returns complete analysis report."""
    from app.models.schemas import (
        AnalysisDeskResponse,
        MarketStructure,
        MomentumMetrics,
        RelativeStrengthMetrics,
        ScenarioProjection,
        StageInfo,
        TradePlan,
        VsaMetrics,
    )
    mock_desk = AnalysisDeskResponse(
        ticker="AAPL",
        company_name="Apple Inc.",
        current_price=220.50,
        currency="USD",
        as_of_date="2026-10-20",
        stage=StageInfo(
            stage_number=2,
            stage_name="Stage 2 - Advancing / Markup",
            bias="BULLISH",
            confidence_pct=85,
            description="Bullish markup",
        ),
        trade_plan=TradePlan(
            verdict="BUY ON WEAKNESS",
            current_price=220.50,
            buy_area_min=215.0,
            buy_area_max=218.0,
            stop_loss=210.0,
            target_1=235.0,
            target_2=245.0,
            risk_reward_ratio="1:2.1",
            rationale="Test rationale",
        ),
        scenarios=[
            ScenarioProjection(
                name="Bullish Rebound",
                direction="UP",
                probability_pct=60,
                trigger_condition="Above 225",
                price_target=240.0,
                price_target_pct=8.8,
                supporting_factors=["Factor 1"],
                opposing_factors=[],
            ),
            ScenarioProjection(
                name="Bearish Continuation",
                direction="DOWN",
                probability_pct=25,
                trigger_condition="Below 210",
                price_target=200.0,
                price_target_pct=-9.3,
                supporting_factors=[],
                opposing_factors=["Support"],
            ),
            ScenarioProjection(
                name="Base Consolidation",
                direction="SIDEWAYS",
                probability_pct=15,
                trigger_condition="Rangebound",
                price_target=220.0,
                price_target_pct=0.0,
                supporting_factors=[],
                opposing_factors=[],
            ),
        ],
        market_structure=MarketStructure(
            trend_structure="HH-HL",
            trend_description="Uptrend",
            nearest_support=215.0,
            nearest_resistance=230.0,
            drawdown_300d_pct=-5.2,
            peak_300d_price=232.0,
            ma20=218.0,
            ma50=210.0,
            ma200=195.0,
            ma200_slope_pct=1.2,
            ma_stack_status="BULLISH_ALIGNMENT",
        ),
        vsa=VsaMetrics(
            up_down_volume_ratio_20d=1.45,
            participation_status="Dominant Buying Pressure",
            is_selling_climax=False,
            is_stopping_volume=False,
            is_absorption=True,
            volume_surge_ratio=1.1,
        ),
        momentum=MomentumMetrics(
            rsi_14=58.5,
            rsi_status="NEUTRAL",
            macd_line=2.1,
            macd_signal=1.8,
            macd_histogram=0.3,
            macd_bias="BULLISH",
            adx_14=26.4,
            trend_strength="STRONG_TREND",
            stoch_k=65.0,
            stoch_d=62.0,
            cmf_20=0.08,
            cmf_status="NET_INFLOW",
        ),
        relative_strength=RelativeStrengthMetrics(
            benchmark_ticker="^GSPC",
            benchmark_name="S&P 500",
            stock_1m_return_pct=5.4,
            benchmark_1m_return_pct=2.1,
            alpha_pct=3.3,
            rating="OUTPERFORMING",
        ),
        mindset_guardrail="Test mindset rule",
    )
    with patch("app.api.v1.stocks.yf_service.get_technical_desk", return_value=mock_desk):
        response = client.get("/api/v1/stocks/AAPL/desk")
    assert response.status_code == 200
    data = response.json()
    assert data["ticker"] == "AAPL"
    assert data["stage"]["stage_number"] == 2
    assert data["trade_plan"]["verdict"] == "BUY ON WEAKNESS"
    assert len(data["scenarios"]) == 3



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


def test_watchlist_correlation_endpoint(client: TestClient) -> None:
    """Watchlist correlation returns raw and denoised matrix with RMT threshold."""
    response = client.post("/api/v1/watchlist/correlation", json={"tickers": ["AAPL", "MSFT"]})
    assert response.status_code == 200
    data = response.json()
    assert "tickers" in data
    assert "raw_correlation" in data
    assert "denoised_correlation" in data
    assert "lambda_plus" in data
    assert "signal_count" in data
    assert data["lambda_plus"] > 0

