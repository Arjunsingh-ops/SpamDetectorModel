"""Abstract Base TTS Provider Interface."""

from abc import ABC, abstractmethod
from typing import Optional, AsyncGenerator


class BaseTTSProvider(ABC):
    """
    Abstract Interface for Text-to-Speech (TTS) Engines (Local, ElevenLabs, Custom XTTS).
    Decouples voice synthesis from audio streaming pipeline.
    """

    @abstractmethod
    async def synthesize_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        language: str = "en-IN",
    ) -> bytes:
        """Synthesize text into PCM 16kHz audio bytes."""
        pass

    @abstractmethod
    async def stream_synthesized_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        language: str = "en-IN",
    ) -> AsyncGenerator[bytes, None]:
        """Stream synthesized audio chunks for ultra-low latency playback."""
        pass
