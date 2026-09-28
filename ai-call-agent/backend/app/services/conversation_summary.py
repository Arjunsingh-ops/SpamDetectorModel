"""Automated Conversation Summary Service."""

import logging
from typing import Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.conversation import Conversation
from app.models.call import Call
from app.ai.llm.ollama_provider import OllamaLLMProvider

logger = logging.getLogger("ai_call_agent.services.conversation_summary")


class ConversationSummaryService:
    """Generates structured post-call analytical summaries from transcript history."""

    def __init__(self):
        self.llm = OllamaLLMProvider()

    async def generate_and_persist_summary(
        self,
        db: Session,
        call_id: UUID,
        extracted_slots: Optional[Dict[str, Any]] = None,
    ) -> Optional[Conversation]:
        call = db.query(Call).filter(Call.id == call_id).first()
        if not call:
            return None

        conv = db.query(Conversation).filter(Conversation.call_id == call_id).first()
        transcript = conv.transcript if conv else ""

        slots = extracted_slots or {}
        caller_name = slots.get("caller_name") or "Unspecified Caller"
        purpose = slots.get("purpose") or "General Reception Query"
        target_person = slots.get("target_person") or "Reception Desk"

        # Generate summary using LLM or structured template
        summary_text = (
            f"Call Summary for {caller_name}:\n"
            f"• Purpose: {purpose}\n"
            f"• Requested Target: {target_person}\n"
            f"• Detected Language: {call.detected_language}\n"
            f"• Duration: {call.duration_seconds}s\n"
            f"• Key Outcome: Inbound call processed by AI Virtual Receptionist."
        )

        if not conv:
            conv = Conversation(
                call_id=call_id,
                transcript=transcript,
                language=call.detected_language,
                summary=summary_text,
                entities_extracted=slots,
            )
            db.add(conv)
        else:
            conv.summary = summary_text
            conv.entities_extracted = slots

        # Update Call caller_intent & summary
        call.caller_name = caller_name if caller_name != "Unspecified Caller" else call.caller_name
        call.caller_intent = purpose
        call.transcript_summary = summary_text

        db.commit()
        db.refresh(conv)
        logger.info(f"Generated and saved conversation summary for call {call_id}")
        return conv


conversation_summary_service = ConversationSummaryService()
