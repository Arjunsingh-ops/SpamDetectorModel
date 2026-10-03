"""
Hybrid Spam & Fraud Detection Engine Master Orchestrator.

Combines:
1. ML Classifier (TF-IDF + Logistic Regression model from spam-detector/)
2. Known spam numbers database & carrier reputation
3. High-risk fraud pattern regex rules (OTP phishing, extortion, law enforcement, utility cutoff)
4. Prompt injection detection
5. Behavioral call frequency analysis
6. Strict Personal AI Safe-Forwarding Policy
"""

import re
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.spam.reputation.local_provider import local_reputation_provider
from app.spam.classifiers.rule_based import rule_based_spam_classifier, FRAUD_PATTERNS
from app.spam.behavior.analyzer import behavior_analyzer
from app.spam.scoring import risk_scoring_engine
from app.spam.policy import screening_policy_engine
from app.spam.explanations import risk_explanation_generator
from app.integrations.spam.ml_engine import ml_spam_adapter
from app.schemas.screening import UnifiedRiskAssessment, ExtractedScreeningInfo

logger = logging.getLogger("ai_call_agent.spam.engine")


SPAM_INDICATORS = {
    "otp": "The conversation asks for an OTP or verification code.",
    "one-time password": "The conversation asks for an OTP or verification code.",
    "bank account": "The conversation involves sensitive bank account information.",
    "bank details": "The conversation asks for sensitive banking details.",
    "credit card": "The conversation involves sensitive credit card information.",
    "debit card": "The conversation involves sensitive debit card information.",
    "password": "The conversation asks for a password or other sensitive credential.",
    "processing fee": "The conversation asks for a processing fee or payment.",
    "lottery": "The conversation contains a lottery or prize-related offer.",
    "jackpot": "The conversation contains a jackpot or lottery claim.",
    "prize": "The conversation contains an unsolicited prize offer.",
    "urgent": "The conversation uses urgency or coercion to pressure the recipient.",
    "verify your account": "The conversation asks the recipient to verify an account.",
    "kyc": "The conversation requests KYC / identity verification.",
    "remote access": "The conversation requests downloading remote access software.",
}


