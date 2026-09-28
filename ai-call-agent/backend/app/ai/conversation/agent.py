"""Natural Language AI Receptionist Conversation Agent."""

import logging
from typing import Dict, Any, Optional
from app.ai.conversation.memory import ConversationMemory
from app.ai.conversation.prompts import (
    ENGLISH_RECEPTIONIST_PROMPT,
    HINDI_RECEPTIONIST_PROMPT,
    BILINGUAL_GREETING_ENGLISH,
    BILINGUAL_GREETING_HINDI,
)
from app.ai.conversation.language_detector import LanguageDetector
from app.ai.conversation.intent_extractor import IntentExtractor
from app.ai.llm.ollama_provider import OllamaLLMProvider

logger = logging.getLogger("ai_call_agent.ai.conversation.agent")


class VoiceAgentState:
    INITIALIZING = "INITIALIZING"
    GREETING = "GREETING"
    LISTENING = "LISTENING"
    TRANSCRIBING = "TRANSCRIBING"
    THINKING = "THINKING"
    SPEAKING = "SPEAKING"
    INTERRUPTED = "INTERRUPTED"
    WAITING = "WAITING"
    ENDING = "ENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ReceptionistVoiceAgent:
    """
    Stateful Conversational AI Receptionist orchestrating dialogue turns,
    language switching, intent slot extraction, and interruption management.
    """

    def __init__(self, memory: ConversationMemory, llm_provider: Optional[Any] = None):
        self.memory = memory
        self.state = VoiceAgentState.INITIALIZING
        self.llm = llm_provider or OllamaLLMProvider()

    def get_greeting(self, language: str = "en-IN") -> str:
        """Return initial greeting string and transition to GREETING state."""
        self.state = VoiceAgentState.GREETING
        if "hi" in language.lower():
            greeting = BILINGUAL_GREETING_HINDI
        else:
            greeting = BILINGUAL_GREETING_ENGLISH
        
        self.memory.add_turn("assistant", greeting, language=language)
        self.state = VoiceAgentState.WAITING
        return greeting

    async def process_caller_utterance(self, transcript: str) -> Dict[str, Any]:
        """
        Process transcribed caller speech, update language classification,
        extract intent slots, generate AI text response, and return session state.
        """
        if not transcript or not transcript.strip():
            return {
                "response_text": "I didn't quite catch that. Could you please repeat?",
                "state": VoiceAgentState.WAITING,
                "language": self.memory.detected_language,
            }

        self.state = VoiceAgentState.TRANSCRIBING
        
        # 1. Detect language
        lang_res = LanguageDetector.detect_language(transcript)
        current_lang = lang_res["language"]
        self.memory.add_turn("caller", transcript, language=current_lang)

        # 2. Extract intent slots
        slots = IntentExtractor.extract_slots(transcript)
        for k, v in slots.items():
            if v and not self.memory.extracted_slots.get(k):
                self.memory.extracted_slots[k] = v

        # 3. Transition to THINKING state
        self.state = VoiceAgentState.THINKING
        system_prompt = (
            HINDI_RECEPTIONIST_PROMPT if "hi" in current_lang.lower() else ENGLISH_RECEPTIONIST_PROMPT
        )
        
        ai_response = await self.llm.generate_response(
            prompt=transcript,
            history=self.memory.get_formatted_history(),
            system_instruction=system_prompt,
        )

        self.memory.add_turn("assistant", ai_response, language=current_lang)
        self.state = VoiceAgentState.SPEAKING

        return {
            "response_text": ai_response,
            "state": VoiceAgentState.SPEAKING,
            "language": current_lang,
            "extracted_slots": self.memory.extracted_slots,
        }

    def handle_interruption(self) -> None:
        """Handle caller barge-in / interruption event."""
        logger.info(f"Agent state interrupted for call_id={self.memory.call_id}")
        self.state = VoiceAgentState.INTERRUPTED
