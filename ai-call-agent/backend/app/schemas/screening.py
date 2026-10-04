"""
Structured Pydantic Schemas for AI Call Screening, Entity Extraction, and Unified Risk Assessment.
"""

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field


class ExtractedScreeningInfo(BaseModel):
    """Structured information extracted by AI during screening dialogue."""
    caller_name: Optional[str] = Field(None, description="Identified or stated caller name")
    organization: Optional[str] = Field(None, description="Stated organization/company (e.g. Bank, College, Delivery)")
    purpose: Optional[str] = Field(None, description="Explicit stated purpose/reason for the call")
    department: Optional[str] = Field("General", description="Relevant department or area")
    urgency: str = Field("medium", description="low | medium | high | urgent")
    language: str = Field("en-IN", description="Detected language: en-IN | hi-IN | hinglish")
    callback_requested: bool = Field(False, description="Whether caller requested a callback")
    human_requested: bool = Field(False, description="Whether caller explicitly asked for human/Alex")
    stated_identity: Optional[str] = Field(None, description="Stated role (e.g. teammate, courier, delivery agent)")
    requested_action: Optional[str] = Field(None, description="Requested action (e.g. meeting, confirm delivery, discuss project)")


class UnifiedRiskAssessment(BaseModel):
    """
    Unified multi-signal risk assessment combining ML classifier (TF-IDF + Logistic Regression),
    deterministic regex safety rules, reputation lookups, and behavioral signals.
    """
    risk_level: str = Field(..., description="LOW | UNCERTAIN | HIGH")
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Calibrated risk score between 0.00 and 1.00")
    category: str = Field(
        ...,
        description="FINANCIAL_SCAM | PHISHING_OTP | IMPERSONATION | TELEMARKETING | LEGITIMATE | UNKNOWN"
    )
    flagged_phrases: List[str] = Field(default_factory=list, description="Specific suspicious keywords/phrases flagged")
    evidence: List[str] = Field(default_factory=list, description="Transcript excerpts demonstrating risk")
    reasoning: str = Field("", description="Explainable rationale behind the classification")
    recommended_action: str = Field(
        ...,
        description="SAFE_TO_FORWARD | CONTINUE_SCREENING | REVIEW_REQUIRED | DO_NOT_FORWARD"
    )
    classifier_version: str = Field("v2.5.0-spam_model_hybrid", description="Model and rule engine version")
    screening_question_count: int = Field(0, description="Number of questions asked to caller so far")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PersonalAssistantSettings(BaseModel):
    """Personal Assistant and Call Screening Configuration."""
    user_name: str = Field("Alex", description="Owner/User name")
    assistant_name: str = Field("AI Screening Assistant", description="Persona name")
    language: str = Field("en-IN", description="Preferred language (en-IN, hi-IN, mixed)")
    greeting_style: str = Field("bilingual", description="bilingual | english | hindi")
    max_screening_questions: int = Field(3, ge=1, le=5, description="Maximum neutral questions before decision")
    low_risk_threshold: float = Field(0.30, ge=0.0, le=1.0, description="Risk <= low_risk_threshold is LOW")
    uncertain_risk_threshold: float = Field(0.70, ge=0.0, le=1.0, description="Risk <= uncertain is UNCERTAIN, above is HIGH")
    forwarding_destination: str = Field("+919876543210", description="Personal phone number to ring")
    dnd_enabled: bool = Field(False, description="Do Not Disturb mode")


class UserScreeningActionRequest(BaseModel):
    """Action taken by user when call is forwarded/screened."""
    action: str = Field(..., description="ANSWER | DECLINE | LET_AI_HANDLE | TAKE_OVER")
    notes: Optional[str] = Field(None, description="Optional operator/user notes")
