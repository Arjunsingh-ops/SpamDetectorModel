"""Unit Tests for Enterprise Middleware Headers and Correlation IDs."""

from fastapi.testclient import TestClient


def test_request_id_correlation_header(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert "X-Response-Time-MS" in response.headers
    assert "X-Frame-Options" in response.headers
    assert response.headers["X-Frame-Options"] == "DENY"


def test_custom_request_id_propagation(client: TestClient):
    custom_id = "test-custom-trace-id-12345"
    response = client.get("/health", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == custom_id
