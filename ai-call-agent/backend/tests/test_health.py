"""Unit and Smoke Tests for /health Endpoint."""

from fastapi.testclient import TestClient


def test_health_endpoint_returns_200(client: TestClient):
    """Verify /health returns 200 without requiring any credentials or DB."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ai-call-agent-backend"
    assert "timestamp" in data
    assert "version" in data


def test_api_v1_health_alias(client: TestClient):
    """Verify /api/v1/health also returns 200."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
