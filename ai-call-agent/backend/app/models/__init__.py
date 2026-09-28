"""SQLAlchemy Declarative Models Package."""

from app.core.database import Base
from app.models.base import GUID, UUIDPrimaryKeyMixin, TimestampMixin
from app.models.user import User
from app.models.phone_number import PhoneNumber
from app.models.call import Call
from app.models.call_event import CallEvent
from app.models.conversation import Conversation
from app.models.spam_assessment import SpamAssessment
from app.models.transfer import TransferRecord
from app.models.spam_report import SpamReport
from app.models.audit_log import AuditLog
from app.models.user_settings import UserSettings
from app.models.refresh_token import RefreshToken
from app.models.voice_profile import VoiceProfile
from app.models.transcript_segment import TranscriptSegment
from app.models.caller_reputation import CallerReputation
from app.models.spam_policy_rule import SpamPolicyRule
from app.models.spam_allowlist_blocklist import SpamAllowlistBlocklist
from app.models.recipient import RecipientGroup, Recipient
from app.models.recipient_availability import RecipientAvailability
from app.models.routing_policy import RoutingRule, RoutingDecision
from app.models.voicemail import VoicemailMessage
from app.models.callback_request import CallbackRequest
from app.models.generated_report import GeneratedReport
from app.models.report_schedule import ReportSchedule

__all__ = [
    "Base",
    "GUID",
    "UUIDPrimaryKeyMixin",
    "TimestampMixin",
    "User",
    "PhoneNumber",
    "Call",
    "CallEvent",
    "Conversation",
    "SpamAssessment",
    "TransferRecord",
    "SpamReport",
    "AuditLog",
    "UserSettings",
    "RefreshToken",
    "VoiceProfile",
    "TranscriptSegment",
    "CallerReputation",
    "SpamPolicyRule",
    "SpamAllowlistBlocklist",
    "RecipientGroup",
    "Recipient",
    "RecipientAvailability",
    "RoutingRule",
    "RoutingDecision",
    "VoicemailMessage",
    "CallbackRequest",
    "GeneratedReport",
    "ReportSchedule",
]
