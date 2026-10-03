"""
Provider-Independent Telephony Adapter Interface.

Defines the abstract contract for telephony carrier adapters (Twilio, SIP/Indian VoIP, Mock),
ensuring core business and AI screening logic has zero direct dependencies on vendor-specific code.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List


class TelephonyAdapter(ABC):
    """
    Abstract contract for telephony carriers and media gateways.
    Provides capability introspection, inbound webhook verification,
    media-stream negotiation, call bridging, and termination.
    """

    name: str = "generic"
    supports_bidirectional_media: bool = False
    supports_bridging: bool = False
    supports_sip_metadata: bool = False

    @abstractmethod
    def verify_webhook_signature(
        self,
        url: str,
        params: Dict[str, Any],
        signature: str,
        auth_token: Optional[str] = None,
    ) -> bool:
        """Verify cryptographic HMAC signature or token on inbound carrier webhook."""
        pass

    @abstractmethod
    def parse_inbound_webhook(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize carrier-specific webhook payload into unified internal schema:
        {
            'external_call_sid': str,
            'provider_call_id': str,
            'caller_number': str,
            'recipient_number': str,
            'status': str,
            'direction': str,
            'caller_name': Optional[str],
            'telephony_provider': str,
            'raw_payload': dict
        }
        """
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
        """Generate carrier response instructions (TwiML / SIP 200 OK / NCCO) to answer call and connect media."""
        pass

    @abstractmethod
    def initiate_transfer(
        self,
        external_call_sid: str,
        target_number: str,
        caller_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Instruct carrier to ring target destination."""
        pass

    @abstractmethod
    def bridge_call(
        self,
        external_call_sid: str,
        target_destination: str,
    ) -> bool:
        """Bridge active caller leg directly to user leg and withdraw AI media stream."""
        pass

    @abstractmethod
    def terminate_call(self, external_call_sid: str, reason: str = "completed") -> bool:
        """Disconnect/hang up an active call session."""
        pass
