"""Twilio Telephony Adapter implementation with TwiML and Stream support."""

import logging
from typing import Dict, Any, Optional
from xml.sax.saxutils import escape
from app.integrations.telephony.base import TelephonyAdapter
from app.integrations.telephony.webhook_validator import TwilioWebhookValidator
from app.core.config import settings

logger = logging.getLogger("ai_call_agent.telephony.twilio")


class TwilioTelephonyAdapter(TelephonyAdapter):
    """
    Twilio carrier adapter generating production-ready TwiML XML responses,
    WebSocket stream endpoints, and webhook validation.
    """

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
        return self.validator.validate(url, params, signature, auth_token=auth_token)

    def parse_inbound_webhook(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Twilio POST parameters into application call payload."""
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
        """
        Generates production TwiML XML instructing Twilio to:
        1. Optionally announce recording / quality notice.
        2. Speak the configured initial greeting (in Hindi or English).
        3. Establish a real-time bidirectional WebSocket Media Stream.
        """
        # Determine voice model based on language preference
        voice = "Polly.Aditi" if "hi" in language.lower() or "in" in language.lower() else "Polly.Joanna"
        lang_code = "hi-IN" if "hi" in language.lower() else "en-IN"

        escaped_greeting = escape(initial_greeting)
        
        notice_twiml = ""
        if recording_notice or getattr(settings, "ENABLE_CALL_RECORDING", False):
            notice_text = "This call may be recorded and processed for quality and service assistance."
            notice_twiml = f"<Say voice='{voice}' language='{lang_code}'>{escape(notice_text)}</Say>"

        twiml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Response>'
            f'{notice_twiml}'
            f'<Say voice="{voice}" language="{lang_code}">{escaped_greeting}</Say>'
            '<Connect>'
            f'<Stream url="{stream_url}">'
            f'<Parameter name="callId" value="{call_id}" />'
            '</Stream>'
            '</Connect>'
            '</Response>'
        )
        return twiml

    def generate_greeting_twiml(self, greeting_text: str, language: str = "en-IN") -> str:
        """Generate static greeting TwiML without connecting stream (fallback)."""
        voice = "Polly.Aditi" if "hi" in language.lower() or "in" in language.lower() else "Polly.Joanna"
        lang_code = "hi-IN" if "hi" in language.lower() else "en-IN"
        return (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Response>'
            f'<Say voice="{voice}" language="{lang_code}">{escape(greeting_text)}</Say>'
            '</Response>'
        )

    def initiate_transfer(
        self,
        external_call_sid: str,
        target_number: str,
        caller_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """TwiML response to transfer/dial an external number."""
        escaped_target = escape(target_number)
        caller_attr = f' callerId="{escape(caller_id)}"' if caller_id else ""
        twiml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Response>'
            '<Say voice="Polly.Aditi">Please hold while I transfer your call.</Say>'
            f'<Dial{caller_attr}>{escaped_target}</Dial>'
            '</Response>'
        )
        return {"action": "transfer", "twiml": twiml, "target_number": target_number}

    def terminate_call(self, external_call_sid: str, reason: str = "completed") -> bool:
        """Return disconnect TwiML."""
        logger.info(f"Terminating call {external_call_sid} for reason: {reason}")
        return True


# Export alias for backwards compatibility
twilio_telephony_adapter = TwilioTelephonyAdapter()
