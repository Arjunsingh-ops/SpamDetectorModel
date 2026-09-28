"""Master Transfer Coordinator Orchestrating Warm Call Transfers."""

import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.transfer import TransferRecord
from app.models.recipient import Recipient
from app.models.call import Call
from app.transfers.announcements import warm_transfer_announcements
from app.routing.fallback import fallback_engine
from app.services.broadcaster import broadcaster

logger = logging.getLogger("ai_call_agent.transfers.coordinator")


class TransferCoordinator:
    """Coordinates warm transfer lifecycle, announcements, recipient accept/decline decisions, and fallback execution."""

    @classmethod
    def initiate_transfer(
        cls,
        db: Session,
        call_id: str,
        recipient: Recipient,
        caller_name: Optional[str] = None,
        purpose: Optional[str] = None,
        language: str = "en-IN",
    ) -> Dict[str, Any]:
        logger.info(f"Initiating warm transfer for call {call_id} to recipient {recipient.display_name} ({recipient.phone_number})")

        # 1. Generate Warm Transfer Announcement
        ann = warm_transfer_announcements.generate_announcement(
            caller_name=caller_name,
            purpose=purpose,
            department=recipient.department,
            language=language,
        )

        # 2. Create Transfer Record
        transfer_record = TransferRecord(
            call_id=call_id,
            recipient_id=recipient.id,
            target_phone_number=recipient.phone_number,
            target_name=recipient.display_name,
            department=recipient.department,
            transfer_type="warm",
            transfer_status="AWAITING_ACCEPTANCE",
            announcement_text=ann["announcement_text"],
        )
        db.add(transfer_record)

        # 3. Update Call Record Status
        call = db.query(Call).filter(Call.id == call_id).first()
        if call:
            call.disposition = "forwarded"
            call.status = "ANSWERED"

        db.commit()
        db.refresh(transfer_record)

        # 4. Broadcast Real-Time Transfer Alert to Dashboard
        broadcaster.broadcast_event(
            event_type="transfer_initiated",
            data={
                "transfer_id": str(transfer_record.id),
                "call_id": call_id,
                "recipient_id": str(recipient.id),
                "recipient_name": recipient.display_name,
                "target_phone": recipient.phone_number,
                "status": "AWAITING_ACCEPTANCE",
                "announcement": ann["announcement_text"],
                "caller_name": caller_name or "Unknown Caller",
                "purpose": purpose or "General Inquiry",
            },
        )

        return {
            "transfer_id": str(transfer_record.id),
            "call_id": call_id,
            "recipient_name": recipient.display_name,
            "target_phone": recipient.phone_number,
            "status": "AWAITING_ACCEPTANCE",
            "announcement": ann["announcement_text"],
        }

    @classmethod
    def process_recipient_decision(
        cls,
        db: Session,
        transfer_id: str,
        decision: str,  # accept | decline | busy | no_answer
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        transfer = db.query(TransferRecord).filter(TransferRecord.id == transfer_id).first()
        if not transfer:
            return {"success": False, "message": "Transfer record not found."}

        if decision == "accept":
            transfer.transfer_status = "CONNECTED"
            db.commit()

            broadcaster.broadcast_event(
                event_type="transfer_accepted",
                data={
                    "transfer_id": transfer_id,
                    "call_id": str(transfer.call_id),
                    "status": "CONNECTED",
                    "recipient_name": transfer.target_name,
                },
            )
            return {
                "success": True,
                "status": "CONNECTED",
                "message": f"Transfer accepted by {transfer.target_name}. Both legs bridged successfully.",
            }

        # Decline / Busy / No Answer -> Execute Fallback Workflow
        failure_status = "DECLINED" if decision == "decline" else ("BUSY" if decision == "busy" else "NO_ANSWER")
        transfer.transfer_status = failure_status
        transfer.failure_reason = notes or f"Recipient {decision}"
        db.commit()

        recipient = db.query(Recipient).filter(Recipient.id == transfer.recipient_id).first() if transfer.recipient_id else None

        fallback_res = fallback_engine.execute_fallback(
            db=db,
            call_id=str(transfer.call_id),
            recipient=recipient,
            failure_reason=decision,
            fallback_mode="voicemail",
            purpose=transfer.announcement_text,
        )

        broadcaster.broadcast_event(
            event_type="transfer_declined",
            data={
                "transfer_id": transfer_id,
                "call_id": str(transfer.call_id),
                "status": failure_status,
                "fallback": fallback_res,
            },
        )

        return {
            "success": True,
            "status": failure_status,
            "fallback": fallback_res,
            "message": f"Transfer {decision}. Executed fallback: {fallback_res['fallback_type']}.",
        }


transfer_coordinator = TransferCoordinator()
