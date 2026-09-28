"""Tests for Stage 5 & 8 REST APIs (/ready, /users/me, /spam, /analytics, /settings)."""

import uuid
from fastapi.testclient import TestClient


def test_ready_probe(client: TestClient):
    resp = client.get("/ready")
    assert resp.status_code in [200, 503]
    data = resp.json()
    assert "ready" in data


def test_analytics_overview_and_daily(client: TestClient):
    resp = client.get("/api/v1/analytics/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert "totalCalls" in data
    assert "spamCallsBlocked" in data

    daily = client.get("/api/v1/analytics/daily")
    assert daily.status_code == 200
    assert "hourlyVolume" in daily.json()


def test_settings_get_and_patch(client: TestClient):
    get_resp = client.get("/api/v1/settings")
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert "forwardingRules" in data

    patch_resp = client.patch(
        "/api/v1/settings",
        json={"preferredLanguage": "hi-IN", "notificationSettings": {"emailOnSpam": True}}
    )
    assert patch_resp.status_code == 200
    updated = patch_resp.json()
    assert updated["preferredLanguage"] == "hi-IN"


def test_spam_queue_and_review(client: TestClient):
    queue_resp = client.get("/api/v1/spam")
    assert queue_resp.status_code == 200
    queue = queue_resp.json()
    assert isinstance(queue, list)

    call_id = str(uuid.uuid4())
    rev_resp = client.post(
        f"/api/v1/spam/{call_id}/review",
        json={"decision": "confirmed_spam", "submit_telecom_report": True, "notes": "Verified fraud scam"}
    )
    assert rev_resp.status_code == 200
    res = rev_resp.json()
    assert res["status"] == "success"
    assert res["reported_to_authority"] is True
