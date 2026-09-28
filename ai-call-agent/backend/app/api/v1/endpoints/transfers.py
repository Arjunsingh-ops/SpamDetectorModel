"""Call Transfer and Warm Forwarding REST API Endpoints."""

from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import RequireRole, get_current_user
from app.models.user import User
from app.models.transfer import TransferRecord
from app.models.recipient import Recipient
from app.transfers.coordinator import transfer_coordinator
from app.routing.engine import smart_routing_engine

router = APIRouter(prefix="/transfers", tags=["Warm Call Transfers"])


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
def list_transfers(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List recent call transfer and forwarding records."""
    records = db.query(TransferRecord).order_by(TransferRecord.created_at.desc()).limit(limit).all()
    return [
        {
            "id": str(r.id),
            "call_id": str(r.call_id),
            "recipient_id": str(r.recipient_id) if r.recipient_id else None,
            "target_phone_number": r.target_phone_number,
            "target_name": r.target_name,
            "department": r.department,
            "transfer_type": r.transfer_type,
            "transfer_status": r.transfer_status,
            "failure_reason": r.failure_reason,
            "announcement_text": r.announcement_text,
            "duration_seconds": r.duration_seconds,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def initiate_warm_transfer(
    call_id: UUID = Body(..., embed=True),
    recipient_id: UUID = Body(..., embed=True),
    caller_name: Optional[str] = Body(default=None, embed=True),
    purpose: Optional[str] = Body(default=None, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist"])),
):
    """Initiate warm transfer to a verified directory recipient."""
    recipient = db.query(Recipient).filter(Recipient.id == recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found in directory.")

    res = transfer_coordinator.initiate_transfer(
        db=db,
        call_id=str(call_id),
        recipient=recipient,
        caller_name=caller_name,
        purpose=purpose,
    )
    return res


@router.post("/auto-route/{call_id}")
def auto_route_and_transfer(
    call_id: UUID = Path(..., description="Call UUID to route"),
    transcript: str = Body(..., embed=True),
    spam_score: int = Body(default=0, embed=True),
    risk_category: str = Body(default="LOW", embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Evaluate smart routing policy and initiate warm transfer if approved."""
    route_decision = smart_routing_engine.process_call_routing(
        db=db,
        call_id=str(call_id),
        transcript=transcript,
        spam_score=spam_score,
        risk_category=risk_category,
    )

    if route_decision["allow_transfer"] and route_decision["recipient_id"]:
        recipient = db.query(Recipient).filter(Recipient.id == route_decision["recipient_id"]).first()
        if recipient:
            transfer_res = transfer_coordinator.initiate_transfer(
                db=db,
                call_id=str(call_id),
                recipient=recipient,
                purpose=transcript,
            )
            return {"routing": route_decision, "transfer": transfer_res}

    return {"routing": route_decision, "transfer": None}


@router.post("/{id}/accept")
def accept_transfer(
    id: UUID = Path(..., description="Transfer UUID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist"])),
):
    """Recipient or Operator accepts warm transfer and bridges call legs."""
    res = transfer_coordinator.process_recipient_decision(db=db, transfer_id=str(id), decision="accept")
    return res


@router.post("/{id}/decline")
def decline_transfer(
    id: UUID = Path(..., description="Transfer UUID"),
    notes: Optional[str] = Body(default=None, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist"])),
):
    """Recipient or Operator declines warm transfer, triggering fallback workflow."""
    res = transfer_coordinator.process_recipient_decision(db=db, transfer_id=str(id), decision="decline", notes=notes)
    return res


@router.post("/{id}/cancel")
def cancel_transfer(
    id: UUID = Path(..., description="Transfer UUID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist"])),
):
    """Operator cancels warm transfer attempt."""
    res = transfer_coordinator.process_recipient_decision(db=db, transfer_id=str(id), decision="no_answer", notes="Operator cancelled")
    return res
