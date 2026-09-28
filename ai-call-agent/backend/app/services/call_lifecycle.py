"""Call Lifecycle Manager for Telephony Webhook Event Integration."""

import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.call import Call
from app.models.call_event import CallEvent
from app.models.audit_log import AuditLog
from app.services.call_state_machine import CallState, validate_state_transition

logger = logging.getLogger("ai_call_agent.services.call_lifecycle")

# Telephony provider status -> Internal CallState mapping
PROVIDER_STATUS_MAP: Dict[str, str] = {
    "queued": CallState.RINGING,
    "ringing": CallState.RINGING,
    "in-progress": CallState.ANSWERED,
    "answered": CallState.ANSWERED,
    "completed": CallState.COMPLETED,
    "busy": CallState.COMPLETED,
    "no-answer": CallState.MISSED,
    "canceled": CallState.ABANDONED,
    "failed": CallState.FAILED,
}


class CallLifecycleService:
    """
    Manages telephony call lifecycle transitions, idempotency, event timeline updates,
    and database state synchronizations.
    """

    @staticmethod
    def process_status_event(
        db: Session,
        provider_call_id: str,
        provider_status: str,
        duration_seconds: int = 0,
        error_code: Optional[str] = None,
        event_metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[Call]:
        """
        Process a provider call status update callback.
        Handles idempotency, state transitions, event persistence, and audit logging.
        """
        call = db.query(Call).filter(
            (Call.provider_call_id == provider_call_id) | (Call.external_call_sid == provider_call_id)
        ).first()

        if not call:
            logger.warning(f"Status update received for unknown provider_call_id={provider_call_id}")
            return None

        normalized_status = provider_status.lower()
        target_state = PROVIDER_STATUS_MAP.get(normalized_status, CallState.ANSWERED)

        # Update provider details
        call.provider_status = provider_status
        if duration_seconds and duration_seconds > 0:
            call.duration_seconds = duration_seconds
        if error_code:
            call.provider_error_code = error_code

        # If already in a terminal state (COMPLETED, FAILED, MISSED, ABANDONED), ignore older/duplicate events
        terminal_states = {CallState.COMPLETED, CallState.FAILED, CallState.MISSED, CallState.ABANDONED}
        if call.status in terminal_states and target_state not in terminal_states:
            logger.info(f"Ignoring out-of-order event '{provider_status}' for call in terminal state '{call.status}'")
            db.commit()
            return call

        # Perform legal state transition if state changed
        if call.status != target_state:
            try:
                validate_state_transition(call.status, target_state)
                call.status = target_state
                if target_state in terminal_states and not call.completed_at:
                    call.completed_at = datetime.now(timezone.utc)
            except Exception as err:
                logger.warning(f"Non-fatal state transition error for call {call.id}: {err}")

        # Record timeline CallEvent
        event_entry = CallEvent(
            call_id=call.id,
            event_type=f"TELEPHONY_{provider_status.upper()}",
            actor="telephony",
            payload={
                "provider_call_id": provider_call_id,
                "provider_status": provider_status,
                "duration_seconds": duration_seconds,
                "error_code": error_code,
                **(event_metadata or {}),
            },
        )
        db.add(event_entry)

        # Audit log entry for tracking
        audit = AuditLog(
            action=f"TELEPHONY_STATUS_{provider_status.upper()}",
            resource_type="calls",
            resource_id=str(call.id),
            payload={"provider_call_id": provider_call_id, "status": target_state},
        )
        db.add(audit)

        db.commit()
        db.refresh(call)
        logger.info(f"Call {call.id} updated to status {call.status} (provider: {provider_status})")
        return call


call_lifecycle_service = CallLifecycleService()
