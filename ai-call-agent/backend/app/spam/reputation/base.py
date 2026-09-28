"""Abstract Base Reputation Provider Interface."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class BaseReputationProvider(ABC):
    """
    Abstract Interface for Caller Reputation Analysis.
    Decouples local database reputation from third-party carrier APIs.
    """

    @abstractmethod
    def evaluate_reputation(self, caller_number: str, db_session: Optional[Any] = None) -> Dict[str, Any]:
        """
        Analyze caller E.164 phone number.
        Returns dict with: score (0-100), allowlisted (bool), blocklisted (bool), triggers (list).
        """
        pass
