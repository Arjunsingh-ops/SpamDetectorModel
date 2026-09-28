"""Callback Requests REST API Endpoints."""

from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Path, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.callback_service import callback_service

router = APIRouter(prefix="/callbacks", tags=["Callback Requests"])


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
def list_callbacks(
    status: Optional[str] = None,
    recipient_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve caller callback requests queue."""
    requests = callback_service.get_callbacks(
        db=db,
        status=status,
        recipient_id=str(recipient_id) if recipient_id else None,
    )
    return [
        {
            "id": str(cb.id),
            "call_id": str(cb.call_id),
            "recipient_id": str(cb.recipient_id) if cb.recipient_id else None,
            "caller_number": cb.caller_number,
            "caller_name": cb.caller_name,
            "requested_department": cb.requested_department,
            "purpose": cb.purpose,
            "preferred_time": cb.preferred_time,
            "status": cb.status,
            "assigned_user_id": str(cb.assigned_user_id) if cb.assigned_user_id else None,
            "resolution_notes": cb.resolution_notes,
            "created_at": cb.created_at.isoformat() if cb.created_at else None,
        }
        for cb in requests
    ]


@router.patch("/{id}")
def update_callback_status(
    id: UUID = Path(..., description="Callback Request UUID"),
    status: str = Body(..., embed=True),
    resolution_notes: Optional[str] = Body(default=None, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update status of a callback request (pending, assigned, in_progress, completed, cancelled)."""
    cb = callback_service.update_callback_status(
        db=db,
        callback_id=str(id),
        status=status,
        resolution_notes=resolution_notes,
        assigned_user_id=str(current_user.id),
    )
    if not cb:
        raise HTTPException(status_code=404, detail="Callback request not found.")
    return {"message": f"Callback request status updated to {status}.", "id": str(cb.id)}
