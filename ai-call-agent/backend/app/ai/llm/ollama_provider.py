"""Ollama Local LLM Provider Implementation."""

import json
import logging
import httpx
from typing import List, Dict, Any, Optional, AsyncGenerator
from app.ai.llm.base import BaseLLMProvider
from app.core.config import settings

logger = logging.getLogger("ai_call_agent.ai.llm.ollama")


class OllamaLLMProvider(BaseLLMProvider):
    """
    Ollama Provider connecting to local Ollama inference server (default http://localhost:11434).
    Provides streaming text generation and structured JSON intent extraction.
    Falls back gracefully to deterministic dialogue when Ollama server is offline.
    """

    def __init__(self, base_url: Optional[str] = None, model_name: Optional[str] = None):
        self.base_url = (base_url or getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        self.model_name = model_name or getattr(settings, "OLLAMA_MODEL", "qwen2.5:3b")

    async def generate_response(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]] = None,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
    ) -> str:
        messages = self._build_messages(prompt, history, system_instruction)
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model_name,
                        "messages": messages,
                        "stream": False,
                        "options": {"temperature": temperature},
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    return data.get("message", {}).get("content", "").strip()
        except Exception as err:
            logger.warning(f"Ollama server unavailable ({err}). Using fallback conversational response.")

        return self._fallback_conversational_response(prompt)

    async def stream_response(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]] = None,
        system_instruction: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        messages = self._build_messages(prompt, history, system_instruction)
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/chat",
                    json={"model": self.model_name, "messages": messages, "stream": True},
                ) as response:
                    if response.status_code == 200:
                        async for chunk_bytes in response.aiter_lines():
                            if chunk_bytes.strip():
                                data = json.loads(chunk_bytes)
                                content = data.get("message", {}).get("content", "")
                                if content:
                                    yield content
                        return
        except Exception as err:
            logger.warning(f"Ollama streaming failed ({err}). Falling back to static response.")

        yield self._fallback_conversational_response(prompt)

    async def extract_intent(self, transcript: str) -> Dict[str, Any]:
        """Extract structured JSON slots from transcript."""
        system_prompt = (
            "You are a structured JSON intent extractor for an AI virtual receptionist. "
            "Analyze the conversation transcript and return JSON ONLY with keys: "
            "caller_name (str or null), purpose (str), target_person (str or null), "
            "urgency (low|medium|high), language (en-IN|hi-IN|mixed)."
        )
        try:
            raw_response = await self.generate_response(
                prompt=f"Transcript: {transcript}",
                system_instruction=system_prompt,
                temperature=0.1,
            )
            # Find JSON block
            start_idx = raw_response.find("{")
            end_idx = raw_response.rfind("}")
            if start_idx != -1 and end_idx != -1:
                json_str = raw_response[start_idx : end_idx + 1]
                return json.loads(json_str)
        except Exception as err:
            logger.warning(f"Intent extraction via Ollama failed ({err}). Using rule-based fallback.")

        # Fallback rule-based extraction
        lower_txt = transcript.lower()
        purpose = "General Inquiry"
        if "appointment" in lower_txt or "doctor" in lower_txt or "schedule" in lower_txt:
            purpose = "Appointment Scheduling"
        elif "overdue" in lower_txt or "bank" in lower_txt or "otp" in lower_txt or "police" in lower_txt:
            purpose = "Financial or Security Verification"

        return {
            "caller_name": None,
            "purpose": purpose,
            "target_person": "Reception Desk",
            "urgency": "medium",
            "language": "hi-IN" if any(w in lower_txt for w in ["नमस्ते", "आप", "हाँ", "नहीं"]) else "en-IN",
        }

    def _build_messages(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]],
        system_instruction: Optional[str],
    ) -> List[Dict[str, str]]:
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        if history:
            for item in history:
                role = "user" if item.get("speaker") in ["caller", "user"] else "assistant"
                messages.append({"role": role, "content": item.get("text", "")})
        messages.append({"role": "user", "content": prompt})
        return messages

    def _fallback_conversational_response(self, prompt: str) -> str:
        prompt_lower = prompt.lower()
        if "namaste" in prompt_lower or "नमस्ते" in prompt_lower:
            return "नमस्ते! मैं आपका एआई रिसेप्शनिस्ट हूँ। बताइए, मैं आपकी क्या सहायता कर सकता हूँ?"
        elif "appointment" in prompt_lower or "doctor" in prompt_lower or "schedule" in prompt_lower:
            return "I can certainly help you schedule an appointment. May I please have your full name?"
        elif "speak to" in prompt_lower or "transfer" in prompt_lower or "manager" in prompt_lower:
            return "I'd be glad to connect you. May I know the reason for your call before transferring?"
        return "Thank you for reaching out to our reception desk. How may I assist you today?"
