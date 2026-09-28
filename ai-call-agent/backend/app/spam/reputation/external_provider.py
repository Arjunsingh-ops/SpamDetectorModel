"""External Reputation Provider Adapter Interface."""

import logging
from typing import Dict, Any, Optional
from app.spam.reputation.base import BaseReputationProvider

logger = logging.getLogger("ai_call_agent.spam.reputation.external")


class ExternalReputationProvider(BaseReputationProvider):
    """Optional Cloud/Carrier Reputation API Provider. Disabled by default."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    def evaluate_reputation(self, caller_number: str, db_session: Optional[Any] = None) -> Dict[str, Any]:
        if not self.api_key:
            logger.debug("External reputation API key not set. Using local reputation provider.")
            return {"score": 0, "triggers": [], "provider": "external_disabled"}

        return {
            "score": 0,
            "triggers": ["external_api_lookup"],
            "provider": "external_carrier_api",
        }
