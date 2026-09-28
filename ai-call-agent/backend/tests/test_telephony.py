"""Unit Tests for Telephony Adapters and TwiML Response Generators."""

from app.integrations.telephony.twilio_adapter import TwilioTelephonyAdapter
from app.integrations.telephony.mock_adapter import MockTelephonyAdapter
from app.integrations.telephony.webhook_validator import TwilioWebhookValidator


def test_twilio_adapter_twiml_generation():
    adapter = TwilioTelephonyAdapter(account_sid="AC123", auth_token="token123")
    twiml = adapter.generate_answer_response(
        call_id="call-uuid-123",
        stream_url="wss://example.com/api/v1/telephony/stream",
        initial_greeting="Hello from testing",
        language="en-IN",
        recording_notice=True,
    )
    assert "<Response>" in twiml
    assert "<Say voice=\"Polly.Aditi\" language=\"en-IN\">" in twiml
    assert "Hello from testing" in twiml
    assert "<Stream url=\"wss://example.com/api/v1/telephony/stream\">" in twiml
    assert "<Parameter name=\"callId\" value=\"call-uuid-123\" />" in twiml


def test_twilio_adapter_hindi_greeting():
    adapter = TwilioTelephonyAdapter()
    twiml = adapter.generate_answer_response(
        call_id="call-uuid-456",
        stream_url="wss://example.com/stream",
        initial_greeting="नमस्ते",
        language="hi-IN",
    )
    assert "language='hi-IN'" in twiml or 'language="hi-IN"' in twiml
    assert "नमस्ते" in twiml


def test_mock_telephony_adapter():
    adapter = MockTelephonyAdapter()
    parsed = adapter.parse_inbound_webhook({"CallSid": "CS999", "From": "+15550001", "To": "+15550002"})
    assert parsed["provider_call_id"] == "CS999"
    assert parsed["caller_number"] == "+15550001"
    assert parsed["telephony_provider"] == "mock"


def test_webhook_signature_validator():
    validator = TwilioWebhookValidator(auth_token="secret_token")
    url = "https://myapi.com/api/v1/telephony/incoming"
    params = {"CallSid": "CS123", "From": "+15550199"}

    # Valid signature generation test
    import hmac
    import hashlib
    import base64
    data = url + "CallSidCS123From+15550199"
    sig = base64.b64encode(hmac.new(b"secret_token", data.encode("utf-8"), hashlib.sha1).digest()).decode("utf-8")

    assert validator.validate(url, params, sig, auth_token="secret_token") is True
    assert validator.validate(url, params, "invalid_signature", auth_token="secret_token") is False
