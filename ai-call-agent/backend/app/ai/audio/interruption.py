"""Barge-In and Interruption Detection Module."""

import logging
from typing import Optional, Callable
from app.ai.audio.vad import VoiceActivityDetector

logger = logging.getLogger("ai_call_agent.ai.audio.interruption")


class InterruptionHandler:
    """
    Monitors incoming caller audio during AI playback.
    Triggers barge-in cancellation when sustained user speech is detected.
    """

    def __init__(self, energy_threshold: int = 500, min_speech_duration_ms: int = 250):
        self.vad = VoiceActivityDetector(energy_threshold=energy_threshold)
        self.min_speech_duration_ms = min_speech_duration_ms
        self.consecutive_speech_chunks = 0
        self.is_ai_speaking = False

    def set_ai_speaking_state(self, speaking: bool) -> None:
        self.is_ai_speaking = speaking
        if not speaking:
            self.consecutive_speech_chunks = 0

    def process_incoming_audio_frame(self, pcm_bytes: bytes, on_interruption: Optional[Callable[[], None]] = None) -> bool:
        """
        Process incoming audio frame.
        If AI is currently speaking and user utters speech, trigger interruption.
        Returns True if barge-in detected.
        """
        if not self.is_ai_speaking:
            self.consecutive_speech_chunks = 0
            return False

        has_speech = self.vad.is_speech(pcm_bytes)
        if has_speech:
            self.consecutive_speech_chunks += 1
            # 20ms frames * 5 = 100ms sustained speech
            if self.consecutive_speech_chunks >= 3:
                logger.info("Barge-in / Interruption detected! Cancelling pending AI TTS playback.")
                self.is_ai_speaking = False
                self.consecutive_speech_chunks = 0
                if on_interruption:
                    on_interruption()
                return True
        else:
            self.consecutive_speech_chunks = max(0, self.consecutive_speech_chunks - 1)

        return False
