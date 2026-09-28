"""16-State Transfer Finite State Machine and State Transitions."""

import logging
from typing import Dict, List

logger = logging.getLogger("ai_call_agent.transfers.state_machine")

# 16 Valid States
TRANSFER_STATES = [
    "REQUESTED",
    "VALIDATING",
    "QUEUED",
    "DIALING",
    "RINGING",
    "ANNOUNCING",
    "AWAITING_ACCEPTANCE",
    "ACCEPTED",
    "BRIDGING",
    "CONNECTED",
    "DECLINED",
    "NO_ANSWER",
    "BUSY",
    "FAILED",
    "CANCELLED",
    "COMPLETED",
]

# Valid state transition graph
VALID_TRANSITIONS: Dict[str, List[str]] = {
    "REQUESTED": ["VALIDATING", "FAILED", "CANCELLED"],
    "VALIDATING": ["QUEUED", "FAILED", "CANCELLED"],
    "QUEUED": ["DIALING", "CANCELLED", "FAILED"],
    "DIALING": ["RINGING", "BUSY", "NO_ANSWER", "FAILED", "CANCELLED"],
    "RINGING": ["ANNOUNCING", "NO_ANSWER", "BUSY", "FAILED", "CANCELLED"],
    "ANNOUNCING": ["AWAITING_ACCEPTANCE", "FAILED", "CANCELLED"],
    "AWAITING_ACCEPTANCE": ["ACCEPTED", "DECLINED", "NO_ANSWER", "FAILED", "CANCELLED"],
    "ACCEPTED": ["BRIDGING", "FAILED", "CANCELLED"],
    "BRIDGING": ["CONNECTED", "FAILED", "CANCELLED"],
    "CONNECTED": ["COMPLETED", "FAILED"],
    "DECLINED": ["FAILED", "COMPLETED"],
    "NO_ANSWER": ["FAILED", "COMPLETED"],
    "BUSY": ["FAILED", "COMPLETED"],
    "FAILED": [],
    "CANCELLED": [],
    "COMPLETED": [],
}


class TransferStateMachine:
    """Manages immutable state transitions for warm call transfers."""

    @staticmethod
    def is_valid_transition(current_state: str, next_state: str) -> bool:
        if current_state not in TRANSFER_STATES or next_state not in TRANSFER_STATES:
            return False
        allowed = VALID_TRANSITIONS.get(current_state, [])
        return next_state in allowed

    @classmethod
    def transition(cls, current_state: str, target_state: str) -> str:
        if current_state == target_state:
            return current_state
        if not cls.is_valid_transition(current_state, target_state):
            logger.warning(f"Invalid state transition attempted: {current_state} -> {target_state}. Defaulting to target_state for event safety.")
        return target_state


transfer_state_machine = TransferStateMachine()
