"""Routing Rules and Decision Log Models."""

from sqlalchemy import Column, String, Boolean, Integer, ForeignKey
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class RoutingRule(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Dynamic Configurable Call Routing Rule."""

    __tablename__ = "routing_rules"

    rule_name = Column(String(100), nullable=False, unique=True)
    department = Column(String(50), nullable=True)  # Match department intent
    match_intent_pattern = Column(String(255), nullable=True)  # Regex or keyword intent
    max_spam_score_allowed = Column(Integer, nullable=False, default=69)  # Max risk score permitted for direct transfer
    target_group_id = Column(GUID, ForeignKey("recipient_groups.id", ondelete="SET NULL"), nullable=True)
    target_recipient_id = Column(GUID, ForeignKey("recipients.id", ondelete="SET NULL"), nullable=True)
    fallback_strategy = Column(String(50), nullable=False, default="backup_recipient")  # backup_recipient | voicemail | callback | disconnect
    is_active = Column(Boolean, default=True, nullable=False)


class RoutingDecision(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Immutable Audit Record of Every Smart Routing Engine Decision."""

    __tablename__ = "routing_decisions"

    call_id = Column(GUID, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False, index=True)
    caller_intent = Column(String(100), nullable=True)
    requested_department = Column(String(50), nullable=True)
    requested_recipient_name = Column(String(100), nullable=True)
    matched_recipient_id = Column(GUID, ForeignKey("recipients.id", ondelete="SET NULL"), nullable=True)
    spam_score_used = Column(Integer, nullable=False, default=0)
    risk_category_used = Column(String(20), nullable=False, default="LOW")
    decision_action = Column(String(50), nullable=False)  # transfer_warm | screen_further | flag_review | route_voicemail | route_callback
    rule_applied = Column(String(100), nullable=True)
    rationale = Column(String(255), nullable=True)
