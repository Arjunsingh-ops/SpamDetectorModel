"""Explainable Risk Signal Attribution Engine."""

import logging
from typing import Dict, Any

logger = logging.getLogger("ai_call_agent.spam.explanations")


class RiskExplanationGenerator:
    """Generates structured, human-readable explainable rationale breakdown."""

    @staticmethod
    def generate_explanation(
        reputation_data: Dict[str, Any],
        semantic_data: Dict[str, Any],
        behavioral_data: Dict[str, Any],
        composite_score: int,
    ) -> Dict[str, Any]:
        observed_facts = []
        model_predictions = []
        historical_reports = []
        user_rules = []

        # Categorize reputation triggers
        for trigger in reputation_data.get("triggers", []):
            if "allowlist" in trigger or "blocklist" in trigger:
                user_rules.append(trigger)
            elif "historical" in trigger:
                historical_reports.append(trigger)
            else:
                observed_facts.append(trigger)

        # Categorize semantic triggers
        for trigger in semantic_data.get("indicators", []):
            if "prompt_injection" in trigger or "otp" in trigger:
                observed_facts.append(trigger)
            else:
                model_predictions.append(trigger)

        # Categorize behavioral triggers
        for trigger in behavioral_data.get("triggers", []):
            observed_facts.append(trigger)

        summary = (
            f"Composite Risk Score: {composite_score}/100. "
            f"Reputation: {reputation_data.get('score', 0)}%, "
            f"Semantics: {semantic_data.get('score', 0)}%, "
            f"Behavior: {behavioral_data.get('score', 0)}%. "
            f"Rationale: {semantic_data.get('explanation') or reputation_data.get('reason') or 'Standard evaluation.'}"
        )

        return {
            "summary": summary,
            "observed_facts": observed_facts,
            "model_predictions": model_predictions,
            "historical_reports": historical_reports,
            "user_rules": user_rules,
        }


risk_explanation_generator = RiskExplanationGenerator()
