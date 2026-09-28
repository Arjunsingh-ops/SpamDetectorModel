"""Local Telephony Call Lifecycle Simulator."""

import uuid
import logging
from typing import Dict, Any
from app.core.database import SessionLocal
from app.integrations.telephony.mock_adapter import mock_telephony_adapter
from app.services.call_session import call_session_service
from app.services.call_lifecycle import call_lifecycle_service

logger = logging.getLogger("ai_call_agent.telephony.simulator")


class TelephonySimulator:
    """Simulates realistic incoming calls, status updates, and audio frames without network overhead."""

    @staticmethod
    def run_simulation(
        caller_number: str = "+919876543210",
        destination_number: str = "+911140001234",
        simulate_failure: bool = False,
    ) -> Dict[str, Any]:
        """Run full call lifecycle simulation against database session."""
        db = SessionLocal()
        call_sid = f"SIM_CS_{uuid.uuid4().hex[:12]}"
        try:
            logger.info(f"[SIMULATOR] Starting simulated call from {caller_number} to {destination_number}")

            # 1. Incoming Call Event
            inbound_payload = {
                "CallSid": call_sid,
                "From": caller_number,
                "To": destination_number,
                "CallStatus": "ringing",
                "Direction": "inbound",
            }
            parsed = mock_telephony_adapter.parse_inbound_webhook(inbound_payload)
            call, created = call_session_service.get_or_create_inbound_session(db, parsed)

            # Generate TwiML response
            twiml = mock_telephony_adapter.generate_answer_response(
                call_id=str(call.id),
                stream_url="wss://localhost:8000/api/v1/telephony/stream",
                initial_greeting="Hello from local simulator",
            )

            # 2. Status Callback: in-progress (answered)
            call = call_lifecycle_service.process_status_event(
                db=db,
                provider_call_id=call_sid,
                provider_status="in-progress",
                duration_seconds=5,
            )

            # 3. Status Callback: completed / failed
            final_status = "failed" if simulate_failure else "completed"
            duration = 15 if not simulate_failure else 3
            call = call_lifecycle_service.process_status_event(
                db=db,
                provider_call_id=call_sid,
                provider_status=final_status,
                duration_seconds=duration,
                error_code="30001" if simulate_failure else None,
            )

            logger.info(f"[SIMULATOR] Simulation completed for call_id={call.id}, final status={call.status}")
            return {
                "success": True,
                "call_id": str(call.id),
                "provider_call_id": call_sid,
                "final_status": call.status,
                "duration_seconds": call.duration_seconds,
                "twiml": twiml,
            }
        except Exception as err:
            logger.error(f"[SIMULATOR] Error during simulation: {err}")
            db.rollback()
            return {"success": False, "error": str(err)}
        finally:
            db.close()
