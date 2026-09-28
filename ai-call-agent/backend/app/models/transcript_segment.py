"""Transcript Segment Entity Model for Granular Per-Utterance Logging."""

from sqlalchemy import Column, String, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class TranscriptSegment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "transcript_segments"

    call_id = Column(GUID, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False, index=True)
    speaker = Column(String(20), nullable=False)  # caller | assistant | system
    text = Column(Text, nullable=False)
    language = Column(String(20), nullable=False, default="en-IN")  # en-IN | hi-IN | mixed
    confidence = Column(Float, nullable=False, default=1.0)
    audio_timestamp_start = Column(Float, nullable=True)
    audio_timestamp_end = Column(Float, nullable=True)

    # Relationships
    call = relationship("Call")
