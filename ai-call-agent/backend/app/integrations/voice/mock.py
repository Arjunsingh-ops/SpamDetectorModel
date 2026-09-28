"""Mock Voice AI Adapter with English & Hindi Simulation."""

from typing import Dict, Any
from app.integrations.voice.base import VoiceAIAdapter
from app.core.logging import logger


class MockVoiceAIAdapter(VoiceAIAdapter):
    """
    Simulates bilingual voice conversational engine for Stage 1 development.
    Emits realistic English and Hindi phrases and structured intent extractions.
    """

    ENGLISH_GREETING = "Hello, thank you for calling. How may I direct your call?"
    HINDI_GREETING = "नमस्ते, मैं आपकी क्या सहायता कर सकता हूँ?"

    def get_greeting(self, language_mode: str = "bilingual") -> Dict[str, str]:
        if language_mode == "hindi":
            return {"primary": self.HINDI_GREETING, "language": "hi-IN"}
        elif language_mode == "english":
            return {"primary": self.ENGLISH_GREETING, "language": "en-IN"}
        else:
            return {
                "primary": f"{self.ENGLISH_GREETING} ({self.HINDI_GREETING})",
                "english": self.ENGLISH_GREETING,
                "hindi": self.HINDI_GREETING,
                "language": "bilingual",
            }

    def detect_language(self, audio_chunk: bytes) -> str:
        # Mock returns Indian English or Hindi based on chunk length
        logger.debug("[MockVoiceAI] Detecting language from simulated audio chunk")
        return "hi-IN" if len(audio_chunk) % 2 == 0 else "en-IN"

    def extract_intent(self, transcript: str) -> Dict[str, Any]:
        transcript_lower = transcript.lower()

        # Simulated rule-based heuristic parsing for common receptionist intents
        if any(w in transcript_lower for w in ["dr", "appointment", "clinic", "hospital"]):
            return {
                "caller_name": "Patient Caller",
                "purpose": "Appointment Scheduling",
                "target_person": "Medical Staff",
                "urgency": "medium",
                "detected_language": "en-IN",
            }
        elif any(w in transcript_lower for w in ["khata", "bank", "otp", "police", "arrest", "lottery"]):
            return {
                "caller_name": "Suspicious Caller",
                "purpose": "Financial or Legal Threat Verification",
                "target_person": "Account Holder",
                "urgency": "high",
                "detected_language": "hi-IN",
            }
        else:
            return {
                "caller_name": "General Inquirer",
                "purpose": "General Business Query",
                "target_person": "Receptionist / Office",
                "urgency": "low",
                "detected_language": "en-IN",
            }
