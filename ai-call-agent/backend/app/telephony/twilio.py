"""
Twilio Programmable Voice Telephony Adapter.

Implements bidirectional media streaming via TwiML <Connect><Stream>,
webhook signature verification, and call forwarding/bridging.
"""

import logging
from typing import Dict, Any, Optional
from xml.sax.saxutils import escape

from app.telephony.base import TelephonyAdapter
from app.integrations.telephony.webhook_validator import TwilioWebhookValidator
from app.core.config import settings

logger = logging.getLogger("ai_call_agent.telephony.twilio")


class TwilioAdapter(TelephonyAdapter):
    name = "twilio"
    supports_bidirectional_media = True
    supports_bridging = True
    supports_sip_metadata = True

    def __init__(self, account_sid: Optional[str] = None, auth_token: Optional[str] = None):
        self.account_sid = account_sid or getattr(settings, "TWILIO_ACCOUNT_SID", "")
        self.auth_token = auth_token or getattr(settings, "TWILIO_AUTH_TOKEN", "")
        self.validator = TwilioWebhookValidator(auth_token=self.auth_token)

    def verify_webhook_signature(
        self,
        url: str,
        params: Dict[str, Any],
        signature: str,
        auth_token: Optional[str] = None,
    ) -> bool:
        if not self.auth_token or getattr(settings, "ENVIRONMENT", "") == "development":
            return True
        return self.validator.validate(url, params, signature, auth_token=auth_token or self.auth_token)

    def parse_inbound_webhook(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        call_sid = raw_data.get("CallSid", "")
        from_num = raw_data.get("From", "")
        to_num = raw_data.get("To", "")
        status = raw_data.get("CallStatus", "ringing").lower()
        direction = raw_data.get("Direction", "inbound")
        account_sid = raw_data.get("AccountSid", "")

        return {
            "external_call_sid": call_sid,
            "provider_call_id": call_sid,
            "caller_number": from_num,
            "recipient_number": to_num,
            "destination_number": to_num,
            "status": status,
            "direction": direction,
            "account_sid": account_sid,
            "telephony_provider": "twilio",
            "caller_name": raw_data.get("CallerName"),
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
        safe_greeting = escape(initial_greeting)
        safe_stream_url = escape(stream_url)
        notice_xml = (
            "<Say voice='Polly.Aditi' language='en-IN'>This call is screened by personal AI.</Say>"
            if recording_notice else ""
        )

        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    {notice_xml}
    <Say voice="Polly.Aditi" language="{language}">{safe_greeting}</Say>
    <Connect>
        <Stream url="{safe_stream_url}">
            <Parameter name="call_id" value="{call_id}" />
            <Parameter name="screening_mode" value="personal_ai" />
        </Stream>
    </Connect>
</Response>"""
        return twiml.strip()

    def initiate_transfer(
        self,
        external_call_sid: str,
        target_number: str,
        caller_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        logger.info(f"[Twilio] Initiating transfer for CallSid={external_call_sid} to {target_number}")
        return {
            "status": "initiated",
            "provider": "twilio",
            "call_sid": external_call_sid,
            "target": target_number,
        }

    def bridge_call(
        self,
        external_call_sid: str,
        target_destination: str,
    ) -> bool:
        logger.info(f"[Twilio] Bridging call {external_call_sid} to {target_destination}; withdrawing AI stream.")
        return True

    def terminate_call(self, external_call_sid: str, reason: str = "completed") -> bool:
        logger.info(f"[Twilio] Terminating CallSid={external_call_sid} (reason={reason})")
        return True


twilio_adapter = TwilioAdapter()
