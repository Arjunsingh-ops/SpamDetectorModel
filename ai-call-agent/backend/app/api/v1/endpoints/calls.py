"""Call Lifecycle, History, Event Timeline & Conversation Endpoints."""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Path, Request, status, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import RequireRole
from app.services.call_service import CallService
from app.repositories.call_repository import CallRepository
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.call import (
    CallResponse,
)

router = APIRouter(tags=["Calls & Telephony"])


@router.get(
    "/calls",
    response_model=PaginatedResponse[CallResponse],
    summary="List Call Records",
    description="Retrieve paginated call records. Enforces tenant ownership checks to prevent cross-user data access.",
)
def list_calls(
    status: Optional[str] = Query(None, description="Filter by status: RINGING | COMPLETED | FLAGGED"),
    disposition: Optional[str] = Query(None, description="Filter by disposition: legitimate | spam | uncertain"),
    search: Optional[str] = Query(None, description="Search caller number or intent"),
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    service = CallService(db)
    # Admin sees all, operators see own calls
    owner_filter = None if current_user.role == "admin" else current_user.id
    result = service.list_calls(
        status=status,
        disposition=disposition,
        limit=limit,
        page=page,
        owner_user_id=owner_filter,
    )
    return result


@router.get(
    "/calls/{id}",
    response_model=CallResponse,
    summary="Get Call Details",
    description="Retrieve single call details by UUID.",
)
def get_call_by_id(
    id: UUID = Path(..., description="UUID of the call record"),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    repo = CallRepository(db)
    owner_filter = None if current_user.role == "admin" else current_user.id
    call = repo.get_by_id(id, owner_user_id=owner_filter)

    if not call:
        raise HTTPException(status_code=404, detail=f"Call with ID '{id}' was not found or access is forbidden.")

    return call


@router.get(
    "/calls/{id}/events",
    summary="Get Call Forensic Event Timeline",
    description="Retrieve ordered chronological event stream for a call session.",
)
def get_call_events(
    id: UUID = Path(..., description="UUID of the call record"),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    repo = CallRepository(db)
    owner_filter = None if current_user.role == "admin" else current_user.id
    call = repo.get_by_id(id, owner_user_id=owner_filter)

    if not call:
        raise HTTPException(status_code=404, detail=f"Call with ID '{id}' was not found.")

    events = repo.get_events_for_call(id)
    return [
        {
            "id": str(e.id),
            "callId": str(e.call_id),
            "eventType": e.event_type,
            "actor": e.actor,
            "payload": e.payload,
            "createdAt": e.created_at.isoformat(),
        }
        for e in events
    ]


@router.get(
    "/calls/{id}/conversation",
    summary="Get Conversation Transcript & Audio Metadata",
    description="Retrieve transcript, summary, and encrypted audio reference. Never returns raw binary audio in DB response.",
)
def get_call_conversation(
    id: UUID = Path(..., description="UUID of the call record"),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    repo = CallRepository(db)
    owner_filter = None if current_user.role == "admin" else current_user.id
    call = repo.get_by_id(id, owner_user_id=owner_filter)

    if not call:
        raise HTTPException(status_code=404, detail=f"Call with ID '{id}' was not found.")

    conv = repo.get_conversation(id)
    if not conv:
        return {
            "callId": str(id),
            "transcript": call.caller_intent or "Transcript unavailable.",
            "language": call.detected_language,
            "summary": call.transcript_summary or "Call summary logged.",
            "recordingReference": call.recording_s3_key,
        }

    return {
        "id": str(conv.id),
        "callId": str(conv.call_id),
        "transcript": conv.transcript,
        "language": conv.language,
        "summary": conv.summary,
        "recordingReference": conv.recording_reference,
        "entitiesExtracted": conv.entities_extracted,
    }


@router.post(
    "/telephony/webhook",
    status_code=status.HTTP_200_OK,
    summary="Carrier Telephony Ingress Webhook",
    description="Carrier ingress hook invoked upon incoming PSTN call. Returns stream URL and bilingual greeting.",
)
async def telephony_inbound_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            payload = await request.json()
        else:
            form = await request.form()
            payload = dict(form)
    except Exception:
        payload = {}

    service = CallService(db)
    result = service.process_inbound_call(payload)

    if isinstance(result, str):
        from fastapi import Response
        return Response(content=result, media_type="application/xml")

    return result
