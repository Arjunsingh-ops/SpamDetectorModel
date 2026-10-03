"""OpenAI Whisper API Speech Recognition Provider."""

import io
import wave
import logging
from typing import Dict, Any, Optional
import httpx
from app.ai.stt.base import BaseSTTProvider
from app.core.config import settings

logger = logging.getLogger("ai_call_agent.ai.stt.openai_whisper")


class OpenAIWhisperSTTProvider(BaseSTTProvider):
    """
    OpenAI Whisper API STT Provider.
    Transcribes audio via OpenAI's audio/transcriptions API endpoint.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "OPENAI_API_KEY", "")

    async def transcribe_audio(
        self,
        pcm_bytes: bytes,
        sample_rate: int = 16000,
        language: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not pcm_bytes or len(pcm_bytes) < 320:
            return {"text": "", "language": "en-IN", "confidence": 0.0, "segments": []}

        if not self.api_key:
            logger.info("OPENAI_API_KEY not configured. Falling back to local Faster-Whisper provider.")
            from app.ai.stt.faster_whisper import FasterWhisperSTTProvider
            fallback = FasterWhisperSTTProvider()
            return await fallback.transcribe_audio(pcm_bytes, sample_rate, language)

        try:
            # Convert raw PCM 16-bit mono to WAV format in memory
            wav_io = io.BytesIO()
            with wave.open(wav_io, "wb") as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)  # 16-bit PCM
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(pcm_bytes)
            wav_bytes = wav_io.getvalue()

            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {"Authorization": f"Bearer {self.api_key}"}
                files = {"file": ("audio.wav", wav_bytes, "audio/wav")}
                data = {
                    "model": "whisper-1",
                    "response_format": "verbose_json",
                }
                if language:
                    data["language"] = language[:2].lower()

                response = await client.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers=headers,
                    files=files,
                    data=data,
                )
                response.raise_for_status()
                res_data = response.json()

                text = res_data.get("text", "").strip()
                detected_lang = res_data.get("language", "en")
                lang_code = "hi-IN" if detected_lang in ["hi", "hindi"] else "en-IN"

                return {
                    "text": text,
                    "language": lang_code,
                    "confidence": 0.95,
                    "segments": res_data.get("segments", []),
                }
        except Exception as err:
            logger.error(f"OpenAI Whisper API transcription error: {err}. Using local fallback.")
            from app.ai.stt.faster_whisper import FasterWhisperSTTProvider
            fallback = FasterWhisperSTTProvider()
            return await fallback.transcribe_audio(pcm_bytes, sample_rate, language)
