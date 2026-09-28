"""Tests for Token Refresh, Revocation, and Stage 2 Auth Endpoints."""

from fastapi.testclient import TestClient


def test_auth_login_and_me_flow(client: TestClient):
    login_resp = client.post("/api/v1/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data

    # Use access token for /auth/me
    token = token_data["access_token"]
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    user_data = me_resp.json()
    assert user_data["email"] == "admin@example.com"
    assert user_data["role"] == "admin"
