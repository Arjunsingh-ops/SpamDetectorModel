"""Call Lifecycle State Machine and Transition Matrix Validator."""

from typing import Dict, Set
from app.core.exceptions import AppException
from app.core.logging import logger


class CallState:
    RINGING = "RINGING"
    ANSWERED = "ANSWERED"
    ANSWERED_BY_AI = "ANSWERED_BY_AI"
    SCREENING = "SCREENING"
    TRANSCRIBING = "TRANSCRIBING"
    CLASSIFYING = "CLASSIFYING"
    CLASSIFIED = "CLASSIFIED"
    ROUTING_DECISION = "ROUTING_DECISION"
    SAFE_TO_FORWARD = "SAFE_TO_FORWARD"
    TRANSFERRING = "TRANSFERRING"
    USER_RINGING = "USER_RINGING"
    BRIDGING = "BRIDGING"
    CONNECTED_TO_USER = "CONNECTED_TO_USER"
    SCREENING_CONTINUED = "SCREENING_CONTINUED"
    AI_HANDLED = "AI_HANDLED"
    AI_RESUMED = "AI_RESUMED"
    USER_DECLINED = "USER_DECLINED"
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
        CallState.ANSWERED_BY_AI,
        CallState.SCREENING,
        CallState.COMPLETED,
        CallState.MISSED,
        CallState.ABANDONED,
        CallState.FAILED,
    },
    CallState.ANSWERED: {
        CallState.ANSWERED_BY_AI,
        CallState.SCREENING,
        CallState.TRANSCRIBING,
        CallState.CLASSIFIED,
        CallState.TRANSFERRING,
        CallState.USER_RINGING,
        CallState.BRIDGING,
        CallState.CONNECTED_TO_USER,
        CallState.COMPLETED,
        CallState.ABANDONED,
        CallState.FAILED,
    },
    CallState.ANSWERED_BY_AI: {
        CallState.SCREENING,
        CallState.TRANSCRIBING,
        CallState.CLASSIFYING,
        CallState.COMPLETED,
        CallState.ABANDONED,
        CallState.FAILED,
    },
    CallState.SCREENING: {
        CallState.TRANSCRIBING,
        CallState.CLASSIFYING,
        CallState.CLASSIFIED,
        CallState.ROUTING_DECISION,
        CallState.SAFE_TO_FORWARD,
        CallState.SCREENING_CONTINUED,
        CallState.TRANSFERRING,
        CallState.USER_RINGING,
        CallState.AI_HANDLED,
        CallState.FLAGGED,
        CallState.NEEDS_REVIEW,
        CallState.COMPLETED,
        CallState.ABANDONED,
        CallState.FAILED,
    },
    CallState.TRANSCRIBING: {
        CallState.CLASSIFYING,
        CallState.ROUTING_DECISION,
        CallState.SCREENING,
        CallState.SCREENING_CONTINUED,
        CallState.SAFE_TO_FORWARD,
        CallState.AI_HANDLED,
        CallState.COMPLETED,
        CallState.FAILED,
    },
    CallState.CLASSIFYING: {
        CallState.ROUTING_DECISION,
        CallState.SAFE_TO_FORWARD,
        CallState.SCREENING_CONTINUED,
        CallState.AI_HANDLED,
        CallState.CLASSIFIED,
        CallState.FLAGGED,
        CallState.NEEDS_REVIEW,
        CallState.COMPLETED,
        CallState.FAILED,
    },
    CallState.CLASSIFIED: {
        CallState.ROUTING_DECISION,
        CallState.SAFE_TO_FORWARD,
        CallState.TRANSFERRING,
        CallState.USER_RINGING,
        CallState.AI_HANDLED,
        CallState.FLAGGED,
        CallState.NEEDS_REVIEW,
        CallState.COMPLETED,
        CallState.FAILED,
    },
    CallState.ROUTING_DECISION: {
        CallState.SAFE_TO_FORWARD,
        CallState.SCREENING_CONTINUED,
        CallState.AI_HANDLED,
        CallState.TRANSFERRING,
        CallState.USER_RINGING,
        CallState.FLAGGED,
        CallState.NEEDS_REVIEW,
        CallState.COMPLETED,
        CallState.FAILED,
    },
    CallState.SCREENING_CONTINUED: {
        CallState.SCREENING,
        CallState.TRANSCRIBING,
        CallState.CLASSIFYING,
        CallState.ROUTING_DECISION,
        CallState.SAFE_TO_FORWARD,
        CallState.AI_HANDLED,
        CallState.COMPLETED,
        CallState.FAILED,
    },
    CallState.SAFE_TO_FORWARD: {
        CallState.TRANSFERRING,
        CallState.USER_RINGING,
        CallState.BRIDGING,
        CallState.CONNECTED_TO_USER,
        CallState.USER_DECLINED,
        CallState.AI_RESUMED,
        CallState.COMPLETED,
        CallState.FAILED,
    },
    CallState.TRANSFERRING: {
        CallState.USER_RINGING,
        CallState.BRIDGING,
        CallState.CONNECTED_TO_USER,
        CallState.USER_DECLINED,
        CallState.AI_RESUMED,
        CallState.NEEDS_REVIEW,
        CallState.COMPLETED,
        CallState.FAILED,
    },
    CallState.USER_RINGING: {
        CallState.SCREENING,
        CallState.BRIDGING,
        CallState.CONNECTED_TO_USER,
        CallState.USER_DECLINED,
        CallState.AI_RESUMED,
        CallState.COMPLETED,
        CallState.FAILED,
    },
    CallState.BRIDGING: {
        CallState.CONNECTED_TO_USER,
        CallState.COMPLETED,
        CallState.FAILED,
    },
    CallState.CONNECTED_TO_USER: {
        CallState.COMPLETED,
        CallState.FAILED,
        CallState.ABANDONED,
    },
    CallState.USER_DECLINED: {
        CallState.AI_RESUMED,
        CallState.COMPLETED,
        CallState.FAILED,
    },
    CallState.AI_RESUMED: {
        CallState.COMPLETED,
        CallState.FAILED,
        CallState.ABANDONED,
    },
    CallState.AI_HANDLED: {
        CallState.SCREENING,
        CallState.COMPLETED,
        CallState.FAILED,
        CallState.ABANDONED,
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
            f"[StateMachine] Illegal call state transition attempted: {current_state} -> {target_state}"
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
