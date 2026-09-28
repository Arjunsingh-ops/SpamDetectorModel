"""Unit and Integration Test Suite for Stage 6 Smart Call Forwarding & Routing Engine."""

import pytest
from app.routing.schemas import CallerIntent, RecipientCreate
from app.routing.recipient_resolver import recipient_resolver
from app.routing.policies import deterministic_routing_policy
from app.transfers.state_machine import transfer_state_machine
from app.transfers.announcements import warm_transfer_announcements


def test_intent_extraction_heuristics():
    """Verify caller intent parsing from speech transcripts."""
    intent1 = recipient_resolver.extract_intent_from_text("I need to speak to Sales regarding a product pricing quote")
    assert intent1.requested_department == "Sales"
    assert intent1.urgency_stated == "normal"

    intent2 = recipient_resolver.extract_intent_from_text("This is an URGENT emergency! My system is broken and I need to speak to a human support agent immediately!")
    assert intent2.requested_department == "Support"
    assert intent2.urgency_stated == "urgent"
    assert intent2.human_requested is True


def test_recipient_e164_validation():
    """Verify destination phone number validation for toll-fraud prevention."""
    valid_payload = RecipientCreate(
        display_name="Test Recipient",
        department="Sales",
        phone_number="9876543210",
    )
    assert valid_payload.phone_number == "+919876543210"

    with pytest.raises(ValueError):
        RecipientCreate(
            display_name="Invalid Recipient",
            department="Sales",
            phone_number="123",  # Too short
        )


def test_16_state_transfer_machine():
    """Verify valid and invalid state transitions in the 16-state transfer FSM."""
    assert transfer_state_machine.is_valid_transition("REQUESTED", "VALIDATING") is True
    assert transfer_state_machine.is_valid_transition("AWAITING_ACCEPTANCE", "ACCEPTED") is True
    assert transfer_state_machine.is_valid_transition("ACCEPTED", "BRIDGING") is True
    assert transfer_state_machine.is_valid_transition("BRIDGING", "CONNECTED") is True

    # Invalid jump from REQUESTED to CONNECTED
    assert transfer_state_machine.is_valid_transition("REQUESTED", "CONNECTED") is False


def test_warm_transfer_announcement_generator():
    """Verify bilingual warm transfer announcement text generation."""
    ann_en = warm_transfer_announcements.generate_announcement(
        caller_name="Rahul Sharma",
        purpose="pricing discussion",
        language="en-IN",
    )
    assert "Rahul Sharma" in ann_en["announcement_text"]
    assert "Press 1 to accept" in ann_en["announcement_text"]

    ann_hi = warm_transfer_announcements.generate_announcement(
        caller_name="Rahul Sharma",
        purpose="pricing discussion",
        language="hi-IN",
    )
    assert "स्वीकार करने के लिए 1 दबाएं" in ann_hi["announcement_text"]


def test_deterministic_routing_policy_spam_integration():
    """Verify Stage 5 spam risk integration in smart routing decisions."""
    intent = CallerIntent(purpose="General inquiry", requested_department="Sales")

    # HIGH risk (score 85) -> Must flag for operator review queue, never auto-transfer
    high_res = deterministic_routing_policy.evaluate_routing(
        db=None,
        intent=intent,
        spam_score=85,
        risk_category="HIGH",
    )
    assert high_res["action"] == "flag_review"
    assert high_res["allow_transfer"] is False

    # UNCERTAIN risk (score 55) -> Must request screening challenge
    uncertain_res = deterministic_routing_policy.evaluate_routing(
        db=None,
        intent=intent,
        spam_score=55,
        risk_category="UNCERTAIN",
    )
    assert uncertain_res["action"] == "screen_further"
    assert uncertain_res["allow_transfer"] is False
