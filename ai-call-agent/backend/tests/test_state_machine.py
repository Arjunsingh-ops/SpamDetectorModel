"""Unit Tests for Call Lifecycle State Machine transitions."""

import pytest
from app.services.call_state_machine import validate_state_transition, CallState
from app.core.exceptions import AppException


def test_legal_state_transitions():
    assert validate_state_transition(CallState.RINGING, CallState.ANSWERED) is True
    assert validate_state_transition(CallState.ANSWERED, CallState.SCREENING) is True
    assert validate_state_transition(CallState.SCREENING, CallState.CLASSIFIED) is True
    assert validate_state_transition(CallState.CLASSIFIED, CallState.TRANSFERRING) is True
    assert validate_state_transition(CallState.TRANSFERRING, CallState.COMPLETED) is True


def test_illegal_state_transition_raises_exception():
    with pytest.raises(AppException) as exc_info:
        validate_state_transition(CallState.RINGING, CallState.TRANSFERRING)
    assert exc_info.value.code == "ILLEGAL_STATE_TRANSITION"

    with pytest.raises(AppException) as exc_info2:
        validate_state_transition(CallState.COMPLETED, CallState.ANSWERED)
    assert exc_info2.value.code == "ILLEGAL_STATE_TRANSITION"
