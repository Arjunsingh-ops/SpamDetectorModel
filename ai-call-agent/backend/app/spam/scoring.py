"""Multi-Factor Composite Risk Scoring Engine."""

import logging
from typing import Dict, Any

logger = logging.getLogger("ai_call_agent.spam.scoring")


class RiskScoringEngine:
    """
    Aggregates multi-signal risk scores:
    - Pillar A: Reputation & Metadata (40%)
    - Pillar B: Semantic & Conversation Triggers (50%)
    - Pillar C: Behavioral & Frequency Patterns (10%)
    """

    @staticmethod
    def calculate_composite_score(
        reputation_score: int,
        semantic_score: int,
        behavioral_score: int,
        allowlisted: bool = False,
        blocklisted: bool = False,
    ) -> Dict[str, Any]:
        if allowlisted:
            return {
                "composite_score": 0,
                "reputation_score": 0,
                "semantic_score": 0,
                "behavioral_score": 0,
                "override": "allowlist",
            }

        if blocklisted:
            return {
                "composite_score": 100,
                "reputation_score": 100,
                "semantic_score": 100,
                "behavioral_score": 100,
                "override": "blocklist",
            }

        # Weighted calculation
        score = int(
            (reputation_score * 0.40) +
            (semantic_score * 0.50) +
            (behavioral_score * 0.10)
        )
        score = min(max(score, 0), 100)

        return {
            "composite_score": score,
            "reputation_score": reputation_score,
            "semantic_score": semantic_score,
            "behavioral_score": behavioral_score,
            "override": None,
        }


risk_scoring_engine = RiskScoringEngine()
