"""Hybrid Spam & Fraud Detection Engine Master Orchestrator."""

import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.spam.reputation.local_provider import local_reputation_provider
from app.spam.classifiers.rule_based import rule_based_spam_classifier
from app.spam.classifiers.llm_classifier import llm_spam_classifier
from app.spam.behavior.analyzer import behavior_analyzer
from app.spam.scoring import risk_scoring_engine
from app.spam.policy import screening_policy_engine
from app.spam.explanations import risk_explanation_generator

logger = logging.getLogger("ai_call_agent.spam.engine")


class HybridSpamEngine:
    """
    Production Hybrid Spam Engine combining Caller Reputation, Lexical/LLM Semantics,
    and Call Behavior into explainable risk assessments.
    """

    def evaluate_call(
        self,
        caller_number: str,
        transcript: str = "",
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        duration_seconds: int = 0,
        db_session: Optional[Session] = None,
        use_llm: bool = True,
    ) -> Dict[str, Any]:
        """
        Evaluate full multi-factor spam risk assessment.
        Returns complete assessment dict with composite_score, risk_category, explanation, policy.
        """
        history = conversation_history or []

        # 1. Pillar A: Reputation Analysis
        rep_res = local_reputation_provider.evaluate_reputation(caller_number, db_session)

        # 2. Pillar B: Semantic & Conversation Analysis
        if use_llm:
            sem_res = llm_spam_classifier.classify_transcript(transcript, history)
        else:
            sem_res = rule_based_spam_classifier.classify_transcript(transcript, history)

        # 3. Pillar C: Behavior & Frequency Analysis
        beh_res = behavior_analyzer.evaluate_behavior(caller_number, duration_seconds, db_session)

        # 4. Multi-Signal Scoring Aggregation
        score_res = risk_scoring_engine.calculate_composite_score(
            reputation_score=rep_res["score"],
            semantic_score=sem_res["score"],
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

        all_triggers = list(set(rep_res["triggers"] + sem_res["indicators"] + beh_res["triggers"]))

        return {
            "composite_score": composite_score,
            "reputation_score": score_res["reputation_score"],
            "semantic_score": score_res["semantic_score"],
            "behavioral_score": score_res["behavioral_score"],
            "classification": policy_res["classification"],
            "risk_category": policy_res["risk_category"],
            "recommended_action": policy_res["recommended_action"],
            "confidence": sem_res.get("confidence", 0.9),
            "detected_triggers": ",".join(all_triggers),
            "evidence_segments": sem_res.get("evidence_segments", []),
            "explanation": explanation_res["summary"],
            "explainable_breakdown": explanation_res,
            "policy": policy_res,
            "model_version": "v2.0.0-hybrid_multi_factor",
        }


hybrid_spam_engine = HybridSpamEngine()
