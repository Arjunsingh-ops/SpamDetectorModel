"""Telephony Webhooks, Media Stream WebSocket, and SSE Endpoint Router."""

import json
import asyncio
import logging
from typing import Optional
from fastapi import APIRouter, Request, Response, Depends, HTTPException, WebSocket, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user_from_token
from app.integrations.telephony.twilio_adapter import twilio_telephony_adapter
from app.integrations.telephony.mock_adapter import mock_telephony_adapter
from app.integrations.telephony.media_stream import MediaStreamSession
from app.services.call_session import call_session_service
from app.services.call_lifecycle import call_lifecycle_service
from app.services.broadcaster import broadcaster

logger = logging.getLogger("ai_call_agent.api.v1.telephony")

router = APIRouter(prefix="/telephony", tags=["telephony"])


def get_active_adapter():
    """Return provider adapter based on TELEPHONY_PROVIDER setting."""
    provider = getattr(settings, "TELEPHONY_PROVIDER", "twilio").lower()
    if provider == "mock":
        return mock_telephony_adapter
    return twilio_telephony_adapter


@router.post("/incoming")
async def handle_incoming_call(request: Request, db: Session = Depends(get_db)):
    """
    Webhook endpoint for inbound call notifications from carrier (Twilio / Exotel / Mock).
    Validates webhook signature, initializes call session in DB, returns greeting TwiML XML.
    """
    # Parse form parameters (Twilio sends application/x-www-form-urlencoded)
    form_data = await request.form()
    params = dict(form_data)

    # If empty form_data (e.g. JSON test payload), fallback to JSON body
    if not params:
        try:
            params = await request.json()
        except Exception:
            params = {}

    adapter = get_active_adapter()

    # Signature verification
    signature = request.headers.get("X-Twilio-Signature", "")
    full_url = str(request.url)

    if not adapter.verify_webhook_signature(full_url, params, signature):
        logger.warning(f"Rejected invalid telephony incoming webhook signature from {request.client.host}")
        raise HTTPException(status_code=403, detail="Invalid carrier webhook signature.")

    # Normalize payload
    parsed = adapter.parse_inbound_webhook(params)
    if not parsed.get("provider_call_id"):
        raise HTTPException(status_code=400, detail="Missing carrier CallSid parameter.")

    # Idempotent call session creation in PostgreSQL
    call, is_new = call_session_service.get_or_create_inbound_session(db, parsed)

    # Determine WSS stream URL
    public_wss = getattr(settings, "PUBLIC_WSS_URL", "wss://localhost:8000")
    if public_wss.endswith("/"):
        public_wss = public_wss[:-1]
    stream_url = f"{public_wss}/api/v1/telephony/stream"

    # Greeting configuration
    greeting_lang = getattr(settings, "DEFAULT_LANGUAGE", "en-IN")
    if greeting_lang == "hi-IN":
        greeting_text = "नमस्ते, आपने हमारे एआई रिसेप्शन सेवा से संपर्क किया है। कृपया अपनी कॉल का कारण बताएं।"
    else:
        greeting_text = "Hello, you've reached our AI-assisted reception service. This call may be processed to help direct your request. Please tell us the reason for your call."

    twiml_content = adapter.generate_answer_response(
        call_id=str(call.id),
        stream_url=stream_url,
        initial_greeting=greeting_text,
        language=greeting_lang,
        recording_notice=True,
    )

    # Broadcast event to active dashboard subscribers
    asyncio.create_task(
        broadcaster.broadcast(
            "INCOMING_CALL",
            {
                "call_id": str(call.id),
                "provider_call_id": call.provider_call_id,
                "caller_number": call.caller_number,
                "status": call.status,
                "started_at": call.started_at.isoformat() if call.started_at else None,
            },
        )
    )

    return Response(content=twiml_content, media_type="application/xml")


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

    adapter = get_active_adapter()
    signature = request.headers.get("X-Twilio-Signature", "")
    full_url = str(request.url)

    if not adapter.verify_webhook_signature(full_url, params, signature):
        logger.warning(f"Rejected invalid telephony status webhook signature from {request.client.host}")
        raise HTTPException(status_code=403, detail="Invalid status webhook signature.")

    provider_call_id = params.get("CallSid", "")
    status_str = params.get("CallStatus", "completed")
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
    WebSocket endpoint for bidirectional real-time audio media streaming from Twilio Media Streams.
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
    # Verify authentication token if provided
    if token:
        try:
            get_current_user_from_token(token, db)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token for SSE stream")

    async def event_generator():
        queue = broadcaster.subscribe()
        try:
            # Send initial connection handshake
            yield f"data: {json.dumps({'event': 'CONNECTED', 'message': 'Live telephony stream active'})}\n\n"

            while True:
                payload = await queue.get()
                yield f"data: {json.dumps(payload)}\n\n"
        except asyncio.CancelledError:
            broadcaster.unsubscribe(queue)
        finally:
            broadcaster.unsubscribe(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
