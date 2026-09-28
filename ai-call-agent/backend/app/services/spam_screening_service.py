"""Real-Time Asynchronous Spam Screening Service."""

import asyncio
import logging
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.spam.engine import hybrid_spam_engine
from app.models.spam_assessment import SpamAssessment
from app.models.call import Call
from app.services.broadcaster import broadcaster

logger = logging.getLogger("ai_call_agent.services.spam_screening_service")


class SpamScreeningService:
    """Orchestrates non-blocking real-time call screening during active voice conversations."""

    @staticmethod
    async def process_transcript_segment(
        db: Session,
        call_id: UUID,
        caller_number: str,
        transcript_segment: str,
        full_transcript: str = "",
    ) -> Optional[SpamAssessment]:
        """
        Asynchronously evaluate transcript segment against hybrid spam engine.
        Updates SpamAssessment in PostgreSQL and broadcasts SSE alert to dashboard.
        """
        try:
            # Non-blocking evaluation in background thread/task
            assessment_dict = await asyncio.to_thread(
                hybrid_spam_engine.evaluate_call,
                caller_number=caller_number,
                transcript=full_transcript or transcript_segment,
                db_session=db,
                use_llm=False,  # High speed evaluation
            )

            # Persist or update SpamAssessment record
            assessment = db.query(SpamAssessment).filter(SpamAssessment.call_id == call_id).first()
            if not assessment:
                assessment = SpamAssessment(
                    call_id=call_id,
                    composite_score=assessment_dict["composite_score"],
                    reputation_score=assessment_dict["reputation_score"],
                    semantic_score=assessment_dict["semantic_score"],
                    behavioral_score=assessment_dict["behavioral_score"],
                    classification=assessment_dict["classification"],
                    confidence=assessment_dict["confidence"],
                    detected_triggers=assessment_dict["detected_triggers"],
                    ai_rationale=assessment_dict["explanation"],
                    model_version=assessment_dict["model_version"],
                )
                db.add(assessment)
            else:
                assessment.composite_score = assessment_dict["composite_score"]
                assessment.reputation_score = assessment_dict["reputation_score"]
                assessment.semantic_score = assessment_dict["semantic_score"]
                assessment.behavioral_score = assessment_dict["behavioral_score"]
                assessment.classification = assessment_dict["classification"]
                assessment.detected_triggers = assessment_dict["detected_triggers"]
                assessment.ai_rationale = assessment_dict["explanation"]

            # Update Call record disposition & status if risk category is HIGH or UNCERTAIN
            call = db.query(Call).filter(Call.id == call_id).first()
            if call:
                call.spam_score = assessment_dict["composite_score"]
                if assessment_dict["risk_category"] == "HIGH":
                    call.disposition = "spam"
                    call.status = "FLAGGED"
                elif assessment_dict["risk_category"] == "UNCERTAIN":
                    call.disposition = "uncertain"
                    call.status = "NEEDS_REVIEW"

            db.commit()
            db.refresh(assessment)

            # Broadcast SSE Live Alert to Dashboard
            asyncio.create_task(
                broadcaster.broadcast(
                    "SPAM_ASSESSMENT_UPDATE",
                    {
                        "call_id": str(call_id),
                        "composite_score": assessment.composite_score,
                        "classification": assessment.classification,
                        "risk_category": assessment_dict["risk_category"],
                        "triggers": assessment.detected_triggers,
                        "explanation": assessment.ai_rationale,
                    },
                )
            )

            return assessment
        except Exception as err:
            logger.error(f"Error in real-time spam screening for call {call_id}: {err}")
            return None


spam_screening_service = SpamScreeningService()
