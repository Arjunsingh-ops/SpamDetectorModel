"""Tests for Telephony, Voice AI, and Spam Integration Adapters."""

import uuid
from app.integrations.telephony.mock import MockTelephonyAdapter
from app.integrations.voice.mock import MockVoiceAIAdapter
from app.integrations.spam.mock import MockSpamDetectionAdapter
from app.services.spam_service import SpamService


def test_mock_telephony_adapter_flow():
    adapter = MockTelephonyAdapter()

    # 1. Parse Inbound Webhook
    payload = {"CallSid": "CA123456", "From": "+919876543210", "To": "+911140001234"}
    parsed = adapter.parse_inbound_webhook(payload)
    assert parsed["external_call_sid"] == "CA123456"
    assert parsed["caller_number"] == "+919876543210"

    # 2. Answer response
    answer_twiml = adapter.generate_answer_response(
        call_id="call-uuid-123",
        stream_url="wss://test.internal/stream",
        initial_greeting="Hello",
    )
    assert "<Response>" in answer_twiml
    assert "<Stream url=\"wss://test.internal/stream\"" in answer_twiml or 'url="wss://test.internal/stream"' in answer_twiml

    # 3. Transfer
    transfer = adapter.initiate_transfer("CA123456", "+919999999999")
    assert transfer["action"] == "mock_transfer"
    assert transfer["target_number"] == "+919999999999"

    # 4. Termination
    term = adapter.terminate_call("CA123456")
    assert term is True


def test_mock_voice_adapter_bilingual():
    adapter = MockVoiceAIAdapter()

    # Bilingual greeting
    greeting = adapter.get_greeting("bilingual")
    assert "Hello" in greeting["primary"]
    assert "नमस्ते" in greeting["primary"]
    assert greeting["language"] == "bilingual"

    # Intent extraction - medical
    intent = adapter.extract_intent("I need an appointment with the doctor")
    assert intent["purpose"] == "Appointment Scheduling"

    # Intent extraction - suspicious
    suspicious = adapter.extract_intent("Tell me your bank account OTP immediately or police will arrest")
    assert suspicious["purpose"] == "Financial or Legal Threat Verification"
    assert suspicious["urgency"] == "high"


def test_mock_spam_engine_scoring():
    adapter = MockSpamDetectionAdapter()

    # Clean call
    clean_eval = adapter.evaluate_call("+919876543210", "Hello, I am calling about the meeting tomorrow.")
    assert clean_eval["classification"] == "legitimate"
    assert clean_eval["composite_score"] < 40

    # Fraud script call
    fraud_eval = adapter.evaluate_call(
        "+911409988776",
        "Your electricity bill is overdue. Share your OTP immediately or power will be disconnected."
    )
    assert fraud_eval["classification"] == "spam"
    assert fraud_eval["composite_score"] >= 70
    assert "otp" in fraud_eval["detected_triggers"]


def test_human_spam_review_policy():
    """Verify human review policy and regulatory complaint generation."""
    service = SpamService(db=None)
    call_id = uuid.uuid4()

    # False positive without telecom report
    decision = service.submit_human_review(
        call_id=call_id,
        decision="false_positive",
        submit_telecom_report=False,
        notes="Legitimate vendor with urgent query.",
    )
    assert decision["status"] == "success"
    assert decision["reported_to_authority"] is False
    assert decision["authority_reference_id"] is None

    # Confirmed spam WITH explicit human authorized report
    decision_spam = service.submit_human_review(
        call_id=call_id,
        decision="confirmed_spam",
        submit_telecom_report=True,
        notes="Verified phishing impersonator.",
    )
    assert decision_spam["status"] == "success"
    assert decision_spam["reported_to_authority"] is True
    assert decision_spam["authority_reference_id"].startswith("TRAI-REPORT-")


def test_ml_spam_detection_adapter():
    from app.integrations.spam.ml_engine import MLSpamDetectionAdapter
    ml_adapter = MLSpamDetectionAdapter()

    # Clean conversation (using phone number not in spam DB)
    clean_eval = ml_adapter.evaluate_call("+919999111222", "Hello, I am calling to schedule an appointment for tomorrow.")
    assert clean_eval["classification"] == "legitimate"


    # Known spam CSV / keyword fraud call
    fraud_eval = ml_adapter.evaluate_call(
        "+911409988776",
        "Your bank account will be blocked today. Please tell me the OTP you received."
    )
    assert fraud_eval["classification"] in ["spam", "uncertain"]
    assert fraud_eval["composite_score"] >= 40
    assert "otp" in fraud_eval["detected_triggers"] or "ml_" in fraud_eval["detected_triggers"]

