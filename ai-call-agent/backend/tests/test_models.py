"""Unit Tests for SQLAlchemy Database Models."""

import uuid
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.phone_number import PhoneNumber
from app.models.call import Call
from app.models.call_event import CallEvent
from app.models.spam_assessment import SpamAssessment


def test_create_user_and_phone_number(db_session: Session):
    user = User(
        email="operator@example.com",
        full_name="Pooja Verma",
        role="receptionist",
        hashed_password="hashed_pw_test",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.email == "operator@example.com"

    phone = PhoneNumber(
        owner_id=user.id,
        phone_number="+911140001234",
        label="Front Desk Primary",
        forward_to_number="+919876543210",
        provider="mock",
    )
    db_session.add(phone)
    db_session.commit()
    db_session.refresh(phone)

    assert phone.owner_id == user.id
    assert len(user.phone_numbers) == 1


def test_call_lifecycle_models_and_events(db_session: Session):
    call_id = uuid.uuid4()
    call = Call(
        id=call_id,
        external_call_sid="TEST_SID_999",
        caller_number="+919876543210",
        recipient_number="+911140001234",
        status="completed",
        disposition="legitimate",
        detected_language="hi-IN",
        caller_name="Anil Kumar",
        caller_intent="Wants to verify order delivery date",
        duration_seconds=95,
        spam_score=15,
    )
    event1 = CallEvent(
        call_id=call_id,
        event_type="RINGING",
        actor="telephony",
        payload={"direction": "inbound"},
    )
    event2 = CallEvent(
        call_id=call_id,
        event_type="INTENT_EXTRACTED",
        actor="voice_ai",
        payload={"intent": "order_verification"},
    )
    assessment = SpamAssessment(
        call_id=call_id,
        composite_score=15,
        reputation_score=10,
        semantic_score=12,
        behavioral_score=20,
        classification="legitimate",
        confidence=0.98,
        ai_rationale="Clean business inquiry with no high-risk markers.",
    )

    db_session.add(call)
    db_session.add(event1)
    db_session.add(event2)
    db_session.add(assessment)
    db_session.commit()

    saved_call = db_session.query(Call).filter(Call.id == call_id).first()
    assert saved_call is not None
    assert len(saved_call.events) == 2
    assert saved_call.spam_assessment is not None
    assert saved_call.spam_assessment.composite_score == 15
