"""Voicemail Management REST API Endpoints."""

from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.voicemail_service import voicemail_service

router = APIRouter(prefix="/voicemail", tags=["Voicemail Management"])


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
def list_voicemails(
    recipient_id: Optional[UUID] = None,
    folder: str = "inbox",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve voicemail messages for recipient or organization inbox."""
    messages = voicemail_service.get_voicemails(
        db=db,
        recipient_id=str(recipient_id) if recipient_id else None,
        folder=folder,
    )
    return [
        {
            "id": str(m.id),
            "call_id": str(m.call_id),
            "recipient_id": str(m.recipient_id) if m.recipient_id else None,
            "caller_number": m.caller_number,
            "caller_name": m.caller_name,
            "duration_seconds": m.duration_seconds,
            "audio_url": m.audio_url,
            "transcript": m.transcript,
            "is_read": m.is_read,
            "folder": m.folder,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]


@router.patch("/{id}/read")
def mark_voicemail_read(
    id: UUID = Path(..., description="Voicemail UUID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a voicemail message as read."""
    vm = voicemail_service.mark_as_read(db=db, voicemail_id=str(id))
    if not vm:
        raise HTTPException(status_code=404, detail="Voicemail message not found.")
    return {"message": "Voicemail marked as read.", "id": str(vm.id)}
