"""Unit Tests for Prometheus Telemetry Endpoint."""

from fastapi.testclient import TestClient


def test_prometheus_metrics_endpoint(client: TestClient):
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]
    text = response.text

    assert "callagent_uptime_seconds" in text
    assert "callagent_database_up" in text
    assert "callagent_active_calls" in text
    assert "callagent_spam_intercepts_total" in text
