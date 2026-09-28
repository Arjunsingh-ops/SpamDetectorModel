"""Integration Tests for Telephony Inbound and Status Webhook Endpoints."""

from fastapi.testclient import TestClient


def test_incoming_call_webhook_success(client: TestClient):
    payload = {
        "CallSid": "CS_TEST_INCOMING_001",
        "From": "+919876543210",
        "To": "+911140001234",
        "CallStatus": "ringing",
        "Direction": "inbound",
    }
    response = client.post("/api/v1/telephony/incoming", data=payload)
    assert response.status_code == 200
    assert "application/xml" in response.headers["content-type"]
    assert "<Response>" in response.text
    assert "<Connect>" in response.text


def test_incoming_call_webhook_idempotency(client: TestClient):
    payload = {
        "CallSid": "CS_TEST_IDEMPOTENT_001",
        "From": "+919876543210",
        "To": "+911140001234",
    }
    resp1 = client.post("/api/v1/telephony/incoming", data=payload)
    assert resp1.status_code == 200

    # Repeat call webhook - must return 200 without raising DB uniqueness error
    resp2 = client.post("/api/v1/telephony/incoming", data=payload)
    assert resp2.status_code == 200


def test_status_webhook_update(client: TestClient):
    # 1. Create incoming session
    inc_payload = {"CallSid": "CS_STATUS_TEST_001", "From": "+919876543210", "To": "+911140001234"}
    client.post("/api/v1/telephony/incoming", data=inc_payload)

    # 2. Call status callback in-progress
    status_payload = {"CallSid": "CS_STATUS_TEST_001", "CallStatus": "in-progress", "CallDuration": "0"}
    resp = client.post("/api/v1/telephony/status", data=status_payload)
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

    # 3. Call status callback completed
    comp_payload = {"CallSid": "CS_STATUS_TEST_001", "CallStatus": "completed", "CallDuration": "42"}
    resp_comp = client.post("/api/v1/telephony/status", data=comp_payload)
    assert resp_comp.status_code == 200
    assert resp_comp.json()["status"] == "ok"
