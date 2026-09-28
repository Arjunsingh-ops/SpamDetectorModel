"""Isolated Per-Call Session Memory Manager."""

import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("ai_call_agent.ai.conversation.memory")


class ConversationMemory:
    """Stores isolated conversation turn history for a single active call session."""

    def __init__(self, call_id: str, max_turns: int = 20):
        self.call_id = call_id
        self.max_turns = max_turns
        self.history: List[Dict[str, Any]] = []
        self.detected_language: str = "en-IN"
        self.extracted_slots: Dict[str, Any] = {
            "caller_name": None,
            "purpose": None,
            "target_person": None,
            "urgency": "medium",
        }

    def add_turn(self, speaker: str, text: str, language: Optional[str] = None) -> None:
        """Append turn to conversation memory."""
        if not text:
            return
        turn = {
            "speaker": speaker,  # caller | assistant | system
            "text": text.strip(),
            "language": language or self.detected_language,
        }
        self.history.append(turn)
        if language:
            self.detected_language = language

        # Maintain bounded turn history limit to avoid token bloat
        if len(self.history) > self.max_turns * 2:
            self.history = self.history[-self.max_turns :]

    def get_formatted_history(self) -> List[Dict[str, str]]:
        """Return history ready for LLM provider consumption."""
        return [{"speaker": turn["speaker"], "text": turn["text"]} for turn in self.history]

    def clear(self) -> None:
        """Clear memory session."""
        self.history.clear()
        self.extracted_slots.clear()


class GlobalMemoryManager:
    """Registry managing active per-call memory instances in-memory."""

    def __init__(self):
        self._sessions: Dict[str, ConversationMemory] = {}

    def get_or_create(self, call_id: str) -> ConversationMemory:
        if call_id not in self._sessions:
            self._sessions[call_id] = ConversationMemory(call_id=call_id)
        return self._sessions[call_id]

    def remove(self, call_id: str) -> None:
        if call_id in self._sessions:
            self._sessions[call_id].clear()
            del self._sessions[call_id]


memory_manager = GlobalMemoryManager()
