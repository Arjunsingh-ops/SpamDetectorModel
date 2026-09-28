"""ElevenLabs Cloud TTS Provider Implementation."""

import logging
import httpx
from typing import Optional, AsyncGenerator
from app.ai.tts.base import BaseTTSProvider
from app.ai.tts.local_tts import LocalTTSProvider
from app.core.config import settings

logger = logging.getLogger("ai_call_agent.ai.tts.elevenlabs")


class ElevenLabsTTSProvider(BaseTTSProvider):
    """ElevenLabs API Provider. Disabled by default unless ELEVENLABS_API_KEY is configured."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "ELEVENLABS_API_KEY", "")
        self.local_fallback = LocalTTSProvider()

    async def synthesize_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        language: str = "en-IN",
    ) -> bytes:
        if not self.api_key:
            logger.info("ElevenLabs API key not configured. Using local TTS fallback.")
            return await self.local_fallback.synthesize_speech(text, voice_id, language)

        vid = voice_id or getattr(settings, "ELEVENLABS_DEFAULT_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{vid}/stream"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json={"text": text, "model_id": "eleven_multilingual_v2"}, headers=headers)
                if res.status_code == 200:
                    return res.content
        except Exception as err:
            logger.error(f"ElevenLabs TTS request failed ({err}). Falling back to local TTS.")

        return await self.local_fallback.synthesize_speech(text, voice_id, language)

    async def stream_synthesized_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        language: str = "en-IN",
    ) -> AsyncGenerator[bytes, None]:
        audio_bytes = await self.synthesize_speech(text, voice_id, language)
        chunk_size = 640
        for i in range(0, len(audio_bytes), chunk_size):
            yield audio_bytes[i : i + chunk_size]
