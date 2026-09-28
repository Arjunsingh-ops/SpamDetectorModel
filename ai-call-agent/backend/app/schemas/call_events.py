"""Pydantic Schemas for Call Events."""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID


class CallEventCreate(BaseModel):
    """Schema to record a new call event."""

    call_id: UUID
    event_type: str = Field(..., description="e.g. INCOMING, RINGING, ANSWERED, GREETING, STREAMING, COMPLETED, FAILED")
    actor: Optional[str] = Field("operator", description="Actor triggering event")
    payload: Optional[Dict[str, Any]] = None


class CallEventResponse(BaseModel):
    """Schema for call event response."""

    id: UUID
    call_id: UUID
    event_type: str
    actor: str
    payload: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
