"""OpenAI Cloud LLM Provider Implementation."""

import json
import logging
from typing import List, Dict, Any, Optional, AsyncGenerator
from app.ai.llm.base import BaseLLMProvider
from app.core.config import settings

logger = logging.getLogger("ai_call_agent.ai.llm.openai")


class OpenAILLMProvider(BaseLLMProvider):
    """Optional OpenAI API Provider (gpt-4o-mini / gpt-4o). Disabled by default."""

    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4o-mini"):
        self.api_key = api_key or getattr(settings, "OPENAI_API_KEY", "")
        self.model = model

    async def generate_response(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]] = None,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
    ) -> str:
        if not self.api_key:
            logger.info("OpenAI API key not set. Using local conversational fallback.")
            return "Thank you for reaching out to our AI receptionist service."
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key)
            messages = self._format_messages(prompt, history, system_instruction)
            response = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=150,
            )
            return response.choices[0].message.content.strip()
        except Exception as err:
            logger.error(f"OpenAI API request failed: {err}")
            return "Thank you for your response. How else may I assist you today?"

    async def stream_response(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]] = None,
        system_instruction: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            yield "Thank you for contacting our reception line."
            return
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key)
            messages = self._format_messages(prompt, history, system_instruction)
            stream = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True,
                max_tokens=150,
            )
            async for chunk in stream:
                content = chunk.choices[0].delta.content or ""
                if content:
                    yield content
        except Exception as err:
            logger.error(f"OpenAI streaming error: {err}")
            yield "How may I assist you today?"

    async def extract_intent(self, transcript: str) -> Dict[str, Any]:
        prompt = f"Extract slots from transcript: {transcript}"
        raw = await self.generate_response(prompt, system_instruction="Return JSON format ONLY.")
        try:
            return json.loads(raw)
        except Exception:
            return {"caller_name": None, "purpose": "General Query", "urgency": "medium"}

    def _format_messages(self, prompt: str, history: Optional[List[Dict[str, str]]], system_instruction: Optional[str]):
        msgs = []
        if system_instruction:
            msgs.append({"role": "system", "content": system_instruction})
        if history:
            for item in history:
                role = "user" if item.get("speaker") in ["caller", "user"] else "assistant"
                msgs.append({"role": role, "content": item.get("text", "")})
        msgs.append({"role": "user", "content": prompt})
        return msgs
