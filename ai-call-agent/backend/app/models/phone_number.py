"""PhoneNumber Inventory and Routing Mapping Model."""

from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class PhoneNumber(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "phone_numbers"

    owner_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    phone_number = Column(String(32), unique=True, index=True, nullable=False)  # E.164 e.g. +911140001234
    label = Column(String(100), nullable=False, default="Primary Reception")
    forward_to_number = Column(String(32), nullable=False)  # Target destination E.164
    provider = Column(String(50), nullable=False, default="mock")  # mock | twilio | exotel | sip
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    owner = relationship("User", back_populates="phone_numbers")
    calls = relationship("Call", back_populates="phone_number")
