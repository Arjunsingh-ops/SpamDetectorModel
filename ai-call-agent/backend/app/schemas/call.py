"""Call Management Schemas."""

from typing import List, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.common import IdentifiableSchema, BaseSchema


class CallEventResponse(IdentifiableSchema):
    event_type: str
    actor: str
    payload: Optional[dict] = None


class CallBase(BaseSchema):
    external_call_sid: str
    caller_number: str
    recipient_number: str
    direction: str = "inbound"
    status: str
    disposition: str
    detected_language: str = "en-IN"
    caller_name: Optional[str] = None
    caller_intent: Optional[str] = None
    duration_seconds: int = 0
    spam_score: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class CallResponse(CallBase, IdentifiableSchema):
    pass


class CallDetailResponse(CallResponse):
    transcript_summary: Optional[str] = None
    recording_s3_key: Optional[str] = None
    events: List[CallEventResponse] = Field(default_factory=list)


class InboundWebhookPayload(BaseModel):
    CallSid: str
    From: str
    To: str
    CallStatus: Optional[str] = "ringing"
    Direction: Optional[str] = "inbound"
    CallerName: Optional[str] = None
    SpeechResult: Optional[str] = None


class WebhookActionResponse(BaseModel):
    action: str
    call_session_id: UUID
    stream_url: Optional[str] = None
    initial_greeting: str
    instruction: Optional[str] = None
