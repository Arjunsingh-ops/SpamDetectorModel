"""Pydantic Schemas for Caller Intent, Recipient Management, and Smart Routing."""

from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from uuid import UUID
import re


class CallerIntent(BaseModel):
    """Structured Intent extracted from Live Conversation Transcript."""

    caller_name: Optional[str] = Field(default=None, description="Caller's identified full name")
    purpose: str = Field(..., description="Stated purpose of the call")
    requested_recipient: Optional[str] = Field(default=None, description="Requested individual name or title")
    requested_department: Optional[str] = Field(default="General", description="Requested department (Sales, Support, Executive, Admin, General)")
    urgency_stated: Optional[str] = Field(default="normal", description="Stated urgency (low, normal, urgent)")
    preferred_language: str = Field(default="en-IN", description="Detected language (en-IN, hi-IN, hinglish)")
    human_requested: bool = Field(default=False, description="Whether caller explicitly asked to speak to a human")
    callback_acceptable: bool = Field(default=True, description="Whether caller is willing to receive a callback")


class RecipientBase(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=100)
    department: str = Field(default="General", max_length=50)
    role_title: Optional[str] = Field(default=None, max_length=100)
    phone_number: str = Field(..., description="E.164 destination telephone number")
    sip_uri: Optional[str] = Field(default=None)
    availability_status: str = Field(default="available", description="available | busy | away | dnd | offline")
    business_hours_start: str = Field(default="09:00", pattern=r"^\d{2}:\d{2}$")
    business_hours_end: str = Field(default="18:00", pattern=r"^\d{2}:\d{2}$")
    time_zone: str = Field(default="Asia/Kolkata")
    work_days: List[str] = Field(default=["mon", "tue", "wed", "thu", "fri"])
    routing_priority: int = Field(default=1, ge=1, le=10)
    allow_warm_transfer: bool = Field(default=True)
    enable_voicemail: bool = Field(default=True)
    enable_callback_requests: bool = Field(default=True)
    is_active: bool = Field(default=True)

    @field_validator("phone_number")
    @classmethod
    def validate_e164(cls, v: str) -> str:
        if not v:
            raise ValueError("Phone number cannot be empty")
        cleaned = re.sub(r"[^\d+]", "", v)
        if not cleaned.startswith("+"):
            if len(cleaned) == 10:
                cleaned = "+91" + cleaned
            else:
                cleaned = "+" + cleaned
        if len(cleaned) < 8 or len(cleaned) > 16:
            raise ValueError("Invalid E.164 destination phone number format")
        return cleaned


class RecipientCreate(RecipientBase):
    group_id: Optional[UUID] = None
    backup_recipient_id: Optional[UUID] = None


class RecipientUpdate(BaseModel):
    display_name: Optional[str] = None
    department: Optional[str] = None
    role_title: Optional[str] = None
    phone_number: Optional[str] = None
    availability_status: Optional[str] = None
    business_hours_start: Optional[str] = None
    business_hours_end: Optional[str] = None
    routing_priority: Optional[int] = None
    backup_recipient_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class RecipientResponse(RecipientBase):
    id: UUID
    group_id: Optional[UUID] = None
    backup_recipient_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AvailabilityStatusUpdate(BaseModel):
    status: str = Field(..., description="available | busy | away | dnd | offline")
    reason: Optional[str] = Field(default=None, max_length=255)


class RoutingRuleSchema(BaseModel):
    rule_name: str
    department: Optional[str] = None
    match_intent_pattern: Optional[str] = None
    max_spam_score_allowed: int = 69
    fallback_strategy: str = "backup_recipient"
    is_active: bool = True
