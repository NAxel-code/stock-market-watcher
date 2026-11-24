from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_security_master_list():
    response = client.get("/api/v1/securities/master")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "securities" in data
    assert data["total"] >= 15
    tickers = [s["ticker"] for s in data["securities"]]
    assert "AAPL" in tickers
    assert "D05.SI" in tickers
    assert "BBCA.JK" in tickers


def test_get_security_master_filter_by_exchange():
    # Filter SGX
    res_sgx = client.get("/api/v1/securities/master?exchange=SGX")
    assert res_sgx.status_code == 200
    sgx_data = res_sgx.json()
    for s in sgx_data["securities"]:
        assert s["exchange"] == "SGX"
        assert s["currency"] == "SGD"

    # Filter IDX
    res_idx = client.get("/api/v1/securities/master?exchange=IDX")
    assert res_idx.status_code == 200
    idx_data = res_idx.json()
    for s in idx_data["securities"]:
        assert s["exchange"] == "IDX"
        assert s["currency"] == "IDR"


def test_get_security_detail():
    response = client.get("/api/v1/securities/D05.SI")
    assert response.status_code == 200
    sec = response.json()
    assert sec["ticker"] == "D05.SI"
    assert sec["exchange"] == "SGX"
    assert sec["currency"] == "SGD"
    assert "DBS" in sec["name"]

    # Not found case
    res_404 = client.get("/api/v1/securities/INVALID_TICKER_XYZ_123")
    assert res_404.status_code == 404


def test_upsert_security():
    payload = {
        "ticker": "TEST.SI",
        "name": "Test Singapore Equity",
        "exchange": "SGX",
        "currency": "SGD",
        "asset_type": "EQUITY",
        "sector": "Technology",
        "is_primary": True,
        "is_active": True,
    }
    response = client.post("/api/v1/securities/master", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["ticker"] == "TEST.SI"

    # Verify retrieval
    get_res = client.get("/api/v1/securities/TEST.SI")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Test Singapore Equity"
