"""Deterministic Routing Policies & Security Destination Validation."""

import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.routing.schemas import CallerIntent
from app.routing.recipient_resolver import recipient_resolver
from app.routing.availability import recipient_availability_service

logger = logging.getLogger("ai_call_agent.routing.policies")


class DeterministicRoutingPolicy:
    """
    Evaluates multi-signal routing policy:
    1. Validates recipient directory destination.
    2. Evaluates Stage 5 Spam Risk Score.
    3. Evaluates Recipient Availability & Business Hours.
    4. Determines Action: `transfer_warm`, `screen_further`, `flag_review`, `route_voicemail`, `route_callback`, `polite_end`.
    """

    @classmethod
    def evaluate_routing(
        cls,
        db: Session,
        intent: CallerIntent,
        spam_score: int = 0,
        risk_category: str = "LOW",
        allowlisted: bool = False,
        blocklisted: bool = False,
    ) -> Dict[str, Any]:
        # Rule 1: High Spam Risk Policy (Score >= 70 or blocklisted)
        if blocklisted or risk_category == "HIGH" or spam_score >= 70:
            logger.warning(f"Routing blocked due to HIGH spam score ({spam_score}). Routing to operator review queue.")
            return {
                "action": "flag_review",
                "recipient": None,
                "backup_recipient": None,
                "reason": f"Call flagged as HIGH risk (Spam Score: {spam_score}). Routing to human operator oversight queue.",
                "allow_transfer": False,
            }

        # Rule 2: Uncertain Risk Policy (Score 40-69)
        if risk_category == "UNCERTAIN" or (40 <= spam_score < 70):
            logger.info(f"Call evaluated as UNCERTAIN risk (Score {spam_score}). Requesting neutral screening question.")
            return {
                "action": "screen_further",
                "recipient": None,
                "backup_recipient": None,
                "reason": "Uncertain call purpose. Play neutral screening challenge before transfer.",
                "allow_transfer": False,
            }

        # Rule 3: Resolve Primary Recipient
        primary_recipient = recipient_resolver.resolve_recipient(db, intent)
        if not primary_recipient:
            logger.warning("No active recipient matched in directory.")
            return {
                "action": "route_voicemail",
                "recipient": None,
                "backup_recipient": None,
                "reason": "No approved recipient available in system directory.",
                "allow_transfer": False,
            }

        # Rule 4: Check Primary Availability
        is_available, status_msg = recipient_availability_service.evaluate_availability(primary_recipient)

        if is_available:
            return {
                "action": "transfer_warm",
                "recipient": primary_recipient,
                "backup_recipient": primary_recipient.backup_recipient,
                "reason": f"Recipient {primary_recipient.display_name} is available for transfer.",
                "allow_transfer": True,
            }

        # Rule 5: Primary Unavailable -> Check Backup Recipient
        if primary_recipient.backup_recipient:
            backup_available, backup_msg = recipient_availability_service.evaluate_availability(primary_recipient.backup_recipient)
            if backup_available:
                logger.info(f"Primary {primary_recipient.display_name} unavailable ({status_msg}). Routing to backup {primary_recipient.backup_recipient.display_name}.")
                return {
                    "action": "transfer_warm",
                    "recipient": primary_recipient.backup_recipient,
                    "backup_recipient": None,
                    "reason": f"Primary recipient unavailable. Routing to backup {primary_recipient.backup_recipient.display_name}.",
                    "allow_transfer": True,
                }

        # Rule 6: Both Primary & Backup Unavailable -> Voicemail or Callback
        if primary_recipient.enable_voicemail:
            return {
                "action": "route_voicemail",
                "recipient": primary_recipient,
                "backup_recipient": None,
                "reason": f"Recipient unavailable ({status_msg}). Offering voicemail collection.",
                "allow_transfer": False,
            }
        elif primary_recipient.enable_callback_requests:
            return {
                "action": "route_callback",
                "recipient": primary_recipient,
                "backup_recipient": None,
                "reason": f"Recipient unavailable ({status_msg}). Offering callback request.",
                "allow_transfer": False,
            }

        return {
            "action": "polite_end",
            "recipient": primary_recipient,
            "backup_recipient": None,
            "reason": "Recipient unavailable and no voicemail/callback configured.",
            "allow_transfer": False,
        }


deterministic_routing_policy = DeterministicRoutingPolicy()
