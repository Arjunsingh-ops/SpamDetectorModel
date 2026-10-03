"""
Personal AI Call Screening and Safe Forwarding Orchestrator.

Implements the end-to-end core product experience:
Incoming Call -> AI Answers -> AI Screens -> STT -> Intent Extraction
-> Multi-Factor Risk Assessment -> Safe / Uncertain / High Risk
-> Safe Call Forwarded -> User Phone Rings -> User Answers -> Call Bridged -> AI Exits.
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.call import Call
from app.models.call_event import CallEvent
from app.models.conversation import Conversation
from app.models.transcript_segment import TranscriptSegment
from app.models.spam_assessment import SpamAssessment
from app.models.recipient import Recipient
from app.models.user import User
from app.services.call_state_machine import CallState, validate_state_transition
from app.services.broadcaster import broadcaster
from app.telephony import get_telephony_adapter
from app.ai.conversation.screening_dialogue import screening_dialogue_engine
from app.spam.engine import hybrid_spam_engine
from app.transfers.coordinator import transfer_coordinator
from app.schemas.screening import (
    ExtractedScreeningInfo,
    UnifiedRiskAssessment,
    PersonalAssistantSettings,
)

logger = logging.getLogger("ai_call_agent.services.screening_orchestrator")


class CallScreeningOrchestrator:
    """Master orchestrator for the personal AI call-screening and forwarding lifecycle."""

    def __init__(self):
        self.settings = PersonalAssistantSettings()
        self.screening_dialogue = screening_dialogue_engine
        self.spam_engine = hybrid_spam_engine

    async def handle_inbound_call(
        self,
        db: Session,
        provider_data: Dict[str, Any],
        is_simulation: bool = False,
    ) -> Dict[str, Any]:
        """
        Step 1 & 2: Provider notifies inbound call.
        AI answers the call and emits initial greeting.
        """
        provider_name = provider_data.get("telephony_provider", "mock")
        adapter = get_telephony_adapter(provider_name)
        call_sid = provider_data.get("external_call_sid") or f"call-{int(datetime.now().timestamp())}"
        caller_num = provider_data.get("caller_number", "+919876543210")
        dest_num = provider_data.get("destination_number", "+911122334455")
        caller_name = provider_data.get("caller_name")

        # 1. Idempotently find or create Call entity
        call = db.query(Call).filter(Call.external_call_sid == call_sid).first()
        if not call:
            call = Call(
                external_call_sid=call_sid,
                provider_call_id=call_sid,
                caller_number=caller_num,
                recipient_number=dest_num,
                destination_number=dest_num,
                direction="inbound",
                telephony_provider=provider_name,
                status=CallState.ANSWERED_BY_AI,
                disposition="uncertain",
                caller_name=caller_name,
                started_at=datetime.now(timezone.utc),
            )
            db.add(call)
            db.flush()

            # Record event
            event = CallEvent(
                call_id=call.id,
                event_type="call.created",
                actor="telephony",
                payload={"caller_number": caller_num, "status_after": CallState.ANSWERED_BY_AI, "is_simulation": is_simulation},
            )
            db.add(event)

            # Initialize Conversation session
            conv = Conversation(
                call_id=call.id,
                language="en-IN",
                transcript="",
            )
            db.add(conv)
            db.commit()
            db.refresh(call)

        # 2. Generate initial personalized greeting
        greeting = self.screening_dialogue.generate_initial_greeting(language="en-IN")

        # Record assistant greeting segment
        conv = db.query(Conversation).filter(Conversation.call_id == call.id).first()
        if conv:
            seg = TranscriptSegment(
                call_id=call.id,
                speaker="assistant",
                text=greeting,
                language="en-IN",
                confidence=1.0,
            )
            db.add(seg)
            db.commit()

        # 3. Broadcast real-time SSE event to dashboard
        await broadcaster.broadcast(
            "call.created",
            {
                "call_id": str(call.id),
                "external_call_sid": call.external_call_sid,
                "caller_number": call.caller_number,
                "caller_name": call.caller_name or "Unknown Caller",
                "status": call.status,
                "initial_greeting": greeting,
                "is_simulation": is_simulation,
            },
        )

        return {
            "call_id": str(call.id),
            "external_call_sid": call.external_call_sid,
            "status": call.status,
            "greeting": greeting,
            "provider_response": adapter.generate_answer_response(
                call_id=str(call.id),
                stream_url=f"/api/v1/telephony/stream?call_id={call.id}",
                initial_greeting=greeting,
            ),
        }

    async def process_caller_utterance(
        self,
        db: Session,
        call_id: str,
        caller_speech: str,
        question_count: int = 1,
        is_simulation: bool = False,
    ) -> Dict[str, Any]:
        """
        Steps 3 - 10:
        Process caller speech utterance -> Extract intent -> Evaluate multi-signal risk
        -> Decide: SAFE_TO_FORWARD | CONTINUE_SCREENING | DO_NOT_FORWARD.
        """
        call = db.query(Call).filter((Call.id == call_id) | (Call.external_call_sid == call_id)).first()
        if not call:
            raise ValueError(f"Call with identifier {call_id} not found.")

        # 1. Update state to SCREENING / TRANSCRIBING
        validate_state_transition(call.status, CallState.SCREENING)
        call.status = CallState.SCREENING
        db.commit()

        # Record transcript segment
        conv = db.query(Conversation).filter(Conversation.call_id == call.id).first()
        if conv:
            seg = TranscriptSegment(
                call_id=call.id,
                speaker="caller",
                text=caller_speech,
                language="en-IN",
                confidence=0.98,
            )
            db.add(seg)
            db.commit()

        # Emit transcript SSE
        await broadcaster.broadcast(
            "transcript.segment",
            {
                "call_id": str(call.id),
                "speaker": "caller",
                "text": caller_speech,
                "is_final": True,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

        # 2. Extract structured screening slots
        screening_info = self.screening_dialogue.extract_screening_info(caller_speech)
        if screening_info.caller_name and not call.caller_name:
            call.caller_name = screening_info.caller_name
        if screening_info.purpose:
            call.caller_intent = screening_info.purpose
        db.commit()

        # 3. Evaluate unified multi-signal risk assessment
        risk_assessment = self.spam_engine.evaluate_unified_screening_risk(
            caller_number=call.caller_number,
            transcript=caller_speech,
            screening_info=screening_info,
            screening_question_count=question_count,
            allowlisted=False,
            blocklisted=False,
            db_session=db,
        )

        # 4. Persist or update SpamAssessment record
        spam_rec = db.query(SpamAssessment).filter(SpamAssessment.call_id == call.id).first()
        score_100 = int(risk_assessment.risk_score * 100)
        if not spam_rec:
            spam_rec = SpamAssessment(
                call_id=call.id,
                composite_score=score_100,
                reputation_score=score_100 if risk_assessment.category in ["FINANCIAL_SCAM", "PHISHING_OTP"] else 10,
                semantic_score=score_100,
                behavioral_score=10,
                classification=risk_assessment.category.lower(),
                confidence=0.95,
                detected_triggers=",".join(risk_assessment.flagged_phrases),
                ai_rationale=risk_assessment.reasoning,
                model_version=risk_assessment.classifier_version,
            )
            db.add(spam_rec)
        else:
            spam_rec.composite_score = score_100
            spam_rec.semantic_score = score_100
            spam_rec.classification = risk_assessment.category.lower()
            spam_rec.detected_triggers = ",".join(risk_assessment.flagged_phrases)
            spam_rec.ai_rationale = risk_assessment.reasoning

        call.spam_score = score_100
        db.commit()

        # Emit spam assessment SSE
        await broadcaster.broadcast(
            "spam.assessment.updated",
            {
                "call_id": str(call.id),
                "risk_level": risk_assessment.risk_level,
                "risk_score": risk_assessment.risk_score,
                "category": risk_assessment.category,
                "reasoning": risk_assessment.reasoning,
                "recommended_action": risk_assessment.recommended_action,
                "triggers": risk_assessment.flagged_phrases,
            },
        )

        # 5. Routing Decision Policy
        rec_action = risk_assessment.recommended_action
        response_payload = {
            "call_id": str(call.id),
            "screening_info": screening_info.model_dump(),
            "risk_assessment": risk_assessment.model_dump(),
            "decision": rec_action,
            "next_ai_utterance": "",
            "user_prompt_required": False,
        }

        if rec_action == "SAFE_TO_FORWARD":
            # SAFE CALL FORWARDING
            validate_state_transition(call.status, CallState.SAFE_TO_FORWARD)
            call.status = CallState.USER_RINGING
            call.disposition = "legitimate"
            db.commit()

            ai_forwarding_speech = f"Thanks. I'll check if {self.settings.user_name} is available to take this call."
            response_payload["next_ai_utterance"] = ai_forwarding_speech

            # Record assistant utterance
            if conv:
                db.add(TranscriptSegment(
                    call_id=call.id,
                    speaker="assistant",
                    text=ai_forwarding_speech,
                    language="en-IN",
                    confidence=1.0,
                ))
                db.commit()

            # Find or fallback recipient for user
            recipient = db.query(Recipient).filter(Recipient.is_active == True).first()
            if not recipient:
                recipient = Recipient(
                    display_name=f"{self.settings.user_name} (Personal Line)",
                    phone_number=self.settings.forwarding_destination,
                    department="Personal",
                    role_title="Owner",
                    availability_status="available",
                    is_active=True,
                )
                db.add(recipient)
                db.commit()
                db.refresh(recipient)

            # Initiate warm transfer via Stage 6 transfer coordinator
            transfer_res = transfer_coordinator.initiate_transfer(
                db=db,
                call_id=str(call.id),
                recipient=recipient,
                caller_name=screening_info.caller_name or call.caller_name or "Verified Caller",
                purpose=screening_info.purpose or "General Call",
                language=screening_info.language,
            )

            call.status = CallState.USER_RINGING
            db.commit()

            response_payload["transfer"] = transfer_res
            response_payload["user_prompt_required"] = True

            # Emit incoming call ringing notification for user UI
            await broadcaster.broadcast(
                "call.forwarding.ringing",
                {
                    "call_id": str(call.id),
                    "transfer_id": transfer_res.get("transfer_id"),
                    "caller_name": screening_info.caller_name or call.caller_name or "Verified Caller",
                    "caller_number": call.caller_number,
                    "purpose": screening_info.purpose or "General Call",
                    "risk_level": "LOW",
                    "status": CallState.USER_RINGING,
                    "notification_text": f"{screening_info.caller_name or 'Caller'} is calling. AI screened this call as Low Risk. Reason: {screening_info.purpose or 'Call'}",
                },
            )

        elif rec_action == "CONTINUE_SCREENING":
            # Ask one more neutral screening question
            followup = self.screening_dialogue.generate_followup_question(
                question_number=question_count,
                language=screening_info.language,
            )
            response_payload["next_ai_utterance"] = followup

            if conv:
                db.add(TranscriptSegment(
                    call_id=call.id,
                    speaker="assistant",
                    text=followup,
                    language=screening_info.language,
                    confidence=1.0,
                ))
                db.commit()

            await broadcaster.broadcast(
                "transcript.segment",
                {
                    "call_id": str(call.id),
                    "speaker": "assistant",
                    "text": followup,
                    "is_final": True,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            )

        else:
            # DO_NOT_FORWARD or REVIEW_REQUIRED
            call.status = CallState.AI_HANDLED
            call.disposition = "spam" if risk_assessment.risk_level == "HIGH" else "uncertain"
            db.commit()

            ai_reject_speech = "Thank you for calling. I cannot connect you at this time. Goodbye."
            response_payload["next_ai_utterance"] = ai_reject_speech

            if conv:
                db.add(TranscriptSegment(
                    call_id=call.id,
                    speaker="assistant",
                    text=ai_reject_speech,
                    language="en-IN",
                    confidence=1.0,
                ))
                db.commit()

            await broadcaster.broadcast(
                "call.status.changed",
                {
                    "call_id": str(call.id),
                    "status": CallState.AI_HANDLED,
                    "disposition": call.disposition,
                    "reason": risk_assessment.reasoning,
                },
            )

        return response_payload

    async def handle_user_decision(
        self,
        db: Session,
        call_id: str,
        action: str,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Steps 11 - 15:
        User responds to screened incoming call:
        - ANSWER / TAKE_OVER: Stop AI, bridge caller & user, AI exits call.
        - DECLINE: AI resumes, offers voicemail/callback.
        - LET_AI_HANDLE: AI handles in background.
        """
        call = db.query(Call).filter((Call.id == call_id) | (Call.external_call_sid == call_id)).first()
        if not call:
            raise ValueError(f"Call {call_id} not found.")

        adapter = get_telephony_adapter(call.telephony_provider)
        action_upper = action.upper().strip()

        if action_upper in ["ANSWER", "TAKE_OVER"]:
            # Confirm transfer, stop AI inference, bridge caller and user
            validate_state_transition(call.status, CallState.CONNECTED_TO_USER)
            call.status = CallState.CONNECTED_TO_USER
            call.disposition = "connected"
            db.commit()

            # Instruct carrier adapter to bridge audio channels and detach AI leg
            adapter.bridge_call(call.external_call_sid, call.destination_number)

            event = CallEvent(
                call_id=call.id,
                event_type="call.bridged",
                actor="user",
                payload={"action": action_upper, "status_after": CallState.CONNECTED_TO_USER, "notes": notes, "ai_withdrawn": True},
            )
            db.add(event)
            db.commit()

            # Broadcast SSE: User connected, AI exited
            await broadcaster.broadcast(
                "call.bridged",
                {
                    "call_id": str(call.id),
                    "status": CallState.CONNECTED_TO_USER,
                    "message": f"{self.settings.user_name} answered. Caller and user are bridged. AI has left the call.",
                    "caller_name": call.caller_name or "Caller",
                    "caller_number": call.caller_number,
                },
            )

            return {
                "call_id": str(call.id),
                "status": CallState.CONNECTED_TO_USER,
                "message": "Call successfully bridged. AI has exited the audio stream.",
            }

        elif action_upper == "DECLINE":
            # User declined: AI resumes control and offers voicemail/callback
            validate_state_transition(call.status, CallState.USER_DECLINED)
            call.status = CallState.AI_RESUMED
            db.commit()

            ai_resume_speech = f"It looks like {self.settings.user_name} is not available right now. Would you like to leave a message?"

            conv = db.query(Conversation).filter(Conversation.call_id == call.id).first()
            if conv:
                db.add(TranscriptSegment(
                    call_id=call.id,
                    speaker="assistant",
                    text=ai_resume_speech,
                    language="en-IN",
                    confidence=1.0,
                ))
                db.commit()

            await broadcaster.broadcast(
                "call.status.changed",
                {
                    "call_id": str(call.id),
                    "status": CallState.AI_RESUMED,
                    "ai_speech": ai_resume_speech,
                },
            )

            return {
                "call_id": str(call.id),
                "status": CallState.AI_RESUMED,
                "ai_speech": ai_resume_speech,
            }

        elif action_upper == "LET_AI_HANDLE":
            call.status = CallState.AI_HANDLED
            db.commit()

            await broadcaster.broadcast(
                "call.status.changed",
                {
                    "call_id": str(call.id),
                    "status": CallState.AI_HANDLED,
                    "message": "AI is handling the call in background.",
                },
            )

            return {
                "call_id": str(call.id),
                "status": CallState.AI_HANDLED,
                "message": "AI is handling the call.",
            }

        else:
            raise ValueError(f"Invalid user action '{action}'. Expected ANSWER, DECLINE, LET_AI_HANDLE, or TAKE_OVER.")


call_screening_orchestrator = CallScreeningOrchestrator()
