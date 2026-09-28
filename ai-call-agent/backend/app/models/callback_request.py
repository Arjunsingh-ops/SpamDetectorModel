"""Callback Request Management Model."""

from sqlalchemy import Column, String, ForeignKey, Text
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class CallbackRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Caller Request for a Return Telephone Call."""

    __tablename__ = "callback_requests"

    call_id = Column(GUID, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(GUID, ForeignKey("recipients.id", ondelete="SET NULL"), nullable=True, index=True)

    caller_number = Column(String(32), nullable=False)
    caller_name = Column(String(100), nullable=True)
    requested_department = Column(String(50), nullable=True)
    purpose = Column(Text, nullable=True)

    preferred_time = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # pending | assigned | in_progress | completed | cancelled
    assigned_user_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
