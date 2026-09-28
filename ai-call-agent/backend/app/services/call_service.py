"""Call Orchestration and Lifecycle Management Service."""

import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.logging import logger
from app.models.call import Call
from app.models.call_event import CallEvent
from app.integrations.telephony.mock import MockTelephonyAdapter
from app.integrations.voice.mock import MockVoiceAIAdapter
from app.integrations.spam.mock import MockSpamDetectionAdapter


class CallService:
    """Orchestrates call events, voice AI dialog, and spam scoring."""

    def __init__(self, db: Optional[Session] = None):
        self.db = db
        self.telephony_adapter = MockTelephonyAdapter()
        self.voice_adapter = MockVoiceAIAdapter()
        self.spam_adapter = MockSpamDetectionAdapter()

    def process_inbound_call(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle incoming telephony webhook:
        1. Parse carrier payload
        2. Create initial call session & event
        3. Prepare bilingual greeting
        4. Return answer/streaming instructions
        """
        normalized = self.telephony_adapter.parse_inbound_webhook(payload)
        call_sid = normalized["external_call_sid"]
        caller_number = normalized["caller_number"]
        recipient_number = normalized["recipient_number"]

        call_id = uuid.uuid4()
        now = datetime.now(timezone.utc)

        greeting_info = self.voice_adapter.get_greeting(language_mode="bilingual")
        initial_greeting = greeting_info["primary"]

        if self.db:
            try:
                call = Call(
                    id=call_id,
                    external_call_sid=call_sid,
                    caller_number=caller_number,
                    recipient_number=recipient_number,
                    status="ringing",
                    disposition="uncertain",
                    detected_language="bilingual",
                    caller_name=normalized.get("caller_name"),
                    started_at=now,
                )
                event = CallEvent(
                    call_id=call_id,
                    event_type="RINGING",
                    actor="telephony",
                    payload={"caller_number": caller_number, "direction": "inbound"},
                )
                self.db.add(call)
                self.db.add(event)
                self.db.commit()
                self.db.refresh(call)
            except Exception as e:
                logger.warning(f"Database commit failed during webhook ingestion, continuing with stream answer: {e}")
                self.db.rollback()

        stream_url = f"wss://{settings.HOST}:{settings.PORT}/api/v1/voice/stream/{call_id}"
        answer_instruction = self.telephony_adapter.generate_answer_response(
            call_id=str(call_id),
            stream_url=stream_url,
            initial_greeting=initial_greeting,
        )

        return answer_instruction

    def list_calls(
        self,
        status: Optional[str] = None,
        disposition: Optional[str] = None,
        limit: int = 20,
        page: int = 1,
    ) -> Dict[str, Any]:
        """Query calls from database or return rich mock dataset if DB empty/offline."""
        if self.db:
            try:
                query = self.db.query(Call)
                if status:
                    query = query.filter(Call.status == status)
                if disposition:
                    query = query.filter(Call.disposition == disposition)

                total = query.count()
                offset = (page - 1) * limit
                items = query.order_by(Call.created_at.desc()).offset(offset).limit(limit).all()

                if items:
                    return {
                        "items": items,
                        "total": total,
                        "page": page,
                        "limit": limit,
                        "pages": (total + limit - 1) // limit,
                    }
            except Exception as e:
                logger.warning(f"Database query failed, serving mock calls: {e}")

        # Fallback / Initial Demo Dataset for Stage 1 UI validation
        mock_items = self._get_mock_calls()
        if disposition:
            mock_items = [c for c in mock_items if c["disposition"] == disposition]
        if status:
            mock_items = [c for c in mock_items if c["status"] == status]

        total = len(mock_items)
        return {
            "items": mock_items,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": 1,
        }

    def _get_mock_calls(self) -> List[Dict[str, Any]]:
        """Realistic sample calls representing Indian & International virtual receptionist operations."""
        now = datetime.now(timezone.utc)
        return [
            {
                "id": uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6"),
                "external_call_sid": "CA_DEMO_001_INBOUND",
                "caller_number": "+919876543210",
                "recipient_number": "+911140001234",
                "direction": "inbound",
                "status": "completed",
                "disposition": "legitimate",
                "detected_language": "hi-IN",
                "caller_name": "Rohan Sharma",
                "caller_intent": "Inquiring about office space availability for immediate lease",
                "duration_seconds": 138,
                "spam_score": 12,
                "started_at": now,
                "completed_at": now,
                "created_at": now,
            },
            {
                "id": uuid.UUID("7ca85f64-5717-4562-b3fc-2c963f66afb7"),
                "external_call_sid": "CA_DEMO_002_SPAM",
                "caller_number": "+911409988776",
                "recipient_number": "+911140001234",
                "direction": "inbound",
                "status": "blocked",
                "disposition": "spam",
                "detected_language": "en-IN",
                "caller_name": "Automated Loan Department",
                "caller_intent": "Unsolicited pre-approved personal loan offer requiring instant Aadhaar verification",
                "duration_seconds": 22,
                "spam_score": 88,
                "started_at": now,
                "completed_at": now,
                "created_at": now,
            },
            {
                "id": uuid.UUID("9da85f64-5717-4562-b3fc-2c963f66afc8"),
                "external_call_sid": "CA_DEMO_003_REVIEW",
                "caller_number": "+919811223344",
                "recipient_number": "+911140001234",
                "direction": "inbound",
                "status": "completed",
                "disposition": "uncertain",
                "detected_language": "mixed",
                "caller_name": "Courier Delivery",
                "caller_intent": "Calling regarding parcel delivery address verification in Sector 62",
                "duration_seconds": 65,
                "spam_score": 45,
                "started_at": now,
                "completed_at": now,
                "created_at": now,
            },
        ]
