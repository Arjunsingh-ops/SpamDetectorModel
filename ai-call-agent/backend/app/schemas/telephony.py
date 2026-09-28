"""Pydantic Schemas for Telephony Webhooks & Stream Messages."""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class InboundWebhookSchema(BaseModel):
    """Normalized payload structure for inbound call webhooks."""

    CallSid: str = Field(..., description="Carrier unique call identifier")
    From: str = Field(..., description="Caller E.164 phone number")
    To: str = Field(..., description="Recipient E.164 phone number")
    CallStatus: str = Field("ringing", description="Current call status reported by carrier")
    Direction: Optional[str] = Field("inbound", description="Call direction")
    ApiVersion: Optional[str] = None
    AccountSid: Optional[str] = None
    CallerName: Optional[str] = None

    class Config:
        extra = "allow"


class CallStatusWebhookSchema(BaseModel):
    """Normalized payload structure for call status callbacks."""

    CallSid: str = Field(..., description="Carrier unique call identifier")
    CallStatus: str = Field(..., description="Updated call status")
    CallDuration: Optional[int] = Field(0, description="Duration in seconds")
    ErrorCode: Optional[str] = None
    ErrorMessage: Optional[str] = None
    SequenceNumber: Optional[int] = None

    class Config:
        extra = "allow"


class StreamStartPayload(BaseModel):
    """Payload sent in WebSocket stream 'start' event."""

    streamSid: str
    callSid: str
    accountSid: Optional[str] = None
    mediaFormat: Optional[Dict[str, Any]] = None


class TelephonyResponseSchema(BaseModel):
    """Internal response payload schema."""

    success: bool
    call_id: str
    provider_call_id: str
    status: str
    message: str
