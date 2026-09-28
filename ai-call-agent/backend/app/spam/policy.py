"""Safe Call Screening Policy and Neutral Follow-Up Questions."""

import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger("ai_call_agent.spam.policy")

# Neutral Follow-Up Questions for UNCERTAIN Calls (Task 10)
SCREENING_QUESTIONS_ENGLISH = [
    "May I know the purpose of your call today?",
    "Which person or department would you like to reach?",
    "Is this regarding an existing appointment or service request?",
]

SCREENING_QUESTIONS_HINDI = [
    "क्या मैं आपकी कॉल का उद्देश्य जान सकता हूँ?",
    "आप किस व्यक्ति या विभाग से बात करना चाहते हैं?",
    "क्या यह किसी मौजूदा अपॉइंटमेंट या सेवा अनुरोध के बारे में है?",
]


class ScreeningPolicyEngine:
    """
    Enforces safe, non-destructive call screening policies:
    LOW (0-39): Continue conversation.
    UNCERTAIN (40-69): Ask neutral follow-up question / flag for operator review.
    HIGH (70-100): Flag for operator review queue (Never auto-block without human signoff).
    """

    @staticmethod
    def evaluate_policy(composite_score: int) -> Dict[str, Any]:
        uncertain_thresh = getattr(settings, "SPAM_THRESHOLD_UNCERTAIN", 40)
        block_thresh = getattr(settings, "SPAM_THRESHOLD_BLOCK", 70)

        if composite_score >= block_thresh:
            return {
                "risk_category": "HIGH",
                "classification": "spam",
                "recommended_action": "review",
                "requires_screening_question": True,
                "allow_transfer": False,
            }
        elif composite_score >= uncertain_thresh:
            return {
                "risk_category": "UNCERTAIN",
                "classification": "uncertain",
                "recommended_action": "screen_further",
                "requires_screening_question": True,
                "allow_transfer": True,
            }

        return {
            "risk_category": "LOW",
            "classification": "legitimate",
            "recommended_action": "continue",
            "requires_screening_question": False,
            "allow_transfer": True,
        }

    @staticmethod
    def get_screening_question(language: str = "en-IN", index: int = 0) -> str:
        """Get neutral follow-up question in English or Hindi."""
        if "hi" in language.lower():
            return SCREENING_QUESTIONS_HINDI[index % len(SCREENING_QUESTIONS_HINDI)]
        return SCREENING_QUESTIONS_ENGLISH[index % len(SCREENING_QUESTIONS_ENGLISH)]


screening_policy_engine = ScreeningPolicyEngine()
