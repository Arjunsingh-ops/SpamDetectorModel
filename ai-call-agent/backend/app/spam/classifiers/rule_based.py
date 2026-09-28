"""Deterministic Lexical and Rule-Based Fraud Classifier."""

import re
import logging
from typing import Dict, Any, List, Optional
from app.spam.classifiers.base import BaseSpamClassifier

logger = logging.getLogger("ai_call_agent.spam.classifiers.rule_based")

# Risk Indicators & Trigger Patterns
FRAUD_PATTERNS = [
    {
        "id": "otp_credential_phishing",
        "pattern": r"(?:share|tell|give|send|enter|code|otp|password|pin|cvv)\b",
        "weight": 85,
        "category": "suspected_scam",
        "explanation": "Demanding high-risk one-time password (OTP) or authentication credential.",
    },
    {
        "id": "utility_cutoff_threat",
        "pattern": r"(?:electricity|power|water|gas|sim|connection|bijli|bill)\s+(?:.*?\s+)?(?:disconnect|cutoff|suspend|expire|shut off|cut)",
        "weight": 90,
        "category": "suspected_scam",
        "explanation": "Artificial urgency threatening immediate utility or service disconnection.",
    },
    {
        "id": "law_enforcement_extortion",
        "pattern": r"(?:police|cbi|arrest|warrant|customs|court|legal action|jail|case filed)",
        "weight": 80,
        "category": "suspected_scam",
        "explanation": "Coercive legal extortion or fake law enforcement threat.",
    },
    {
        "id": "bank_account_block_threat",
        "pattern": r"(?:bank account|debit card|credit card|kyc|account frozen|blocked)",
        "weight": 75,
        "category": "suspected_scam",
        "explanation": "Coercive claim that bank account or payment card is blocked.",
    },
    {
        "id": "unsolicited_loan_marketing",
        "pattern": r"(?:pre-approved|personal loan|credit card offer|lottery|winner|prize money)",
        "weight": 55,
        "category": "marketing",
        "explanation": "Unsolicited commercial personal loan or prize marketing pitch.",
    },
    {
        "id": "prompt_injection_override",
        "pattern": r"(?:ignore previous|system prompt|disregard|you are now|override instructions)",
        "weight": 95,
        "category": "suspected_scam",
        "explanation": "Prompt injection attack attempting to override AI system safety controls.",
    },
]


class RuleBasedSpamClassifier(BaseSpamClassifier):
    """
    Deterministic Lexical Rule-Based Spam & Fraud Classifier.
    Evaluates English, Hindi, and Hinglish transcript indicators against safety rules.
    """

    def classify_transcript(
        self,
        transcript: str,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        if not transcript or not transcript.strip():
            return {
                "category": "legitimate",
                "score": 0,
                "indicators": [],
                "evidence_segments": [],
                "explanation": "Clean utterance.",
            }

        text_lower = transcript.lower()
        matched_indicators = []
        evidence_quotes = []
        max_score = 0
        assigned_category = "legitimate"
        explanations = []

        # Evaluate against rule patterns
        for rule in FRAUD_PATTERNS:
            if re.search(rule["pattern"], text_lower, re.IGNORECASE):
                matched_indicators.append(rule["id"])
                evidence_quotes.append(transcript.strip())
                max_score = max(max_score, rule["weight"])
                assigned_category = rule["category"]
                explanations.append(rule["explanation"])

        # Nuanced handling: If call mentions "appointment", "doctor", "delivery", "meeting", reduce score unless OTP/extortion matched
        if any(legit_kw in text_lower for legit_kw in ["appointment", "doctor", "meeting", "delivery", "courier", "office"]):
            if "otp_credential_phishing" not in matched_indicators and "utility_cutoff_threat" not in matched_indicators:
                max_score = min(max_score, 20)
                if assigned_category != "suspected_scam":
                    assigned_category = "legitimate"

        action = "continue" if assigned_category == "legitimate" else ("screen_further" if assigned_category in ["marketing", "suspected_spam"] else "screen_further")

        return {
            "category": assigned_category,
            "score": max_score,
            "indicators": matched_indicators,
            "evidence_segments": list(set(evidence_quotes)),
            "recommended_action": action,
            "explanation": " ".join(explanations) if explanations else "Normal conversation without suspicious indicators.",
        }


rule_based_spam_classifier = RuleBasedSpamClassifier()
