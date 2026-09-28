"""Mock Telephony Adapter Implementation for Development & Testing."""

import logging
import uuid
from typing import Dict, Any, Optional
from app.integrations.telephony.base import TelephonyAdapter

logger = logging.getLogger("ai_call_agent.telephony.mock")


class MockTelephonyAdapter(TelephonyAdapter):
    """Development fixture simulating carrier interactions without network overhead or paid APIs."""

    def __init__(self):
        self.recorded_calls = {}

    def verify_webhook_signature(
        self,
        url: str,
        params: Dict[str, Any],
        signature: str,
        auth_token: Optional[str] = None,
    ) -> bool:
        return True

    def parse_inbound_webhook(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        call_sid = raw_data.get("CallSid") or f"MOCK_CS_{uuid.uuid4().hex[:12]}"
        return {
            "external_call_sid": call_sid,
            "provider_call_id": call_sid,
            "caller_number": raw_data.get("From", "+15550199000"),
            "recipient_number": raw_data.get("To", "+15550199001"),
            "destination_number": raw_data.get("To", "+15550199001"),
            "status": raw_data.get("CallStatus", "ringing"),
            "direction": "inbound",
            "telephony_provider": "mock",
            "caller_name": raw_data.get("CallerName", "Mock Caller"),
            "raw_payload": raw_data,
        }

    def generate_answer_response(
        self,
        call_id: str,
        stream_url: str,
        initial_greeting: str,
        language: str = "en-IN",
        recording_notice: bool = True,
    ) -> str:
        return (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Response>'
            f'<Say>{initial_greeting}</Say>'
            f'<Connect><Stream url="{stream_url}"/></Connect>'
            '</Response>'
        )

    def initiate_transfer(
        self,
        external_call_sid: str,
        target_number: str,
        caller_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return {"action": "mock_transfer", "status": "initiated", "target_number": target_number}

    def initiate_warm_transfer(
        self,
        external_call_sid: str,
        target_number: str,
        announcement_text: str,
    ) -> Dict[str, Any]:
        logger.info(f"[Mock] Initiating warm transfer for {external_call_sid} to {target_number} with announcement: {announcement_text}")
        return {
            "action": "mock_warm_transfer",
            "status": "AWAITING_ACCEPTANCE",
            "target_number": target_number,
            "announcement": announcement_text,
        }

    def bridge_call_legs(self, external_call_sid: str, recipient_call_sid: str) -> bool:
        logger.info(f"[Mock] Bridged caller leg {external_call_sid} to recipient leg {recipient_call_sid}")
        return True

    def terminate_call(self, external_call_sid: str, reason: str = "completed") -> bool:
        logger.info(f"[Mock] Call {external_call_sid} terminated ({reason})")
        return True


mock_telephony_adapter = MockTelephonyAdapter()
