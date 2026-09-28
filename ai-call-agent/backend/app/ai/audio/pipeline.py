"""Real-Time Audio Pipeline Orchestrator."""

import logging
from typing import Dict, Any, Optional
from app.ai.stt.faster_whisper import FasterWhisperSTTProvider
from app.ai.tts.local_tts import LocalTTSProvider
from app.ai.llm.ollama_provider import OllamaLLMProvider
from app.ai.conversation.agent import ReceptionistVoiceAgent
from app.ai.conversation.memory import memory_manager
from app.ai.audio.vad import VoiceActivityDetector
from app.ai.audio.interruption import InterruptionHandler
from app.ai.audio.streaming import AudioStreamQueue

logger = logging.getLogger("ai_call_agent.ai.audio.pipeline")


class AudioPipeline:
    """
    End-to-End Voice AI Pipeline:
    Acoustic Frame Ingress -> VAD -> STT Transcription -> LLM Dialogue -> TTS Synthesis -> Frame Outgress.
    """

    def __init__(self, call_id: str, stt_provider=None, tts_provider=None, llm_provider=None):
        self.call_id = call_id
        self.memory = memory_manager.get_or_create(call_id)
        self.stt = stt_provider or FasterWhisperSTTProvider()
        self.tts = tts_provider or LocalTTSProvider()
        self.llm = llm_provider or OllamaLLMProvider()
        self.agent = ReceptionistVoiceAgent(memory=self.memory, llm_provider=self.llm)
        self.vad = VoiceActivityDetector()
        self.interruption_handler = InterruptionHandler()
        self.outbound_queue = AudioStreamQueue()

    def get_initial_greeting_audio(self, language: str = "en-IN") -> str:
        """Get greeting text."""
        return self.agent.get_greeting(language=language)

    async def process_audio_chunk(self, pcm16_bytes: bytes) -> Optional[Dict[str, Any]]:
        """
        Process incoming PCM 16kHz audio frame from caller.
        If user speaks while AI is talking, handle interruption.
        Otherwise accumulate speech frames and process STT -> LLM -> TTS.
        """
        # Check interruption
        if self.interruption_handler.process_incoming_audio_frame(pcm16_bytes, on_interruption=self._on_barge_in):
            self.agent.handle_interruption()
            return {"event": "INTERRUPTED", "message": "Barge-in detected"}

        # Perform STT transcription if speech detected
        if self.vad.is_speech(pcm16_bytes):
            stt_result = await self.stt.transcribe_audio(pcm16_bytes, sample_rate=16000)
            transcript = stt_result.get("text", "").strip()
            if transcript:
                response = await self.agent.process_caller_utterance(transcript)
                # Synthesize TTS response
                audio_out = await self.tts.synthesize_speech(
                    text=response["response_text"],
                    language=response["language"],
                )
                await self.outbound_queue.put(audio_out)
                return {
                    "event": "RESPONSE_GENERATED",
                    "user_transcript": transcript,
                    "ai_response": response["response_text"],
                    "language": response["language"],
                }

        return None

    def _on_barge_in(self) -> None:
        """Flush outbound queue on user interruption."""
        self.outbound_queue.clear()
        logger.info(f"Outbound audio queue cleared for call_id={self.call_id}")
