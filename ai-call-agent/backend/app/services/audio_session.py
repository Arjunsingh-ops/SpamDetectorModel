"""Audio Session Service and G.711 Mu-Law Transcoding Helpers."""

import audioop
import base64
import logging
from typing import Optional

logger = logging.getLogger("ai_call_agent.services.audio_session")


class AudioTranscoder:
    """Helper utilities for G.711 Mu-Law 8000Hz (Telephony) <-> Linear PCM 16000Hz (AI STT/TTS)."""

    @staticmethod
    def mulaw_to_pcm16(mulaw_bytes: bytes) -> bytes:
        """
        Convert G.711 mu-law (8kHz, 8-bit) to linear PCM (16kHz, 16-bit mono).
        """
        try:
            # Step 1: Decode mu-law (8-bit) to linear PCM (16-bit) at 8kHz
            pcm8k = audioop.ulaw2lin(mulaw_bytes, 2)
            # Step 2: Resample from 8000Hz to 16000Hz for AI models
            pcm16k, _ = audioop.ratecv(pcm8k, 2, 1, 8000, 16000, None)
            return pcm16k
        except Exception as err:
            logger.error(f"Failed to transcode mu-law to PCM16: {err}")
            return b""

    @staticmethod
    def pcm16_to_mulaw(pcm16k_bytes: bytes) -> bytes:
        """
        Convert linear PCM (16kHz, 16-bit mono) to G.711 mu-law (8kHz, 8-bit).
        """
        try:
            # Step 1: Downsample from 16000Hz to 8000Hz
            pcm8k, _ = audioop.ratecv(pcm16k_bytes, 2, 1, 16000, 8000, None)
            # Step 2: Encode linear PCM (16-bit) to mu-law (8-bit)
            mulaw = audioop.lin2ulaw(pcm8k, 2)
            return mulaw
        except Exception as err:
            logger.error(f"Failed to transcode PCM16 to mu-law: {err}")
            return b""


class AudioSessionManager:
    """Manages active audio stream status and development audio simulation fixtures."""

    def __init__(self):
        self.transcoder = AudioTranscoder()

    def process_incoming_frame(self, raw_mulaw_b64: str) -> Optional[bytes]:
        """Decode base64 payload and extract raw mu-law bytes."""
        try:
            mulaw_bytes = base64.b64decode(raw_mulaw_b64)
            return mulaw_bytes
        except Exception as err:
            logger.error(f"Error decoding base64 audio frame: {err}")
            return None


audio_session_manager = AudioSessionManager()
