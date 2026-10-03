"""
Mock Telephony Adapter for Local Development and Browser Simulation.

Emulates carrier webhook lifecycle, media streaming, bridging, and teardown
in memory without external telephony accounts or credentials.
"""

import json
import logging
from typing import Dict, Any, Optional

from app.telephony.base import TelephonyAdapter

logger = logging.getLogger("ai_call_agent.telephony.mock")


class MockAdapter(TelephonyAdapter):
    name = "mock"
    supports_bidirectional_media = True
    supports_bridging = True
    supports_sip_metadata = True

    def __init__(self):
        self.active_calls: Dict[str, Dict[str, Any]] = {}

    def verify_webhook_signature(
        self,
        url: str,
        params: Dict[str, Any],
        signature: str,
        auth_token: Optional[str] = None,
    ) -> bool:
        return True

    def parse_inbound_webhook(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        call_sid = (
            raw_data.get("CallSid")
            or raw_data.get("call_id")
            or raw_data.get("provider_call_id")
            or "mock-call-sid"
        )
        return {
            "external_call_sid": call_sid,
            "provider_call_id": call_sid,
            "caller_number": raw_data.get("From") or raw_data.get("caller_number") or "+919876543210",
            "recipient_number": raw_data.get("To") or raw_data.get("recipient_number") or "+911122334455",
            "destination_number": raw_data.get("To") or raw_data.get("destination_number") or "+911122334455",
            "status": raw_data.get("CallStatus") or raw_data.get("status") or "ringing",
            "direction": "inbound",
            "telephony_provider": "mock",
            "caller_name": raw_data.get("CallerName") or raw_data.get("caller_name") or "Rahul",
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
        return json.dumps({
            "action": "answer",
            "call_id": call_id,
            "stream_url": stream_url,
            "greeting": initial_greeting,
            "language": language,
            "status": "answered",
        })

    def initiate_transfer(
        self,
        external_call_sid: str,
        target_number: str,
        caller_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        logger.info(f"[MockTelephony] Ringing target user phone at {target_number} for call {external_call_sid}")
        self.active_calls[external_call_sid] = {
            "target": target_number,
            "status": "ringing_user",
        }
        return {
            "status": "ringing_user",
            "provider": "mock",
            "call_sid": external_call_sid,
            "target_number": target_number,
        }

    def bridge_call(
        self,
        external_call_sid: str,
        target_destination: str,
    ) -> bool:
        logger.info(f"[MockTelephony] Successfully bridged caller and user for {external_call_sid}. AI exits.")
        if external_call_sid in self.active_calls:
            self.active_calls[external_call_sid]["status"] = "bridged"
        return True

    def terminate_call(self, external_call_sid: str, reason: str = "completed") -> bool:
        logger.info(f"[MockTelephony] Disconnected mock call {external_call_sid} ({reason})")
        if external_call_sid in self.active_calls:
            del self.active_calls[external_call_sid]
        return True


mock_adapter = MockAdapter()
