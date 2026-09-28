"""User Configuration and Preference Model."""

from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class UserSettings(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "user_settings"

    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    forwarding_rules = Column(JSON, nullable=True)  # e.g. {"default_number": "+91...", "fallback_action": "voicemail"}
    working_hours = Column(JSON, nullable=True)     # e.g. {"mon_fri": {"start": "09:00", "end": "18:00"}}
    preferred_language = Column(String(20), nullable=False, default="en-IN")
    notification_settings = Column(JSON, nullable=True)  # e.g. {"email_on_spam": true, "sms_on_forward": false}

    # Relationships
    user = relationship("User", back_populates="settings")
