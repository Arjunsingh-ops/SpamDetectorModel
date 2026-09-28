"""Caller Reputation Database Model."""

from sqlalchemy import Column, String, Integer, DateTime, Boolean
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class CallerReputation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "caller_reputations"

    phone_number = Column(String(32), unique=True, index=True, nullable=False)  # E.164
    total_calls_count = Column(Integer, nullable=False, default=1)
    confirmed_spam_count = Column(Integer, nullable=False, default=0)
    dismissed_spam_count = Column(Integer, nullable=False, default=0)
    allowlist_status = Column(Boolean, nullable=False, default=False)
    blocklist_status = Column(Boolean, nullable=False, default=False)
    last_contact_at = Column(DateTime(timezone=True), nullable=True)
