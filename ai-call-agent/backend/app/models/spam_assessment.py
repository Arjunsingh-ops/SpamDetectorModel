"""Multi-Factor Spam and Fraud Assessment Model."""

from sqlalchemy import Column, Integer, Float, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class SpamAssessment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "spam_assessments"

    call_id = Column(GUID, ForeignKey("calls.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    composite_score = Column(Integer, nullable=False, index=True)  # 0 to 100
    reputation_score = Column(Integer, nullable=False, default=0)   # Pillar A (0-100)
    semantic_score = Column(Integer, nullable=False, default=0)     # Pillar B (0-100)
    behavioral_score = Column(Integer, nullable=False, default=0)   # Pillar C (0-100)

    classification = Column(String(30), nullable=False)  # legitimate | uncertain | spam
    confidence = Column(Float, nullable=False, default=1.0)  # 0.00 to 1.00
    detected_triggers = Column(String(512), nullable=True)  # e.g. "urgent_kyc_claim, unfamiliar_cli"
    ai_rationale = Column(Text, nullable=True)
    model_version = Column(String(50), nullable=False, default="v1.0.0-heuristics")

    # Relationships
    call = relationship("Call", back_populates="spam_assessment")
