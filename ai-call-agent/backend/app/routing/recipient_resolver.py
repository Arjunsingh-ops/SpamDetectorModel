"""Intent Extraction and Recipient Resolution Module."""

import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.recipient import Recipient
from app.routing.schemas import CallerIntent

logger = logging.getLogger("ai_call_agent.routing.recipient_resolver")


class RecipientResolver:
    """Matches caller intent against verified recipient directory and department groups."""

    @staticmethod
    def extract_intent_from_text(transcript: str) -> CallerIntent:
        """Heuristic and pattern-based intent extraction from transcript text."""
        txt_lower = transcript.lower()

        # Department resolution
        dept = "General"
        if any(w in txt_lower for w in ["sales", "buy", "pricing", "quote", "purchase", "product"]):
            dept = "Sales"
        elif any(w in txt_lower for w in ["support", "issue", "help", "broken", "ticket", "bug"]):
            dept = "Support"
        elif any(w in txt_lower for w in ["billing", "invoice", "payment", "accounts", "admin"]):
            dept = "Admin"
        elif any(w in txt_lower for w in ["boss", "owner", "manager", "ceo", "director", "executive"]):
            dept = "Executive"

        # Explicit human request
        human_req = any(w in txt_lower for w in ["human", "person", "operator", "agent", "transfer me", "speak to someone"])

        # Urgency
        urgency = "normal"
        if any(w in txt_lower for w in ["urgent", "emergency", "immediately", "asap", "critical"]):
            urgency = "urgent"

        return CallerIntent(
            caller_name=None,
            purpose=transcript.strip(),
            requested_recipient=None,
            requested_department=dept,
            urgency_stated=urgency,
            preferred_language="hi-IN" if any(w in txt_lower for w in ["namaste", "aap", "kaise", "hai", "karo"]) else "en-IN",
            human_requested=human_req,
            callback_acceptable=True,
        )

    @staticmethod
    def resolve_recipient(
        db: Session,
        intent: CallerIntent,
    ) -> Optional[Recipient]:
        """Find best matching active recipient for given caller intent."""
        # 1. Try explicit recipient name match
        if intent.requested_recipient:
            recipient = (
                db.query(Recipient)
                .filter(
                    Recipient.is_active.is_(True),
                    Recipient.display_name.ilike(f"%{intent.requested_recipient}%"),
                )
                .first()
            )
            if recipient:
                logger.info(f"Resolved explicit recipient match: {recipient.display_name} ({recipient.id})")
                return recipient

        # 2. Match by department and routing priority
        if intent.requested_department:
            recipient = (
                db.query(Recipient)
                .filter(
                    Recipient.is_active.is_(True),
                    Recipient.department.ilike(f"%{intent.requested_department}%"),
                )
                .order_by(Recipient.routing_priority.asc())
                .first()
            )
            if recipient:
                logger.info(f"Resolved department recipient match for {intent.requested_department}: {recipient.display_name}")
                return recipient

        # 3. Default fallback to primary active receptionist / general recipient
        default_recipient = (
            db.query(Recipient)
            .filter(Recipient.is_active.is_(True))
            .order_by(Recipient.routing_priority.asc())
            .first()
        )
        return default_recipient


recipient_resolver = RecipientResolver()
