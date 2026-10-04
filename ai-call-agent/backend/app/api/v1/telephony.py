"""Telephony Webhooks, Media Stream WebSocket, Screening Orchestrator, and SSE Endpoint Router."""

import json
import asyncio
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Request, Response, Depends, HTTPException, WebSocket, Query, Body, Path
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user_from_token
from app.telephony import get_telephony_adapter
from app.integrations.telephony.media_stream import MediaStreamSession
from app.services.call_screening_orchestrator import call_screening_orchestrator
from app.services.call_session import call_session_service
from app.services.call_lifecycle import call_lifecycle_service
from app.services.broadcaster import broadcaster
from app.schemas.screening import PersonalAssistantSettings, UserScreeningActionRequest

logger = logging.getLogger("ai_call_agent.api.v1.telephony")

router = APIRouter(prefix="/telephony", tags=["telephony"])


@router.post("/incoming")
async def handle_incoming_call(request: Request, db: Session = Depends(get_db)):
    """
    Production Webhook endpoint for inbound calls from carrier (Twilio / SIP / Mock).
    Validates webhook signature, initializes call session, triggers personal AI answering & greeting.
    """
    form_data = await request.form()
    params = dict(form_data)
    if not params:
        try:
            params = await request.json()
        except Exception:
            params = {}

    adapter = get_telephony_adapter()

    # Cryptographic signature verification
    signature = request.headers.get("X-Twilio-Signature", "")
    full_url = str(request.url)
    if not adapter.verify_webhook_signature(full_url, params, signature):
        logger.warning(f"Rejected invalid telephony incoming webhook signature from {request.client.host}")
        raise HTTPException(status_code=403, detail="Invalid carrier webhook signature.")

    parsed = adapter.parse_inbound_webhook(params)
    if not parsed.get("provider_call_id") and not parsed.get("external_call_sid"):
        raise HTTPException(status_code=400, detail="Missing carrier CallSid parameter.")

    # Execute orchestrator inbound call initialization
    result = await call_screening_orchestrator.handle_inbound_call(
        db=db,
        provider_data=parsed,
        is_simulation=False,
    )

    if adapter.name == "twilio":
        return Response(content=result["provider_response"], media_type="application/xml")
    return Response(content=result["provider_response"], media_type="application/json")


