"""Local Caller Reputation Database Provider."""

import re
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.spam.reputation.base import BaseReputationProvider
from app.models.caller_reputation import CallerReputation
from app.models.spam_allowlist_blocklist import SpamAllowlistBlocklist

logger = logging.getLogger("ai_call_agent.spam.reputation.local")


class LocalReputationProvider(BaseReputationProvider):
    """Local Caller Reputation Engine analyzing E.164 numbers against allowlist/blocklist and past reports."""

    @staticmethod
    def normalize_e164(phone_number: str) -> str:
        """Normalize phone number to E.164 format (+919876543210)."""
        if not phone_number:
            return ""
        digits = re.sub(r"\D", "", phone_number)
        if not digits:
            return phone_number
        cleaned = re.sub(r"[^\d+]", "", phone_number)
        if not cleaned.startswith("+"):
            if len(cleaned) == 10:
                cleaned = "+91" + cleaned
            elif len(cleaned) == 12 and cleaned.startswith("91"):
                cleaned = "+" + cleaned
            else:
                cleaned = "+" + cleaned
        return cleaned

    def evaluate_reputation(self, caller_number: str, db_session: Optional[Session] = None) -> Dict[str, Any]:
        normalized = self.normalize_e164(caller_number)
        if not normalized or normalized in ["+", "+0000000000"]:
            return {
                "score": 25,
                "allowlisted": False,
                "blocklisted": False,
                "triggers": ["anonymous_or_missing_cli"],
                "reason": "Missing or anonymous Caller ID. Subjected to neutral screening.",
            }

        if not db_session:
            # Fallback for standalone/mock testing
            if normalized.startswith("+91140") or normalized.startswith("+1555999"):
                return {
                    "score": 85,
                    "allowlisted": False,
                    "blocklisted": True,
                    "triggers": ["known_telemarketer_prefix"],
                    "reason": "CLI prefix matches high-risk commercial telemarketer series.",
                }
            return {
                "score": 0,
                "allowlisted": False,
                "blocklisted": False,
                "triggers": [],
                "reason": "Standard neutral reputation score.",
            }

        # Check DB Allowlist / Blocklist
        list_entry = db_session.query(SpamAllowlistBlocklist).filter(SpamAllowlistBlocklist.phone_number == normalized).first()
        if list_entry:
            if list_entry.list_type == "allowlist":
                return {
                    "score": 0,
                    "allowlisted": True,
                    "blocklisted": False,
                    "triggers": ["user_authorized_allowlist"],
                    "reason": f"Explicitly authorized allowlist entry: {list_entry.reason or 'User approved'}",
                }
            elif list_entry.list_type == "blocklist":
                return {
                    "score": 100,
                    "allowlisted": False,
                    "blocklisted": True,
                    "triggers": ["user_authorized_blocklist"],
                    "reason": f"Explicitly blocked entry: {list_entry.reason or 'User blocked'}",
                }

        # Check CallerReputation history
        rep = db_session.query(CallerReputation).filter(CallerReputation.phone_number == normalized).first()
        if rep:
            triggers = []
            score = 0
            if rep.confirmed_spam_count > 0:
                score += min(rep.confirmed_spam_count * 30, 90)
                triggers.append(f"historical_confirmed_spam_reports_{rep.confirmed_spam_count}")
            if rep.dismissed_spam_count > 0:
                score = max(0, score - (rep.dismissed_spam_count * 15))
                triggers.append("historical_false_positive_dismissals")

            return {
                "score": score,
                "allowlisted": rep.allowlist_status,
                "blocklisted": rep.blocklist_status,
                "triggers": triggers,
                "reason": f"Historical reputation evaluation ({rep.confirmed_spam_count} spam reports)",
            }

        # Prefix rule check for telemarketers
        if normalized.startswith("+91140"):
            return {
                "score": 75,
                "allowlisted": False,
                "blocklisted": False,
                "triggers": ["trai_telemarketer_prefix_140"],
                "reason": "TRAI +91-140 series telemarketer number series.",
            }

        return {
            "score": 0,
            "allowlisted": False,
            "blocklisted": False,
            "triggers": [],
            "reason": "Standard neutral reputation score.",
        }


local_reputation_provider = LocalReputationProvider()
