"""Multi-Tier Fallback Execution Engine."""

import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.recipient import Recipient
from app.models.call import Call
from app.models.voicemail import VoicemailMessage
from app.models.callback_request import CallbackRequest

logger = logging.getLogger("ai_call_agent.routing.fallback")


class MultiTierFallbackEngine:
    """Executes ordered multi-tier fallback workflows when call transfers fail or recipients are unavailable."""

    @staticmethod
    def execute_fallback(
        db: Session,
        call_id: str,
        recipient: Optional[Recipient],
        failure_reason: str = "no_answer",
        fallback_mode: str = "voicemail",
        caller_name: Optional[str] = None,
        purpose: Optional[str] = None,
    ) -> Dict[str, Any]:
        logger.info(f"Executing fallback for call {call_id} (Reason: {failure_reason}, Mode: {fallback_mode})")

        call = db.query(Call).filter(Call.id == call_id).first()
        caller_num = call.caller_number if call else "+919876543210"

        # Tier 4: Voicemail Collection
        if fallback_mode == "voicemail" or (recipient and recipient.enable_voicemail):
            vm = VoicemailMessage(
                call_id=call_id,
                recipient_id=recipient.id if recipient else None,
                caller_number=caller_num,
                caller_name=caller_name or "Unknown Caller",
                duration_seconds=0,
                transcript=f"Caller left voicemail regarding: {purpose or 'General Enquiry'}",
                folder="inbox",
            )
            db.add(vm)
            db.commit()
            db.refresh(vm)
            return {
                "fallback_type": "voicemail",
                "record_id": str(vm.id),
                "message": "Call routed to voicemail. Please leave your message after the tone.",
            }

        # Tier 5: Callback Request Creation
        if fallback_mode == "callback" or (recipient and recipient.enable_callback_requests):
            cb = CallbackRequest(
                call_id=call_id,
                recipient_id=recipient.id if recipient else None,
                caller_number=caller_num,
                caller_name=caller_name or "Unknown Caller",
                requested_department=recipient.department if recipient else "General",
                purpose=purpose or "Callback requested after unanswered transfer.",
                status="pending",
            )
            db.add(cb)
            db.commit()
            db.refresh(cb)
            return {
                "fallback_type": "callback",
                "record_id": str(cb.id),
                "message": "Callback request registered. A representative will get back to you shortly.",
            }

        # Tier 6: Return to AI Receptionist / Polite Disconnection
        return {
            "fallback_type": "polite_end",
            "record_id": None,
            "message": "Thank you for calling. Have a great day!",
        }


fallback_engine = MultiTierFallbackEngine()
