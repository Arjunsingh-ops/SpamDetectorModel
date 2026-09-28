"""Abstract Voice AI Adapter Interface."""

from abc import ABC, abstractmethod
from typing import Dict, Any


class VoiceAIAdapter(ABC):
    """
    Abstract interface for Voice AI Conversational Orchestration (English & Hindi).
    Handles speech synthesis, speech recognition, language detection, and intent extraction.
    """

    @abstractmethod
    def get_greeting(self, language_mode: str = "bilingual") -> Dict[str, str]:
        """Return opening greeting phrase in English and Hindi."""
        pass

    @abstractmethod
    def detect_language(self, audio_chunk: bytes) -> str:
        """Detect language from acoustic or lexical features (en-IN, hi-IN, mixed)."""
        pass

    @abstractmethod
    def extract_intent(self, transcript: str) -> Dict[str, Any]:
        """Extract structured caller metadata: name, intent, target person, urgency."""
        pass
