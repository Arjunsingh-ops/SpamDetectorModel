"""Recipient Directory and Availability REST API Endpoints."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import RequireRole, get_current_user
from app.models.user import User
from app.models.recipient import Recipient
from app.routing.schemas import RecipientCreate, RecipientUpdate, RecipientResponse, AvailabilityStatusUpdate

router = APIRouter(prefix="/recipients", tags=["Recipient Management"])


@router.get("", response_model=List[RecipientResponse])
@router.get("/", response_model=List[RecipientResponse])
def list_recipients(
    department: Optional[str] = None,
    availability_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve verified recipient directory with availability status."""
    query = db.query(Recipient).filter(Recipient.is_active.is_(True))
    if department:
        query = query.filter(Recipient.department.ilike(f"%{department}%"))
    if availability_status:
        query = query.filter(Recipient.availability_status == availability_status)
    return query.order_by(Recipient.routing_priority.asc()).all()


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
def bulk_create_recipients(
    items: List[RecipientCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bulk import list of mobile numbers into recipient directory."""
    created = []
    for item in items:
        recipient = Recipient(**item.model_dump())
        db.add(recipient)
        created.append(recipient)
    db.commit()
    for r in created:
        db.refresh(r)
    return {"status": "success", "count": len(created), "items": created}


@router.post("", response_model=RecipientResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=RecipientResponse, status_code=status.HTTP_201_CREATED)
def create_recipient(
    payload: RecipientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"])),
):
    """Create a new verified recipient profile in system directory."""
    recipient = Recipient(**payload.model_dump())
    db.add(recipient)
    db.commit()
    db.refresh(recipient)
    return recipient


@router.patch("/{id}", response_model=RecipientResponse)
def update_recipient(
    payload: RecipientUpdate,
    id: UUID = Path(..., description="Recipient UUID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "operator"])),
):
    """Update recipient profile, business hours, or backup configuration."""
    recipient = db.query(Recipient).filter(Recipient.id == id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(recipient, field, val)

    db.commit()
    db.refresh(recipient)
    return recipient


@router.patch("/{id}/availability", response_model=RecipientResponse)
def update_availability(
    payload: AvailabilityStatusUpdate,
    id: UUID = Path(..., description="Recipient UUID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually update recipient availability status (available, busy, away, dnd, offline)."""
    recipient = db.query(Recipient).filter(Recipient.id == id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found.")

    recipient.availability_status = payload.status
    db.commit()
    db.refresh(recipient)
    return recipient


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipient(
    id: UUID = Path(..., description="Recipient UUID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"])),
):
    """Soft delete/disable a recipient from directory."""
    recipient = db.query(Recipient).filter(Recipient.id == id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found.")

    recipient.is_active = False
    db.commit()
    return None

