"""Webhook Signature Validator for Telephony Webhooks."""

import base64
import hmac
import hashlib
import logging
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("ai_call_agent.telephony.webhook_validator")


class TwilioWebhookValidator:
    """Validates X-Twilio-Signature against expected HMAC-SHA1 digest."""

    def __init__(self, auth_token: Optional[str] = None):
        self.auth_token = auth_token or getattr(settings, "TWILIO_AUTH_TOKEN", "")

    def validate(
        self,
        url: str,
        params: Dict[str, Any],
        signature: Optional[str],
        auth_token: Optional[str] = None,
    ) -> bool:
        """
        Validate incoming Twilio webhook signature.
        If TELEPHONY_SIMULATION or SKIP_WEBHOOK_VALIDATION is enabled, return True.
        """
        token = auth_token or self.auth_token

        # Check development/test bypass toggles
        if getattr(settings, "TELEPHONY_SIMULATION", False) or getattr(settings, "SKIP_WEBHOOK_VALIDATION", False):
            logger.debug("Bypassing webhook signature validation (simulation or skip enabled)")
            return True

        if not signature or not token:
            logger.warning("Missing signature or auth token for Twilio webhook validation")
            return False

        try:
            # Twilio signature calculation:
            # 1. Start with full URL
            # 2. Append sorted key+value pairs of POST parameters
            # 3. Compute HMAC-SHA1 using AUTH_TOKEN as secret
            # 4. Base64 encode signature
            data_to_sign = url
            for key in sorted(params.keys()):
                data_to_sign += f"{key}{params[key]}"

            expected_hmac = hmac.new(
                token.encode("utf-8"),
                data_to_sign.encode("utf-8"),
                hashlib.sha1,
            ).digest()
            expected_signature = base64.b64encode(expected_hmac).decode("utf-8")

            is_valid = hmac.compare_digest(expected_signature, signature)
            if not is_valid:
                logger.warning(f"Signature mismatch: computed {expected_signature} vs header {signature}")
            return is_valid
        except Exception as err:
            logger.error(f"Error during webhook signature validation: {err}")
            return False


validator_instance = TwilioWebhookValidator()
