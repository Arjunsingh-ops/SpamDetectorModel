"""Security and Operational Audit Log Model."""

from sqlalchemy import Column, String, ForeignKey, JSON
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class AuditLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "audit_logs"

    actor_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # e.g., CALL_FORWARDED, SPAM_REVIEW_CONFIRMED
    resource_type = Column(String(50), nullable=False, index=True)  # calls | users | settings | spam
    resource_id = Column(String(64), nullable=True, index=True)
    payload = Column(JSON, nullable=True)  # State change diff or context metadata
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
