"""Voice Agent Configuration, Audio Preview, and Browser Simulator Endpoints."""

import json
import base64
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Response
from pydantic import BaseModel

from app.core.config import settings
from app.ai.tts.local_tts import LocalTTSProvider
from app.ai.tts.elevenlabs_provider import ElevenLabsTTSProvider
from app.services.voice_session import voice_session_manager

logger = logging.getLogger("ai_call_agent.api.v1.voice")

router = APIRouter(prefix="/voice", tags=["voice-agent"])
local_tts = LocalTTSProvider()
elevenlabs_tts = ElevenLabsTTSProvider()


class VoicePreviewRequest(BaseModel):
    text: str = "Hello! I am your AI receptionist. How may I help you today?"
    provider: str = "local_tts"  # local_tts | elevenlabs | custom_xtts
    voice_id: Optional[str] = None
    language: str = "en-IN"


@router.get("/config")
def get_voice_config():
    """Retrieve global Voice Agent configuration, active models, and provider capabilities."""
    return {
        "llm_provider": getattr(settings, "LLM_PROVIDER", "ollama"),
        "ollama_model": getattr(settings, "OLLAMA_MODEL", "qwen2.5:3b"),
        "stt_provider": "faster_whisper",
        "stt_device": getattr(settings, "STT_DEVICE", "cpu"),
        "whisper_model": getattr(settings, "WHISPER_MODEL_SIZE", "tiny"),
        "tts_provider": getattr(settings, "TTS_PROVIDER", "local_tts"),
        "available_languages": ["en-IN", "hi-IN", "mixed"],
        "default_language": getattr(settings, "DEFAULT_LANGUAGE", "en-IN"),
        "cloud_providers_enabled": bool(getattr(settings, "ELEVENLABS_API_KEY", "") or getattr(settings, "OPENAI_API_KEY", "")),
    }


@router.post("/preview")
async def generate_voice_preview(payload: VoicePreviewRequest):
    """Synthesize instant audio preview for selected voice profile and language."""
    try:
        if payload.provider == "elevenlabs":
            pcm_bytes = await elevenlabs_tts.synthesize_speech(payload.text, payload.voice_id, payload.language)
        else:
            pcm_bytes = await local_tts.synthesize_speech(payload.text, payload.voice_id, payload.language)

        return Response(content=pcm_bytes, media_type="audio/pcm")
    except Exception as err:
        logger.error(f"Error generating voice preview: {err}")
        raise HTTPException(status_code=500, detail="Failed to synthesize voice preview.")


@router.websocket("/simulate")
async def browser_call_simulator_socket(websocket: WebSocket):
    """
    WebSocket endpoint for Browser-Based Voice Call Simulation (Task 15).
    Supports microphone PCM audio streaming or text input, real-time transcription,
    AI response audio streaming, state notifications, barge-in, and conversation summary.
    """
    await websocket.accept()
    call_id = f"SIM_CALL_{websocket.client.host}"
    pipeline = voice_session_manager.get_or_create_pipeline(call_id)

    # 1. Send initial bilingual greeting
    greeting_text = pipeline.get_initial_greeting_audio(language=getattr(settings, "DEFAULT_LANGUAGE", "en-IN"))
    greeting_audio = await local_tts.synthesize_speech(greeting_text)
    greeting_audio_b64 = base64.b64encode(greeting_audio).decode("utf-8")

    await websocket.send_text(json.dumps({
        "event": "AI_GREETING",
        "state": pipeline.agent.state,
        "text": greeting_text,
        "audio_b64": greeting_audio_b64,
        "language": getattr(settings, "DEFAULT_LANGUAGE", "en-IN"),
    }))

    try:
        while True:
            msg_text = await websocket.receive_text()
            data = json.loads(msg_text)
            action = data.get("action")

            if action == "TEXT_INPUT":
                text = data.get("text", "").strip()
                if text:
                    res = await pipeline.agent.process_caller_utterance(text)
                    audio_out = await local_tts.synthesize_speech(res["response_text"], language=res["language"])
                    audio_b64 = base64.b64encode(audio_out).decode("utf-8")

                    await websocket.send_text(json.dumps({
                        "event": "AI_RESPONSE",
                        "state": res["state"],
                        "user_transcript": text,
                        "ai_response": res["response_text"],
                        "audio_b64": audio_b64,
                        "language": res["language"],
                        "extracted_slots": res["extracted_slots"],
                    }))

            elif action == "AUDIO_FRAME":
                audio_b64 = data.get("audio_b64", "")
                if audio_b64:
                    raw_pcm = base64.b64decode(audio_b64)
                    res = await pipeline.process_audio_chunk(raw_pcm)
                    if res:
                        await websocket.send_text(json.dumps({
                            "event": "AUDIO_PROCESSED",
                            "payload": res,
                        }))

            elif action == "INTERRUPT":
                pipeline.agent.handle_interruption()
                pipeline._on_barge_in()
                await websocket.send_text(json.dumps({
                    "event": "INTERRUPTED",
                    "state": pipeline.agent.state,
                    "message": "AI speech cancelled by caller barge-in.",
                }))

            elif action == "END_CALL":
                await websocket.send_text(json.dumps({
                    "event": "CALL_ENDED",
                    "state": "COMPLETED",
                    "summary": f"Conversation completed with {len(pipeline.memory.history)} turns.",
                    "extracted_slots": pipeline.memory.extracted_slots,
                }))
                break

    except WebSocketDisconnect:
        logger.info("Browser call simulator WebSocket disconnected.")
    except Exception as err:
        logger.error(f"Error in browser call simulator: {err}")
    finally:
        pipeline.memory.clear()
