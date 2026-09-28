"""Unit Tests for Call Lifecycle Service and Transition Idempotency."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.services.call_lifecycle import CallLifecycleService
from app.services.call_session import CallSessionService
from app.services.call_state_machine import CallState


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_call_lifecycle_transitions(db_session):
    parsed = {
        "provider_call_id": "CS_LIFECYCLE_01",
        "caller_number": "+919876543210",
        "recipient_number": "+911140001234",
        "telephony_provider": "twilio",
        "status": "ringing",
        "direction": "inbound",
    }

    # 1. Inbound setup -> RINGING
    call, created = CallSessionService.get_or_create_inbound_session(db_session, parsed)
    assert created is True
    assert call.status == CallState.RINGING

    # 2. Status callback: in-progress -> ANSWERED
    call = CallLifecycleService.process_status_event(
        db=db_session,
        provider_call_id="CS_LIFECYCLE_01",
        provider_status="in-progress",
    )
    assert call.status == CallState.ANSWERED

    # 3. Status callback: completed -> COMPLETED
    call = CallLifecycleService.process_status_event(
        db=db_session,
        provider_call_id="CS_LIFECYCLE_01",
        provider_status="completed",
        duration_seconds=30,
    )
    assert call.status == CallState.COMPLETED
    assert call.duration_seconds == 30
    assert call.completed_at is not None


def test_out_of_order_event_handling(db_session):
    parsed = {
        "provider_call_id": "CS_OUT_OF_ORDER_01",
        "caller_number": "+919876543210",
        "recipient_number": "+911140001234",
        "status": "ringing",
    }
    call, _ = CallSessionService.get_or_create_inbound_session(db_session, parsed)

    # Call completed event arrives first
    call = CallLifecycleService.process_status_event(
        db=db_session,
        provider_call_id="CS_OUT_OF_ORDER_01",
        provider_status="completed",
        duration_seconds=10,
    )
    assert call.status == CallState.COMPLETED

    # Out-of-order 'in-progress' arrives after completion -> should be ignored, status remains COMPLETED
    call = CallLifecycleService.process_status_event(
        db=db_session,
        provider_call_id="CS_OUT_OF_ORDER_01",
        provider_status="in-progress",
    )
    assert call.status == CallState.COMPLETED
