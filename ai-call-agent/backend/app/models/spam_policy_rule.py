"""Spam Policy Rule Model for Configurable Screening Rules."""

from sqlalchemy import Column, String, Integer, Boolean, Text
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class SpamPolicyRule(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "spam_policy_rules"

    rule_name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50), nullable=False, default="semantic")  # semantic | reputation | behavior
    pattern = Column(Text, nullable=False)  # Regex or keyword trigger
    weight = Column(Integer, nullable=False, default=20)  # Risk score weight contribution (0-100)
    is_active = Column(Boolean, nullable=False, default=True)
    description = Column(Text, nullable=True)
