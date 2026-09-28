"""Recipient and Recipient Group Database Models."""

from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class RecipientGroup(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Department or Functional Group (Owner, Sales, Support, Admin, General Enquiries)."""

    __tablename__ = "recipient_groups"

    name = Column(String(50), nullable=False, unique=True, index=True)  # Sales, Support, Executive, etc.
    description = Column(String(255), nullable=True)
    routing_strategy = Column(String(30), nullable=False, default="priority")  # priority | round_robin | ring_all
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    recipients = relationship("Recipient", back_populates="group", cascade="all, delete-orphan")


class Recipient(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Directory Recipient Profile with E.164 Destination and Availability Config."""

    __tablename__ = "recipients"

    user_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    group_id = Column(GUID, ForeignKey("recipient_groups.id", ondelete="SET NULL"), nullable=True, index=True)

    display_name = Column(String(100), nullable=False)
    department = Column(String(50), nullable=False, default="General")  # Sales | Support | Admin | Executive
    role_title = Column(String(100), nullable=True)

    phone_number = Column(String(32), nullable=False, index=True)  # E.164 destination
    sip_uri = Column(String(255), nullable=True)

    # Availability & Business Hours Config
    availability_status = Column(String(20), nullable=False, default="available")  # available | busy | away | dnd | offline
    business_hours_start = Column(String(5), nullable=False, default="09:00")  # HH:MM
    business_hours_end = Column(String(5), nullable=False, default="18:00")  # HH:MM
    time_zone = Column(String(50), nullable=False, default="Asia/Kolkata")
    work_days = Column(JSON, nullable=False, default=list)  # ["mon", "tue", "wed", "thu", "fri"]

    # Routing Priorities & Fallbacks
    routing_priority = Column(Integer, nullable=False, default=1)  # 1 = Highest
    backup_recipient_id = Column(GUID, ForeignKey("recipients.id", ondelete="SET NULL"), nullable=True)

    # Preferences
    allow_warm_transfer = Column(Boolean, default=True, nullable=False)
    enable_voicemail = Column(Boolean, default=True, nullable=False)
    enable_callback_requests = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    group = relationship("RecipientGroup", back_populates="recipients")
    backup_recipient = relationship("Recipient", remote_side="Recipient.id")
    transfers = relationship("TransferRecord", back_populates="recipient")
