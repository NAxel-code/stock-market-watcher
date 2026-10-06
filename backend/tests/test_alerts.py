from fastapi.testclient import TestClient


def test_create_alert(client: TestClient) -> None:
    res = client.post("/api/v1/alerts", json={"ticker": "BBCA.JK", "target_price": 6300.0, "condition": "ABOVE"})
    assert res.status_code == 200
    data = res.json()
    assert data["ticker"] == "BBCA.JK"
    assert data["target_price"] == 6300.0
    assert data["condition"] == "ABOVE"
    assert "id" in data


def test_list_alerts(client: TestClient) -> None:
    res = client.get("/api/v1/alerts")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_delete_alert(client: TestClient) -> None:
    create_res = client.post("/api/v1/alerts", json={"ticker": "AAPL", "target_price": 250.0, "condition": "BELOW"})
    alert_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/alerts/{alert_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"

    # Deleting again should 404
    del_res2 = client.delete(f"/api/v1/alerts/{alert_id}")
    assert del_res2.status_code == 404