@router.post("/utterance")
async def handle_caller_utterance(
    call_id: str = Body(..., embed=True),
    transcript: Optional[str] = Body(None, embed=True),
    speech: Optional[str] = Body(None, embed=True),
    question_count: int = Body(default=1, embed=True),
    db: Session = Depends(get_db),
):
    """
    Process caller speech turn during screening:
    Runs speech recognition -> Intent slot extraction -> Multi-factor fraud engine
    -> Safe forwarding / continue screening / quarantine decision.
    """
    caller_text = speech or transcript or ""
    try:
        res = await call_screening_orchestrator.process_caller_utterance(
            db=db,
            call_id=call_id,
            caller_speech=caller_text,
            question_count=question_count,
            is_simulation=False,
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/calls/{id}/user-action")
async def handle_user_screening_action(
    id: str = Path(..., description="Call ID or External SID"),
    action_data: UserScreeningActionRequest = Body(...),
    db: Session = Depends(get_db),
):
    """
    Action executed by user when receiving an AI-screened incoming call:
    - ANSWER: Confirms transfer, stops AI speech/inference, bridges caller and user, AI exits.
    - DECLINE: AI resumes control, offers voicemail or callback.
    - LET_AI_HANDLE: AI continues screening / takes message.
    - TAKE_OVER: Immediate manual bridge.
    """
    res = await call_screening_orchestrator.handle_user_decision(
        db=db,
        call_id=id,
        action=action_data.action,
        notes=action_data.notes,
    )
    return res


@router.post("/simulate")
async def simulate_call_screening_flow(
    caller_number: str = Body("+919876543210", embed=True),
    caller_name: Optional[str] = Body(None, embed=True),
    caller_speech: Optional[str] = Body(None, embed=True),
    question_count: int = Body(1, embed=True),
    db: Session = Depends(get_db),
):
    """
    Full End-to-End Browser Simulator Endpoint (Browser A: Caller -> Browser B: User).
    Simulates real-world phone screening without requiring paid telephony carrier accounts.
    """
    sim_data = {
        "external_call_sid": f"sim-{int(asyncio.get_event_loop().time() * 1000)}",
        "caller_number": caller_number,
        "destination_number": "+911122334455",
        "caller_name": caller_name,
        "telephony_provider": "mock",
    }

    # 1. AI Answers Call
    inbound_res = await call_screening_orchestrator.handle_inbound_call(
        db=db,
        provider_data=sim_data,
        is_simulation=True,
    )
    call_id = inbound_res["call_id"]

    response = {
        "status": "success",
        "simulation": True,
        "call_id": call_id,
        "external_call_sid": inbound_res["external_call_sid"],
        "initial_greeting": inbound_res["greeting"],
    }

    # 2. If caller speech provided, process it through the AI conversation & spam pipeline
    if caller_speech:
        screening_res = await call_screening_orchestrator.process_caller_utterance(
            db=db,
            call_id=call_id,
            caller_speech=caller_speech,
            question_count=question_count,
            is_simulation=True,
        )
        response.update({
            "caller_speech": caller_speech,
            "screening_info": screening_res["screening_info"],
            "risk_assessment": screening_res["risk_assessment"],
            "recommended_action": screening_res["recommended_action"],
            "decision": screening_res["decision"],
            "next_ai_utterance": screening_res["next_ai_utterance"],
            "user_prompt_required": screening_res["user_prompt_required"],
            "transfer": screening_res.get("transfer"),
        })

    return response


@router.get("/screening-settings")
def get_personal_screening_settings():
    """Retrieve active personal assistant and screening policy settings."""
    return call_screening_orchestrator.settings.model_dump()


@router.put("/screening-settings")
def update_personal_screening_settings(settings_update: PersonalAssistantSettings):
    """Update personal assistant settings (user name, greeting, thresholds, etc.)."""
    call_screening_orchestrator.settings = settings_update
    call_screening_orchestrator.screening_dialogue.settings = settings_update
    return {"status": "updated", "settings": call_screening_orchestrator.settings.model_dump()}


@router.post("/status")
async def handle_call_status(request: Request, db: Session = Depends(get_db)):
    """
    Webhook callback endpoint for provider call status updates (ringing, in-progress, completed, failed, busy).
    """
    form_data = await request.form()
    params = dict(form_data)
    if not params:
        try:
            params = await request.json()
        except Exception:
            params = {}

    adapter = get_telephony_adapter()
    signature = request.headers.get("X-Twilio-Signature", "")
    full_url = str(request.url)

    if not adapter.verify_webhook_signature(full_url, params, signature):
        logger.warning(f"Rejected invalid telephony status webhook signature from {request.client.host}")
        raise HTTPException(status_code=403, detail="Invalid status webhook signature.")

    provider_call_id = params.get("CallSid") or params.get("external_call_sid") or ""
    status_str = params.get("CallStatus") or params.get("status") or "completed"
    duration = int(params.get("CallDuration", 0) or 0)
    error_code = params.get("ErrorCode")

    updated_call = call_lifecycle_service.process_status_event(
        db=db,
        provider_call_id=provider_call_id,
        provider_status=status_str,
        duration_seconds=duration,
        error_code=error_code,
        event_metadata=params,
    )

    if updated_call:
        asyncio.create_task(
            broadcaster.broadcast(
                "CALL_STATUS_UPDATE",
                {
                    "call_id": str(updated_call.id),
                    "provider_call_id": updated_call.provider_call_id,
                    "status": updated_call.status,
                    "provider_status": updated_call.provider_status,
                    "duration_seconds": updated_call.duration_seconds,
                    "completed_at": updated_call.completed_at.isoformat() if updated_call.completed_at else None,
                },
            )
        )

    return {"status": "ok", "provider_call_id": provider_call_id}


@router.websocket("/stream")
async def handle_telephony_media_stream(websocket: WebSocket):
    """
    WebSocket endpoint for bidirectional real-time audio media streaming from telephony providers.
    """
    session = MediaStreamSession(websocket=websocket)
    await session.accept()
    await session.receive_loop()


@router.get("/events/stream")
async def stream_live_call_events(
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Server-Sent Events (SSE) live streaming endpoint for the dashboard.
    Pushes real-time call notifications to connected UI components.
    """
    if token:
        try:
            get_current_user_from_token(token, db)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token for SSE stream")

    async def event_generator():
        queue = broadcaster.subscribe()
        try:
            yield f"data: {json.dumps({'event': 'CONNECTED', 'message': 'Live telephony stream active'})}\n\n"
            while True:
                payload = await queue.get()
                yield f"data: {json.dumps(payload)}\n\n"
        except asyncio.CancelledError:
            broadcaster.unsubscribe(queue)
        finally:
            broadcaster.unsubscribe(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
