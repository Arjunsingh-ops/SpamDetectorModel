"""Unit and Smoke Tests for /api/v1/status Endpoint."""

from fastapi.testclient import TestClient


def test_status_endpoint_returns_operational_data(client: TestClient):
    """Verify /api/v1/status exposes environment, adapter modes, and db status."""
    response = client.get("/api/v1/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "environment" in data
    assert "database" in data
    assert "adapters" in data
    assert "telephony" in data["adapters"]
    assert "voice_ai" in data["adapters"]
    assert "spam_engine" in data["adapters"]
    assert data["adapters"]["telephony"]["provider"] == "mock"
    assert data["adapters"]["telephony"]["ready"] is True
    assert "capabilities" in data
