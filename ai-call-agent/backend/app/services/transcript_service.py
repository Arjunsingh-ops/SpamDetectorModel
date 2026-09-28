"""Transcript Persistence Service for Granular Segment Logging."""

import logging
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.transcript_segment import TranscriptSegment
from app.models.conversation import Conversation

logger = logging.getLogger("ai_call_agent.services.transcript_service")


class TranscriptService:
    """Persists transcript segments to PostgreSQL and updates master Conversation record."""

    @staticmethod
    def add_segment(
        db: Session,
        call_id: UUID,
        speaker: str,
        text: str,
        language: str = "en-IN",
        confidence: float = 1.0,
    ) -> TranscriptSegment:
        segment = TranscriptSegment(
            call_id=call_id,
            speaker=speaker,
            text=text,
            language=language,
            confidence=confidence,
        )
        db.add(segment)

        # Append to master Conversation record
        conv = db.query(Conversation).filter(Conversation.call_id == call_id).first()
        if not conv:
            conv = Conversation(call_id=call_id, transcript="", language=language)
            db.add(conv)

        prefix = "Caller" if speaker == "caller" else "AI Receptionist"
        conv.transcript += f"\n[{prefix}]: {text}"
        conv.language = language

        db.commit()
        db.refresh(segment)
        return segment

    @staticmethod
    def get_segments(db: Session, call_id: UUID) -> List[TranscriptSegment]:
        return db.query(TranscriptSegment).filter(TranscriptSegment.call_id == call_id).order_by(TranscriptSegment.created_at.asc()).all()


transcript_service = TranscriptService()
