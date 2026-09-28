"""Call Events Management Endpoints."""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.call import Call
from app.models.call_event import CallEvent
from app.models.user import User
from app.schemas.call_events import CallEventCreate, CallEventResponse

router = APIRouter(prefix="/calls", tags=["call-events"])


@router.get("/{id}/events", response_model=List[CallEventResponse])
def get_call_events(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve chronologically ordered events timeline for a specific call."""
    call = db.query(Call).filter(Call.id == id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call record not found")

    # Multi-tenant data isolation: viewer/operator non-admin users only access their own calls
    if current_user.role != "admin" and call.user_id and call.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden to this call record.")

    events = db.query(CallEvent).filter(CallEvent.call_id == id).order_by(CallEvent.created_at.asc()).all()
    return events


@router.post("/{id}/events", response_model=CallEventResponse, status_code=201)
def create_call_event(
    id: UUID,
    payload: CallEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually post an event entry to a call timeline (Operator / Admin only)."""
    if current_user.role not in ["admin", "operator"]:
        raise HTTPException(status_code=403, detail="Operator or Admin role required.")

    call = db.query(Call).filter(Call.id == id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call record not found")

    event_entry = CallEvent(
        call_id=call.id,
        event_type=payload.event_type.upper(),
        actor=payload.actor or "operator",
        payload=payload.payload,
    )
    db.add(event_entry)
    db.commit()
    db.refresh(event_entry)
    return event_entry
