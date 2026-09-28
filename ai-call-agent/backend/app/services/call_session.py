"""Call Session Service for Inbound/Outbound Session Setup."""

import logging
from typing import Dict, Any, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.call import Call
from app.models.call_event import CallEvent
from app.models.phone_number import PhoneNumber
from app.services.call_state_machine import CallState

logger = logging.getLogger("ai_call_agent.services.call_session")


class CallSessionService:
    """Manages call session creation, persistence, and carrier metadata mapping."""

    @staticmethod
    def get_or_create_inbound_session(
        db: Session,
        parsed_payload: Dict[str, Any],
    ) -> Tuple[Call, bool]:
        """
        Idempotently get or create an inbound call session from parsed webhook payload.
        Returns tuple of (Call, created_boolean).
        """
        provider_call_id = parsed_payload.get("provider_call_id") or parsed_payload.get("external_call_sid")
        caller_number = parsed_payload.get("caller_number", "+15550199000")
        destination_number = parsed_payload.get("recipient_number", "+15550199001")
        provider_name = parsed_payload.get("telephony_provider", "twilio")

        # Idempotency check: look up existing call by provider_call_id or external_call_sid
        existing_call = db.query(Call).filter(
            (Call.provider_call_id == provider_call_id) | (Call.external_call_sid == provider_call_id)
        ).first()

        if existing_call:
            logger.info(f"Idempotent match: Call session already exists for provider_call_id={provider_call_id}")
            return existing_call, False

        # Attempt to associate phone number owner user_id
        phone_rec = db.query(PhoneNumber).filter(PhoneNumber.phone_number == destination_number).first()
        user_id = phone_rec.owner_id if phone_rec else None

        now = datetime.now(timezone.utc)
        new_call = Call(
            external_call_sid=provider_call_id,
            provider_call_id=provider_call_id,
            caller_number=caller_number,
            recipient_number=destination_number,
            destination_number=destination_number,
            direction=parsed_payload.get("direction", "inbound"),
            call_direction=parsed_payload.get("direction", "inbound"),
            telephony_provider=provider_name,
            provider_status=parsed_payload.get("status", "ringing"),
            status=CallState.RINGING,
            disposition="uncertain",
            detected_language="en-IN",
            started_at=now,
            user_id=user_id,
            phone_number_id=phone_rec.id if phone_rec else None,
        )
        db.add(new_call)
        db.flush()

        # Create INCOMING event entry
        event_entry = CallEvent(
            call_id=new_call.id,
            event_type="TELEPHONY_INCOMING",
            actor="telephony",
            payload={
                "provider_call_id": provider_call_id,
                "caller_number": caller_number,
                "destination_number": destination_number,
                "provider": provider_name,
            },
        )
        db.add(event_entry)

        db.commit()
        db.refresh(new_call)
        logger.info(f"Created new inbound call session {new_call.id} for provider_call_id={provider_call_id}")
        return new_call, True


call_session_service = CallSessionService()
