"""Voice Profile Entity Model for Custom Voice Cloning and Provider Configurations."""

from sqlalchemy import Column, String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class VoiceProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "voice_profiles"

    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    provider = Column(String(50), nullable=False, default="local_tts")  # local_tts | elevenlabs | openai | custom_xtts
    voice_id = Column(String(255), nullable=False)  # Provider voice ID or local sample reference
    sample_s3_key = Column(String(512), nullable=True)  # Private storage key for authorized voice sample
    language = Column(String(20), nullable=False, default="en-IN")  # en-IN | hi-IN | multilingual
    
    # Authorized Voice Owner Consent Tracking (Regulatory Compliance)
    consent_granted = Column(Boolean, nullable=False, default=False)
    consent_metadata = Column(JSON, nullable=True)  # Timestamp, IP address, consent agreement text
    is_active = Column(Boolean, nullable=False, default=True)

    # Relationships
    user = relationship("User", back_populates="voice_profiles")
