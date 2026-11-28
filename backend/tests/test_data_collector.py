from fastapi.testclient import TestClient
from app.main import app
from app.services import data_collector

client = TestClient(app)


def test_convert_fx_same_currency():
    res = data_collector.convert_fx(100.0, "USD", "USD")
    assert res["converted_amount"] == 100.0
    assert res["rate"] == 1.0


def test_convert_fx_different_currencies():
    # USD -> IDR
    res_idr = data_collector.convert_fx(10.0, "USD", "IDR")
    assert res_idr["converted_amount"] > 100_000
    assert res_idr["rate"] > 10_000

    # SGD -> IDR (cross-rate)
    res_cross = data_collector.convert_fx(10.0, "SGD", "IDR")
    assert res_cross["converted_amount"] > 50_000


def test_market_convert_api():
    response = client.get("/api/v1/market/convert?amount=50&from_currency=USD&to_currency=SGD")
    assert response.status_code == 200
    data = response.json()
    assert data["from_currency"] == "USD"
    assert data["to_currency"] == "SGD"
    assert data["amount"] == 50.0
    assert data["converted_amount"] > 0


def test_market_health_telemetry():
    response = client.get("/api/v1/market/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "metrics" in data
    assert "primary_source" in data["metrics"]


def test_trigger_data_collection():
    response = client.post("/api/v1/market/collect")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["collected_quotes"] > 0
    assert data["fx_pairs"] >= 4
