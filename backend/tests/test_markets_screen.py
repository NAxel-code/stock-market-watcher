"""Tests for the Markets Screen service and endpoint."""

from fastapi.testclient import TestClient

from app.main import app
from app.services import markets_screen

client = TestClient(app)


def test_get_markets_overview_service():
    overview = markets_screen.get_markets_overview()
    assert overview is not None
    assert len(overview.indices) >= 5
    assert len(overview.etfs) >= 4
    assert len(overview.fx_rates) >= 4
    assert len(overview.sovereign_rates) >= 8
    assert len(overview.commodities) >= 5
    assert len(overview.unusual_moves) >= 3

    # Check structure of indices
    sp500 = next((idx for idx in overview.indices if idx.ticker == "^GSPC"), None)
    assert sp500 is not None
    assert sp500.current_price > 0
    assert sp500.category == "INDEX"
    assert sp500.source != ""

    # Check structure of sovereign yield curve
    us_10y = next((r for r in overview.sovereign_rates if r.country == "US" and r.tenor == "10Y"), None)
    assert us_10y is not None
    assert us_10y.yield_rate > 0

    # Check SEA commodity presence
    coal = next((c for c in overview.commodities if "COAL" in c.ticker or "Coal" in c.name), None)
    assert coal is not None
    assert coal.current_price > 0

    # Check unusual movers have z_score_shock
    first_mover = overview.unusual_moves[0]
    assert first_mover.z_score_shock >= 0
    assert first_mover.direction in ("SURGE", "DUMP")


def test_markets_overview_endpoint():
    response = client.get("/api/v1/market/overview")
    assert response.status_code == 200
    data = response.json()
    assert "indices" in data
    assert "etfs" in data
    assert "fx_rates" in data
    assert "sovereign_rates" in data
    assert "commodities" in data
    assert "unusual_moves" in data
    assert "public, max-age=" in response.headers.get("Cache-Control", "")
