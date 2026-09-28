"""Conversations, Transcripts, and Summaries API Endpoints."""

from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.models.transcript_segment import TranscriptSegment

router = APIRouter(prefix="/conversations", tags=["conversations"])


class ConversationResponse(BaseModel):
    id: UUID
    call_id: UUID
    transcript: str
    language: str
    summary: Optional[str] = None
    entities_extracted: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class SegmentResponse(BaseModel):
    id: UUID
    speaker: str
    text: str
    language: str
    confidence: float

    class Config:
        from_attributes = True


@router.get("", response_model=List[ConversationResponse])
def list_conversations(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve list of conversation transcripts and AI summaries."""
    conversations = db.query(Conversation).order_by(Conversation.created_at.desc()).limit(limit).all()
    return conversations


@router.get("/{call_id}", response_model=ConversationResponse)
def get_conversation_details(
    call_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve conversation details and summary for a specific call."""
    conv = db.query(Conversation).filter(Conversation.call_id == call_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation record not found.")
    return conv


@router.get("/{call_id}/segments", response_model=List[SegmentResponse])
def get_transcript_segments(
    call_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve granular per-utterance transcript segments for a call."""
    segments = db.query(TranscriptSegment).filter(TranscriptSegment.call_id == call_id).order_by(TranscriptSegment.created_at.asc()).all()
    return segments
