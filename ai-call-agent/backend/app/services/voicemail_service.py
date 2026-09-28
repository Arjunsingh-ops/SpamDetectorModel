"""Voicemail Management Service."""

import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.voicemail import VoicemailMessage

logger = logging.getLogger("ai_call_agent.services.voicemail")


class VoicemailService:
    """Manages voicemail messages, transcripts, and folder organization."""

    @staticmethod
    def get_voicemails(
        db: Session,
        recipient_id: Optional[str] = None,
        folder: str = "inbox",
        limit: int = 50,
    ) -> List[VoicemailMessage]:
        query = db.query(VoicemailMessage).filter(VoicemailMessage.folder == folder)
        if recipient_id:
            query = query.filter(VoicemailMessage.recipient_id == recipient_id)
        return query.order_by(VoicemailMessage.created_at.desc()).limit(limit).all()

    @staticmethod
    def mark_as_read(db: Session, voicemail_id: str) -> Optional[VoicemailMessage]:
        vm = db.query(VoicemailMessage).filter(VoicemailMessage.id == voicemail_id).first()
        if vm:
            vm.is_read = True
            db.commit()
            db.refresh(vm)
        return vm


voicemail_service = VoicemailService()
