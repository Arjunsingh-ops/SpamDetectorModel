import logging
import httpx
from fastapi import APIRouter, Body
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telephony", tags=["telephony"])

class TranscribeRequest(BaseModel):
    raw_transcript: str
    language: str = "hi-IN"

class TranscribeResponse(BaseModel):
    refined_text: str
    original_text: str
    language: str

@router.post("/voice-transcribe", response_model=TranscribeResponse)
async def refine_voice_transcript(request: TranscribeRequest = Body(...)):
    """
    Receives raw transcript text from the browser's Web Speech API and refines it
    using Ollama qwen2.5:7b for better Hindi/English/Hinglish accuracy.
    """
    raw_text = request.raw_transcript
    language = request.language
    
    prompt = f"Fix and clean this text if needed. Return ONLY the fixed text, no explanations, no quotes, no extra words. Text: {raw_text}"
    
    payload = {
        "model": "qwen2.5:7b",
        "prompt": prompt,
        "system": "You are a speech-to-text transcript corrector. You only output the exact corrected text. You never output conversational filler like 'The phrase is correct' or 'Translated to'.",
        "stream": False,
        "options": {
            "temperature": 0.0,
            "num_predict": 150
        }
    }
    
    refined_text = raw_text
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post("http://localhost:11434/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()
            if "response" in data:
                refined_text = data["response"].strip()
    except Exception as e:
        logger.error(f"Failed to refine transcript with Ollama: {e}")
        # Graceful fallback: keep refined_text as raw_text
    
    return TranscribeResponse(
        refined_text=refined_text,
        original_text=raw_text,
        language=language
    )
