"""Call Transfer and Forwarding Record Model."""

from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class TransferRecord(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Immutable Transfer State Machine and Call Forwarding Audit Model."""

    __tablename__ = "transfers"

    call_id = Column(GUID, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(GUID, ForeignKey("recipients.id", ondelete="SET NULL"), nullable=True, index=True)

    target_phone_number = Column(String(32), nullable=False)  # E.164
    target_name = Column(String(100), nullable=True)
    department = Column(String(50), nullable=True)

    transfer_type = Column(String(30), nullable=False, default="warm")  # warm | blind | fallback_voicemail | fallback_callback
    # 16-State Lifecycle: REQUESTED | VALIDATING | QUEUED | DIALING | RINGING | ANNOUNCING | AWAITING_ACCEPTANCE | ACCEPTED | BRIDGING | CONNECTED | DECLINED | NO_ANSWER | BUSY | FAILED | CANCELLED | COMPLETED
    transfer_status = Column(String(30), nullable=False, default="REQUESTED")
    failure_reason = Column(String(100), nullable=True)  # busy | no_answer | declined | sip_error | timeout | toll_fraud_blocked
    announcement_text = Column(Text, nullable=True)
    duration_seconds = Column(Integer, default=0, nullable=False)

    # Relationships
    call = relationship("Call", back_populates="transfers")
    recipient = relationship("Recipient", back_populates="transfers")
