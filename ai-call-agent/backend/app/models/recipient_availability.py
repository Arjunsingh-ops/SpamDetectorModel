"""Recipient Availability Audit & Status History Model."""

from sqlalchemy import Column, String, ForeignKey, DateTime
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class RecipientAvailability(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Tracks status updates and manual overrides for recipient availability."""

    __tablename__ = "recipient_availability"

    recipient_id = Column(GUID, ForeignKey("recipients.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), nullable=False)  # available | busy | away | dnd | offline | unknown
    reason = Column(String(255), nullable=True)  # Manual override note | In call | Lunch break
    updated_by_user_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    valid_until = Column(DateTime, nullable=True)
