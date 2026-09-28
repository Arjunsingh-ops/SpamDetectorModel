"""Pydantic Schemas for Multi-Factor Spam Engine."""

from typing import List, Optional
from pydantic import BaseModel, Field


class SpamAssessmentResultSchema(BaseModel):
    """Structured Pydantic schema for Spam & Fraud Classification Output."""

    category: str = Field(..., description="legitimate | marketing | suspected_spam | suspected_scam | unknown")
    composite_score: int = Field(..., description="Aggregated risk score 0 to 100")
    reputation_score: int = Field(0, description="Reputation pillar score 0 to 100")
    semantic_score: int = Field(0, description="Semantic pillar score 0 to 100")
    behavioral_score: int = Field(0, description="Behavioral pillar score 0 to 100")
    confidence: float = Field(1.0, description="Confidence rating 0.0 to 1.0")
    indicators: List[str] = Field(default_factory=list, description="Detected risk trigger flags")
    evidence_segments: List[str] = Field(default_factory=list, description="Extracted transcript quotes")
    recommended_action: str = Field("continue", description="continue | screen_further | review")
    explanation: str = Field("", description="Human-readable explainable rationale")


class AllowlistBlocklistRequest(BaseModel):
    phone_number: str = Field(..., description="Target E.164 phone number")
    list_type: str = Field(..., description="allowlist | blocklist")
    reason: Optional[str] = Field(None, description="Reason for allowlist/blocklist placement")


class SpamRuleCreateRequest(BaseModel):
    rule_name: str
    category: str = "semantic"
    pattern: str
    weight: int = 20
    is_active: bool = True
    description: Optional[str] = None


class SpamOverviewMetrics(BaseModel):
    total_screened_calls: int = 0
    flagged_for_review: int = 0
    confirmed_spam_calls: int = 0
    confirmed_legitimate_calls: int = 0
    pending_reviews: int = 0
    false_positives: int = 0
    false_negatives: int = 0
    precision: float = 0.0
    recall: float = 0.0
    f1_score: float = 0.0
