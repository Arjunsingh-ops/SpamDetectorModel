"""Voicemail Message Record Model."""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Boolean
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class VoicemailMessage(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Voicemail Recording & Transcript Model."""

    __tablename__ = "voicemail_messages"

    call_id = Column(GUID, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(GUID, ForeignKey("recipients.id", ondelete="SET NULL"), nullable=True, index=True)
    caller_number = Column(String(32), nullable=False)
    caller_name = Column(String(100), nullable=True)
    duration_seconds = Column(Integer, nullable=False, default=0)
    audio_url = Column(String(255), nullable=True)
    transcript = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    folder = Column(String(20), nullable=False, default="inbox")  # inbox | archived | deleted
