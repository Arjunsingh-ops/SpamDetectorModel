"""Spam and Fraud Assessment Schemas."""

from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.common import IdentifiableSchema


class SpamAssessmentResponse(IdentifiableSchema):
    call_id: UUID
    composite_score: int
    reputation_score: int
    semantic_score: int
    behavioral_score: int
    classification: str
    confidence: float
    detected_triggers: Optional[str] = None
    ai_rationale: Optional[str] = None


class SpamReviewRequest(BaseModel):
    decision: str = Field(description="confirmed_spam | false_positive")
    submit_telecom_report: bool = Field(default=False, description="Requires human admin signoff")
    notes: Optional[str] = None


class SpamReviewResponse(BaseModel):
    status: str
    call_id: UUID
    review_decision: str
    reported_to_authority: bool
    authority_reference_id: Optional[str] = None
    message: str
