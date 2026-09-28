"""Abstract Telephony Adapter Interface."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class TelephonyAdapter(ABC):
    """
    Abstract interface for Telephony Carriers / Gateways (Twilio, Indian SIP, Exotel, Mock).
    Decouples core application logic from carrier-specific TwiML/NCCO protocols.
    """

    @abstractmethod
    def verify_webhook_signature(
        self,
        url: str,
        params: Dict[str, Any],
        signature: str,
        auth_token: Optional[str] = None,
    ) -> bool:
        """Verify cryptographic HMAC signature of inbound carrier webhook."""
        pass

    @abstractmethod
    def parse_inbound_webhook(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize carrier-specific webhook payload into standard internal format."""
        pass

    @abstractmethod
    def generate_answer_response(
        self,
        call_id: str,
        stream_url: str,
        initial_greeting: str,
        language: str = "en-IN",
        recording_notice: bool = True,
    ) -> str:
        """Generate carrier TwiML/XML response instructions to answer the call and connect audio stream."""
        pass

    @abstractmethod
    def initiate_transfer(
        self,
        external_call_sid: str,
        target_number: str,
        caller_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Bridge active call to designated target E.164 phone number."""
        pass

    @abstractmethod
    def terminate_call(self, external_call_sid: str, reason: str = "completed") -> bool:
        """Disconnect/hang up an active call session."""
        pass
