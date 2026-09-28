"""Call Conversation Transcript & Recording Metadata Model."""

from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class Conversation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "conversations"

    call_id = Column(GUID, ForeignKey("calls.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    transcript = Column(Text, nullable=False, default="")
    language = Column(String(20), nullable=False, default="en-IN")  # en-IN | hi-IN | mixed
    summary = Column(Text, nullable=True)
    recording_reference = Column(String(512), nullable=True)  # S3 Key URI string (Never raw binary)
    entities_extracted = Column(JSON, nullable=True)  # Extracted slots (caller_name, purpose, urgency)

    # Relationships
    call = relationship("Call", back_populates="conversation")
