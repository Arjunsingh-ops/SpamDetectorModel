"""Abstract Base Spam Classifier Interface."""

from abc import ABC, abstractmethod
from typing import Dict, Any, List


class BaseSpamClassifier(ABC):
    """
    Abstract Interface for Conversation-based Spam & Fraud Classifiers.
    Analyzes live transcript text and returns category, score, and risk triggers.
    """

    @abstractmethod
    def classify_transcript(
        self,
        transcript: str,
        conversation_history: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Classify transcript text.
        Returns dict containing: category, score (0-100), indicators, evidence_segments, explanation.
        """
        pass