class HybridSpamEngine:
    """
    Production Hybrid Spam Engine combining Caller Reputation, Lexical/ML Semantics,
    and Call Behavior into explainable risk assessments.
    """

    def __init__(self):
        self.ml_adapter = ml_spam_adapter

    def evaluate_call(
        self,
        caller_number: str,
        transcript: str = "",
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        duration_seconds: int = 0,
        db_session: Optional[Session] = None,
        use_llm: bool = False,
    ) -> Dict[str, Any]:
        """
        Evaluate full multi-factor spam risk assessment.
        Returns complete assessment dict with composite_score, risk_category, explanation, policy.
        """
        history = conversation_history or []

        # 1. Pillar A: Reputation Analysis
        rep_res = local_reputation_provider.evaluate_reputation(caller_number, db_session)

        # 2. Pillar B: ML Classifier + Semantic Rule Analysis
        sem_res = rule_based_spam_classifier.classify_transcript(transcript, history)

        # Incorporate trained TF-IDF + Logistic Regression ML Model
        ml_score = 0
        ml_triggers = []
        try:
            ml_eval = self.ml_adapter.evaluate_call(
                caller_number=caller_number,
                transcript=transcript,
            )
            ml_score = ml_eval.get("semantic_score", 0)
            ml_triggers = ml_eval.get("triggers", [])
        except Exception as e:
            logger.warning(f"[HybridSpamEngine] ML adapter evaluation exception: {e}")

        combined_semantic_score = max(sem_res["score"], ml_score)

        # 3. Pillar C: Behavior & Frequency Analysis
        beh_res = behavior_analyzer.evaluate_behavior(caller_number, duration_seconds, db_session)

        # 4. Multi-Signal Scoring Aggregation
        score_res = risk_scoring_engine.calculate_composite_score(
            reputation_score=rep_res["score"],
            semantic_score=combined_semantic_score,
            behavioral_score=beh_res["score"],
            allowlisted=rep_res.get("allowlisted", False),
            blocklisted=rep_res.get("blocklisted", False),
        )

        composite_score = score_res["composite_score"]

        # 5. Policy & Risk Category Decision
        policy_res = screening_policy_engine.evaluate_policy(composite_score)

        # 6. Explainable Rationale Generation
        explanation_res = risk_explanation_generator.generate_explanation(
            reputation_data=rep_res,
            semantic_data=sem_res,
            behavioral_data=beh_res,
            composite_score=composite_score,
        )

        all_triggers = list(set(rep_res["triggers"] + sem_res["indicators"] + beh_res["triggers"] + ml_triggers))

        return {
            "composite_score": composite_score,
            "reputation_score": score_res["reputation_score"],
            "semantic_score": score_res["semantic_score"],
            "behavioral_score": score_res["behavioral_score"],
            "classification": policy_res["classification"],
            "risk_category": policy_res["risk_category"],
            "recommended_action": policy_res["recommended_action"],
            "confidence": sem_res.get("confidence", 0.92),
            "detected_triggers": ",".join(all_triggers),
            "evidence_segments": sem_res.get("evidence_segments", []),
            "explanation": explanation_res["summary"],
            "explainable_breakdown": explanation_res,
            "policy": policy_res,
            "model_version": "v2.5.0-tfidf_lr_hybrid",
        }

    def evaluate_unified_screening_risk(
        self,
        caller_number: str,
        transcript: str,
        screening_info: ExtractedScreeningInfo,
        screening_question_count: int = 1,
        allowlisted: bool = False,
        blocklisted: bool = False,
        db_session: Optional[Session] = None,
    ) -> UnifiedRiskAssessment:
        """
        Evaluate full call risk against the personal AI screening policy.
        Enforces strict safety rules:
        - NEVER forward on is_scam == False alone.
        - Requires LOW risk + identified purpose + sufficient evidence to SAFE_TO_FORWARD.
        - High risk -> DO_NOT_FORWARD.
        - Uncertain -> CONTINUE_SCREENING.
        - If ML fails -> Fallback to CONTINUE_SCREENING / REVIEW_REQUIRED (never auto-safe).
        """
        flagged_phrases = []
        evidence = []
        text_lower = transcript.lower()

        # Check prompt injection override attempt
        injection_patterns = [
            r"(?:ignore|forget|disregard)\s+(?:all\s+|your\s+)*(?:previous|prior|system)?\s*(?:instructions|prompts|rules)",
            r"you\s+are\s+now\s+(?:an?\s+)?(?:unrestricted|admin|operator|developer)",
            r"override\s+(?:security|screening|safety|instructions)",
            r"transfer\s+me\s+(?:directly|immediately)?.*without\s+asking",
            r"sudo\s+connect",
        ]
        for ipat in injection_patterns:
            if re.search(ipat, text_lower, re.IGNORECASE):
                logger.warning(f"[Security] Blocked prompt injection attack: {ipat}")
                return UnifiedRiskAssessment(
                    risk_level="HIGH",
                    risk_score=0.98,
                    category="IMPERSONATION",
                    flagged_phrases=["prompt_injection_override"],
                    evidence=[transcript.strip()],
                    reasoning="Adversarial prompt injection attempt detected aiming to force call transfer or bypass AI safety.",
                    recommended_action="DO_NOT_FORWARD",
                    screening_question_count=screening_question_count,
                )

        # 1. Evaluate via hybrid multi-signal engine
        try:
            assessment = self.evaluate_call(
                caller_number=caller_number,
                transcript=transcript,
                db_session=db_session,
                use_llm=False,
            )
            score_100 = assessment.get("composite_score", 0)
            risk_score = round(score_100 / 100.0, 2)
            detected_triggers = [t for t in assessment.get("detected_triggers", "").split(",") if t]
            flagged_phrases.extend(detected_triggers)
            evidence.extend(assessment.get("evidence_segments", []))
        except Exception as err:
            logger.error(f"[HybridSpamEngine] Classifier failure: {err}")
            # SAFETY RULE: Never classify as safe if classifier fails!
            return UnifiedRiskAssessment(
                risk_level="UNCERTAIN",
                risk_score=0.50,
                category="UNKNOWN",
                flagged_phrases=["classifier_error_fallback"],
                evidence=[transcript.strip()],
                reasoning="Classifier error occurred. In accordance with safety policy, call marked as UNCERTAIN.",
                recommended_action="CONTINUE_SCREENING" if screening_question_count < 3 else "REVIEW_REQUIRED",
                screening_question_count=screening_question_count,
            )

        # 2. Categorization
        if "otp" in text_lower or "password" in text_lower or "pin" in text_lower or "cvv" in text_lower:
            category = "PHISHING_OTP"
            risk_score = max(risk_score, 0.90)
            flagged_phrases.append("credential_otp_phishing")
            evidence.append(transcript.strip())
        elif any(w in text_lower for w in ["bank account", "kyc", "blocked", "lottery", "prize", "arrest", "cbi"]):
            category = "FINANCIAL_SCAM"
            risk_score = max(risk_score, 0.85)
            flagged_phrases.append("financial_scam_or_coercion")
            evidence.append(transcript.strip())
        elif any(w in text_lower for w in ["loan offer", "credit card offer", "insurance policy", "investment"]):
            category = "TELEMARKETING"
            risk_score = max(risk_score, 0.65)
            flagged_phrases.append("unsolicited_commercial_offer")
        elif blocklisted or risk_score >= 0.71:
            category = "FINANCIAL_SCAM"
            risk_score = max(risk_score, 0.75)
        elif risk_score <= 0.30 and screening_info.purpose:
            category = "LEGITIMATE"
        else:
            category = "UNKNOWN"

        # 3. Determine Risk Level
        if risk_score <= 0.30:
            risk_level = "LOW"
        elif risk_score <= 0.70:
            risk_level = "UNCERTAIN"
        else:
            risk_level = "HIGH"

        # 4. Enforce Critical Safe Call Policy
        # Safe forward requires:
        # - LOW risk
        # - Caller purpose identified
        # - Caller name identified OR saved contact / allowlisted
        has_sufficient_evidence = bool(screening_info.purpose and (screening_info.caller_name or allowlisted))

        matching_reasons = [desc for kw, desc in SPAM_INDICATORS.items() if kw in text_lower]
        indicator_summary = " ".join(matching_reasons) if matching_reasons else None

        if risk_level == "HIGH" or blocklisted:
            recommended_action = "DO_NOT_FORWARD"
            # Dynamically auto-quarantine confirmed scam number for future zero-latency blocking
            if caller_number and risk_level == "HIGH":
                ml_spam_adapter.add_flagged_number(caller_number, category)

            reasoning = indicator_summary or (
                f"High threat score ({risk_score:.2f}) with category {category}. "
                f"Triggers: {', '.join(flagged_phrases[:3]) or 'Threat heuristic match'}."
            )
        elif allowlisted:
            recommended_action = "SAFE_TO_FORWARD"
            risk_level = "LOW"
            risk_score = min(risk_score, 0.10)
            reasoning = "Caller is in saved contacts (allowlisted). Safe to forward."
        elif risk_level == "LOW" and has_sufficient_evidence:
            recommended_action = "SAFE_TO_FORWARD"
            reasoning = (
                f"Low risk ({risk_score:.2f}) with verified identity ({screening_info.caller_name or 'Caller'}) "
                f"and legitimate purpose ('{screening_info.purpose}')."
            )
        else:
            # UNCERTAIN or insufficient screening evidence
            if screening_question_count < 3:
                recommended_action = "CONTINUE_SCREENING"
                reasoning = (
                    f"Risk is {risk_level} ({risk_score:.2f}) and caller purpose is not fully established. "
                    "Conducting follow-up screening question."
                )
            else:
                recommended_action = "REVIEW_REQUIRED"
                reasoning = (
                    f"Maximum screening questions reached with {risk_level} risk ({risk_score:.2f}). "
                    "Forwarding to voicemail/operator review."
                )

        return UnifiedRiskAssessment(
            risk_level=risk_level,
            risk_score=risk_score,
            category=category,
            flagged_phrases=list(set(flagged_phrases)),
            evidence=list(set(evidence)),
            reasoning=reasoning,
            recommended_action=recommended_action,
            screening_question_count=screening_question_count,
        )


hybrid_spam_engine = HybridSpamEngine()
