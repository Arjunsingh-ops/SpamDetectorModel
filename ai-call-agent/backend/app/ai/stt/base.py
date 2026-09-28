"""Abstract Base STT Provider Interface."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class BaseSTTProvider(ABC):
    """
    Abstract Interface for Speech-to-Text (STT) Engines (Faster-Whisper, Deepgram, Mock).
    Decouples acoustic transcription from audio pipeline.
    """

    @abstractmethod
    async def transcribe_audio(
        self,
        pcm_bytes: bytes,
        sample_rate: int = 16000,
        language: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Transcribe raw PCM 16kHz audio bytes into text.
        Returns dict containing: text, language, confidence, segments.
        """
        pass
