"""Abstract Multi-Signal Spam & Fraud Detection Engine Adapter."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class SpamDetectionAdapter(ABC):
    """
    Abstract interface for Multi-Signal Spam & Fraud Detection Engine.
    Evaluates:
    - Pillar A: Number reputation & carrier signals
    - Pillar B: Conversational semantic analysis (lexical/intent)
    - Pillar C: Behavioral signals (audio cadence, silence, bot patterns)
    """

    @abstractmethod
    def evaluate_call(
        self,
        caller_number: str,
        transcript: Optional[str] = None,
        audio_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Evaluate risk across all 3 pillars and return composite score (0-100),
        individual scores, classification, confidence, triggers, and rationale.
        """
        pass
