"""Unit and integration tests for Portfolio Engine and Router."""

from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import PortfolioHoldingItem
from app.services import portfolio_engine

client = TestClient(app)


def test_analyze_portfolio_service_default():
    analysis = portfolio_engine.analyze_portfolio(
        holdings=portfolio_engine.DEFAULT_INSTITUTIONAL_PORTFOLIO,
        base_currency="SGD",
    )
    assert analysis is not None
    assert analysis.base_currency == "SGD"
    assert analysis.total_value_base > 0
    assert analysis.total_cost_base > 0
    assert len(analysis.holdings) == len(portfolio_engine.DEFAULT_INSTITUTIONAL_PORTFOLIO)

    # Check attribution decomposition
    assert abs(analysis.unrealized_pnl_base - (analysis.total_stock_move_pnl_base + analysis.total_fx_move_pnl_base)) < 1.0

    # Check allocation breakdown
    assert "US" in analysis.allocation.by_country
    assert "SG" in analysis.allocation.by_country
    assert "ID" in analysis.allocation.by_country
    assert "USD" in analysis.allocation.by_currency

    # Check 30% US Withholding Tax applied to US holdings
    nvda_perf = next((h for h in analysis.holdings if h.holding.ticker == "NVDA"), None)
    assert nvda_perf is not None
    assert nvda_perf.is_us_situs is True
    assert nvda_perf.us_withholding_tax_applied is True
    assert nvda_perf.est_annual_dividend_net < nvda_perf.est_annual_dividend_gross

    # Check SG holding (DBS) has 0% withholding tax (net == gross)
    dbs_perf = next((h for h in analysis.holdings if h.holding.ticker == "D05.SI"), None)
    assert dbs_perf is not None
    assert dbs_perf.is_us_situs is False
    assert dbs_perf.us_withholding_tax_applied is False
    assert dbs_perf.est_annual_dividend_net == dbs_perf.est_annual_dividend_gross

    # Check US Estate Tax tracker
    assert analysis.risk.us_estate_tax_limit_usd == 60000.0
    assert analysis.risk.us_estate_tax_exposure_usd > 0


def test_analyze_portfolio_usd_currency():
    analysis = portfolio_engine.analyze_portfolio(
        holdings=portfolio_engine.DEFAULT_INSTITUTIONAL_PORTFOLIO,
        base_currency="USD",
    )
    assert analysis.base_currency == "USD"
    assert analysis.total_value_base > 0


def test_get_default_portfolio_api():
    response = client.get("/api/v1/portfolio/default")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 4
    assert any(item["ticker"] == "NVDA" for item in data)
    assert any(item["ticker"] == "D05.SI" for item in data)


def test_get_portfolio_analyze_api():
    response = client.get("/api/v1/portfolio/analyze?base_currency=SGD")
    assert response.status_code == 200
    data = response.json()
    assert data["base_currency"] == "SGD"
    assert "total_value_base" in data
    assert "holdings" in data
    assert "allocation" in data
    assert "risk" in data


def test_post_portfolio_analyze_custom():
    custom_holdings = [
        PortfolioHoldingItem(
            id="custom-1",
            ticker="AAPL",
            company_name="Apple Inc.",
            exchange="US",
            asset_type="EQUITY",
            shares=50.0,
            cost_basis=150.0,
            currency="USD",
            country="US",
            sector="Technology",
        ).model_dump()
    ]
    response = client.post(
        "/api/v1/portfolio/analyze",
        json={"base_currency": "SGD", "holdings": custom_holdings},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["holdings"]) == 1
    assert data["holdings"][0]["holding"]["ticker"] == "AAPL"
