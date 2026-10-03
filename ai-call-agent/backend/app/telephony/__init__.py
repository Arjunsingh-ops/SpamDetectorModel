"""
Provider-Independent Telephony Module.

Exports TelephonyAdapter interface, concrete implementations (Twilio, SIP, Mock),
and factory function to dynamically resolve the active provider.
"""

from typing import Optional
from app.core.config import settings
from app.telephony.base import TelephonyAdapter
from app.telephony.twilio import TwilioAdapter, twilio_adapter
from app.telephony.sip import SIPAdapter, sip_adapter
from app.telephony.mock import MockAdapter, mock_adapter


def get_telephony_adapter(provider_name: Optional[str] = None) -> TelephonyAdapter:
    """Return active provider adapter based on setting or explicit name."""
    provider = (provider_name or getattr(settings, "TELEPHONY_PROVIDER", "mock")).lower().strip()
    if provider == "twilio":
        return twilio_adapter
    elif provider == "sip":
        return sip_adapter
    return mock_adapter


__all__ = [
    "TelephonyAdapter",
    "TwilioAdapter",
    "twilio_adapter",
    "SIPAdapter",
    "sip_adapter",
    "MockAdapter",
    "mock_adapter",
    "get_telephony_adapter",
]
