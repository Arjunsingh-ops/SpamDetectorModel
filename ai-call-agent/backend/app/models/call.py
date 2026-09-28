"""Call Record Entity Model."""

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class Call(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "calls"

    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    phone_number_id = Column(GUID, ForeignKey("phone_numbers.id", ondelete="SET NULL"), nullable=True, index=True)

    external_call_sid = Column(String(100), unique=True, index=True, nullable=False)  # Provider Call ID
    caller_number = Column(String(32), index=True, nullable=False)  # E.164
    recipient_number = Column(String(32), index=True, nullable=False)  # E.164
    direction = Column(String(20), nullable=False, default="inbound")  # inbound | outbound

    # Status State Machine: RINGING | ANSWERED | SCREENING | CLASSIFIED | TRANSFERRING | COMPLETED | FLAGGED | NEEDS_REVIEW | FAILED | MISSED | ABANDONED
    status = Column(String(30), nullable=False, default="RINGING", index=True)
    # Disposition / Classification: legitimate | spam | uncertain | missed | blocked
    disposition = Column(String(30), nullable=False, default="uncertain", index=True)

    detected_language = Column(String(20), nullable=False, default="en-IN")  # en-IN | hi-IN | mixed
    caller_name = Column(String(255), nullable=True)
    caller_intent = Column(Text, nullable=True)

    duration_seconds = Column(Integer, default=0, nullable=False)
    spam_score = Column(Integer, default=0, nullable=False, index=True)  # 0 to 100

    recording_s3_key = Column(String(512), nullable=True)
    transcript_summary = Column(Text, nullable=True)

    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Stage 3 Telephony Fields
    telephony_provider = Column(String(50), nullable=False, default="twilio")
    provider_call_id = Column(String(100), nullable=True, index=True)
    stream_id = Column(String(100), nullable=True, index=True)
    provider_status = Column(String(50), nullable=True)
    call_direction = Column(String(20), nullable=False, default="inbound")
    destination_number = Column(String(32), nullable=True)
    connect_time = Column(DateTime(timezone=True), nullable=True)
    disconnect_reason = Column(String(100), nullable=True)
    audio_session_status = Column(String(30), nullable=False, default="idle")
    provider_error_code = Column(String(50), nullable=True)

    # Relationships
    user = relationship("User", back_populates="calls")
    phone_number = relationship("PhoneNumber", back_populates="calls")
    events = relationship("CallEvent", back_populates="call", cascade="all, delete-orphan", order_by="CallEvent.created_at")
    conversation = relationship("Conversation", back_populates="call", uselist=False, cascade="all, delete-orphan")
    spam_assessment = relationship("SpamAssessment", back_populates="call", uselist=False, cascade="all, delete-orphan")
    transfers = relationship("TransferRecord", back_populates="call", cascade="all, delete-orphan")
    spam_report = relationship("SpamReport", back_populates="call", uselist=False, cascade="all, delete-orphan")


Index("ix_calls_status_disposition", Call.status, Call.disposition)
