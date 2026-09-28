"""Spam Allowlist and Blocklist Entry Model."""

from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class SpamAllowlistBlocklist(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "spam_allowlist_blocklist"

    phone_number = Column(String(32), unique=True, index=True, nullable=False)  # E.164
    list_type = Column(String(20), nullable=False)  # allowlist | blocklist
    reason = Column(Text, nullable=True)
    added_by_user_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    added_by_user = relationship("User")
