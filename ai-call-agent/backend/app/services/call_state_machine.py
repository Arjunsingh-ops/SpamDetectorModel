"""Call Lifecycle State Machine and Transition Matrix Validator."""

from typing import Dict, Set
from app.core.exceptions import AppException
from app.core.logging import logger


class CallState:
    RINGING = "RINGING"
    ANSWERED = "ANSWERED"
    SCREENING = "SCREENING"
    CLASSIFIED = "CLASSIFIED"
    TRANSFERRING = "TRANSFERRING"
    COMPLETED = "COMPLETED"
    FLAGGED = "FLAGGED"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    FAILED = "FAILED"
    MISSED = "MISSED"
    ABANDONED = "ABANDONED"


# Legal State Transition Matrix
ALLOWED_TRANSITIONS: Dict[str, Set[str]] = {
    CallState.RINGING: {
        CallState.ANSWERED,
        CallState.SCREENING,
        CallState.COMPLETED,
        CallState.MISSED,
        CallState.ABANDONED,
        CallState.FAILED,
    },
    CallState.ANSWERED: {
        CallState.SCREENING,
        CallState.CLASSIFIED,
        CallState.TRANSFERRING,
        CallState.COMPLETED,
        CallState.ABANDONED,
        CallState.FAILED,
    },
    CallState.SCREENING: {
        CallState.CLASSIFIED,
        CallState.TRANSFERRING,
        CallState.COMPLETED,
        CallState.FLAGGED,
        CallState.NEEDS_REVIEW,
        CallState.ABANDONED,
        CallState.FAILED,
    },
    CallState.CLASSIFIED: {
        CallState.TRANSFERRING,
        CallState.FLAGGED,
        CallState.NEEDS_REVIEW,
        CallState.COMPLETED,
        CallState.FAILED,
    },
    CallState.TRANSFERRING: {
        CallState.COMPLETED,
        CallState.FAILED,
        CallState.NEEDS_REVIEW,
    },
    CallState.FLAGGED: {
        CallState.NEEDS_REVIEW,
        CallState.COMPLETED,
        CallState.FAILED,
    },
    CallState.NEEDS_REVIEW: {
        CallState.COMPLETED,
        CallState.FLAGGED,
        CallState.FAILED,
    },
    # Terminal states
    CallState.COMPLETED: set(),
    CallState.FAILED: set(),
    CallState.MISSED: set(),
    CallState.ABANDONED: set(),
}


def validate_state_transition(current_state: str, target_state: str) -> bool:
    """
    Verify if transitioning from current_state to target_state is legal.
    Raises AppException if illegal transition attempted.
    """
    if current_state == target_state:
        # Idempotent re-affirmation of current state
        return True

    allowed = ALLOWED_TRANSITIONS.get(current_state, set())
    if target_state not in allowed:
        logger.warning(
            f"[StateMachine] Illegal state transition attempted: {current_state} -> {target_state}"
        )
        raise AppException(
            message=f"Illegal call state transition from '{current_state}' to '{target_state}'.",
            status_code=400,
            code="ILLEGAL_STATE_TRANSITION",
            details={
                "current_state": current_state,
                "target_state": target_state,
                "allowed_transitions": list(allowed),
            },
        )
    return True
