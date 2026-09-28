"""Call Event Stream Model for Light Event Sourcing."""

from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class CallEvent(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "call_events"

    call_id = Column(GUID, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)  # e.g., RINGING, INTENT_EXTRACTED, TRANSFER_INITIATED
    actor = Column(String(50), nullable=False, default="system")  # telephony | voice_ai | spam_engine | system
    payload = Column(JSON, nullable=True)  # Context data

    # Relationships
    call = relationship("Call", back_populates="events")
