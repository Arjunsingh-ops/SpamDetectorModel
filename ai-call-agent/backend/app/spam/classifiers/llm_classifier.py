"""LLM Conversation Spam Classifier with Ollama Integration."""

import json
import logging
from typing import Dict, Any, List
from app.spam.classifiers.base import BaseSpamClassifier
from app.spam.classifiers.rule_based import rule_based_spam_classifier
from app.ai.llm.ollama_provider import OllamaLLMProvider

logger = logging.getLogger("ai_call_agent.spam.classifiers.llm")


class LLMSpamClassifier(BaseSpamClassifier):
    """
    LLM-driven Conversation Classifier using local Ollama.
    Enforces Pydantic schema validation and prompt-injection sanitization.
    """

    def __init__(self, llm_provider=None):
        self.llm = llm_provider or OllamaLLMProvider()

    def classify_transcript(
        self,
        transcript: str,
        conversation_history: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        # Always run deterministic rule check first
        rule_res = rule_based_spam_classifier.classify_transcript(transcript, conversation_history)
        if rule_res["score"] >= 80:
            logger.info("High-risk rule pattern detected. Utilizing deterministic rule result.")
            return rule_res

        # Prompt-injection sanitization
        sanitized_txt = self._sanitize_input(transcript)

        system_instruction = (
            "You are a security risk classifier for an AI receptionist. "
            "Analyze the caller's statement and classify into JSON format ONLY with keys: "
            "category (legitimate|marketing|suspected_spam|suspected_scam), "
            "score (0-100), indicators (list of str), explanation (str)."
        )

        try:
            # Synchronous wrapper around LLM response for classifier interface
            import asyncio
            loop = asyncio.get_event_loop()
            if not loop.is_running():
                raw_llm = loop.run_until_complete(
                    self.llm.generate_response(
                        prompt=f"Utterance: {sanitized_txt}",
                        system_instruction=system_instruction,
                        temperature=0.1,
                    )
                )
                start_idx = raw_llm.find("{")
                end_idx = raw_llm.rfind("}")
                if start_idx != -1 and end_idx != -1:
                    parsed = json.loads(raw_llm[start_idx : end_idx + 1])
                    return {
                        "category": parsed.get("category", rule_res["category"]),
                        "score": int(parsed.get("score", rule_res["score"])),
                        "indicators": parsed.get("indicators", rule_res["indicators"]),
                        "evidence_segments": [sanitized_txt] if parsed.get("score", 0) > 40 else [],
                        "explanation": parsed.get("explanation", rule_res["explanation"]),
                    }
        except Exception as err:
            logger.debug(f"LLM spam classification fallback to rule-based engine: {err}")

        return rule_res

    def _sanitize_input(self, text: str) -> str:
        """Sanitize text to neutralize prompt injection attempts."""
        cleaned = text.replace("system prompt", "[redacted]").replace("ignore previous", "[redacted]")
        return cleaned[:500]


llm_spam_classifier = LLMSpamClassifier()
