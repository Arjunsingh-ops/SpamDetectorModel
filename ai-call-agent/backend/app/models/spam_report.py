"""Human-in-the-Loop Spam Verification and Regulatory Reporting Model."""

from sqlalchemy import Column, String, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class SpamReport(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "spam_reports"

    call_id = Column(GUID, ForeignKey("calls.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    reviewed_by_user_id = Column(GUID, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)

    review_decision = Column(String(50), nullable=False)  # confirmed_spam | false_positive
    report_status = Column(String(50), nullable=False, default="reviewed")  # pending_review | reviewed | submitted_to_authority
    reported_to_telecom_authority = Column(Boolean, default=False, nullable=False)
    authority_reference_id = Column(String(100), nullable=True)  # e.g., TRAI/Chakshu Ticket #
    reviewer_notes = Column(Text, nullable=True)

    # Relationships
    call = relationship("Call", back_populates="spam_report")
    reviewed_by_user = relationship("User", back_populates="spam_reports")
