"""Mock Multi-Signal Spam Detection Adapter with Rule-Based Heuristics."""

from typing import Dict, Any, Optional
from app.integrations.spam.base import SpamDetectionAdapter
from app.core.config import settings
from app.core.logging import logger


class MockSpamDetectionAdapter(SpamDetectionAdapter):
    """
    Stage 1 Mock Spam Engine evaluating deterministic rule-based heuristics.
    Simulates Pillar A (Reputation), Pillar B (Semantics), and Pillar C (Behavior).
    """

    KNOWN_SPAM_PREFIXES = ["+91140", "+919000000000", "+1800555"]
    FRAUD_KEYWORDS = [
        "otp", "kyc expired", "electricity bill", "power disconnect",
        "arrest warrant", "customs parcel", "cbi officer", "lottery prize",
        "aadhaar link", "free crypto", "instant loan approved"
    ]

    def evaluate_call(
        self,
        caller_number: str,
        transcript: Optional[str] = None,
        audio_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        logger.info(f"[MockSpamEngine] Evaluating call risk for {caller_number}")

        # Pillar A: Reputation & Carrier (0-100)
        reputation_score = 0
        triggers = []
        if any(caller_number.startswith(prefix) for prefix in self.KNOWN_SPAM_PREFIXES):
            reputation_score = 85
            triggers.append("known_telemarketer_or_spam_prefix")

        # Pillar B: Semantic & Fraud Pattern Analysis (0-100)
        semantic_score = 0
        if transcript:
            text_lower = transcript.lower()
            matched_keywords = [kw for kw in self.FRAUD_KEYWORDS if kw in text_lower]
            if matched_keywords:
                semantic_score = min(95, 30 + len(matched_keywords) * 25)
                triggers.extend([f"keyword:{kw}" for kw in matched_keywords])

        # Pillar C: Behavioral (0-100)
        behavioral_score = 0
        if audio_metadata and audio_metadata.get("silence_ratio", 0) > 0.6:
            behavioral_score = 65
            triggers.append("high_silence_or_robocall_cadence")

        # Weighted Composite Score: 40% Reputation + 50% Semantics + 10% Behavioral
        composite = int(
            (reputation_score * 0.40) +
            (semantic_score * 0.50) +
            (behavioral_score * 0.10)
        )

        # Classification against configured thresholds
        if composite >= settings.SPAM_THRESHOLD_BLOCK:
            classification = "spam"
            rationale = f"High probability scam/spam detected. Triggered by: {', '.join(triggers)}"
        elif composite >= settings.SPAM_THRESHOLD_UNCERTAIN:
            classification = "uncertain"
            rationale = f"Suspicious signals detected requiring interactive challenge. Triggered by: {', '.join(triggers)}"
        else:
            classification = "legitimate"
            rationale = "No spam indicators detected; call verified for forwarding."

        confidence = 0.95 if (classification == "spam" or classification == "legitimate") else 0.70

        return {
            "composite_score": composite,
            "reputation_score": reputation_score,
            "semantic_score": semantic_score,
            "behavioral_score": behavioral_score,
            "classification": classification,
            "confidence": confidence,
            "detected_triggers": ", ".join(triggers) if triggers else "none",
            "ai_rationale": rationale,
        }
