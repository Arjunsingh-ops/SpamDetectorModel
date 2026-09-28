"""Smart Routing Engine Master Orchestrator."""

import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.routing_policy import RoutingDecision
from app.routing.recipient_resolver import recipient_resolver
from app.routing.policies import deterministic_routing_policy

logger = logging.getLogger("ai_call_agent.routing.engine")


class SmartRoutingEngine:
    """Master Call Routing Engine integrating intent extraction, spam scores, and recipient directory policy."""

    @classmethod
    def process_call_routing(
        cls,
        db: Session,
        call_id: str,
        transcript: str,
        spam_score: int = 0,
        risk_category: str = "LOW",
        allowlisted: bool = False,
        blocklisted: bool = False,
    ) -> Dict[str, Any]:
        logger.info(f"Processing smart routing for call {call_id} (Spam Score: {spam_score}, Risk Category: {risk_category})")

        # 1. Extract Caller Intent
        intent = recipient_resolver.extract_intent_from_text(transcript)

        # 2. Evaluate Policy
        routing_res = deterministic_routing_policy.evaluate_routing(
            db=db,
            intent=intent,
            spam_score=spam_score,
            risk_category=risk_category,
            allowlisted=allowlisted,
            blocklisted=blocklisted,
        )

        recipient = routing_res.get("recipient")

        # 3. Log Audit Routing Decision
        decision_log = RoutingDecision(
            call_id=call_id,
            caller_intent=intent.purpose[:100],
            requested_department=intent.requested_department,
            requested_recipient_name=intent.requested_recipient,
            matched_recipient_id=recipient.id if recipient else None,
            spam_score_used=spam_score,
            risk_category_used=risk_category,
            decision_action=routing_res["action"],
            rule_applied="deterministic_policy_v1",
            rationale=routing_res["reason"],
        )
        db.add(decision_log)
        db.commit()

        return {
            "action": routing_res["action"],
            "recipient_id": str(recipient.id) if recipient else None,
            "recipient_name": recipient.display_name if recipient else None,
            "destination_phone": recipient.phone_number if recipient else None,
            "department": recipient.department if recipient else intent.requested_department,
            "allow_transfer": routing_res["allow_transfer"],
            "reason": routing_res["reason"],
            "caller_intent": intent.model_dump(),
        }


smart_routing_engine = SmartRoutingEngine()
