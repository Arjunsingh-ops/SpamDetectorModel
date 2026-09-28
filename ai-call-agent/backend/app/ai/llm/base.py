"""Abstract Base LLM Provider Interface."""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, AsyncGenerator


class BaseLLMProvider(ABC):
    """
    Abstract Interface for LLM Providers (Ollama, OpenAI, Mock).
    Supports text generation, streaming response chunks, and intent extraction.
    """

    @abstractmethod
    async def generate_response(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]] = None,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
    ) -> str:
        """Generate full completion text for spoken dialogue."""
        pass

    @abstractmethod
    async def stream_response(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]] = None,
        system_instruction: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream response tokens as text chunks for ultra-low latency TTS."""
        pass

    @abstractmethod
    async def extract_intent(self, transcript: str) -> Dict[str, Any]:
        """Extract structured JSON slots: caller_name, purpose, target_person, urgency."""
        pass
