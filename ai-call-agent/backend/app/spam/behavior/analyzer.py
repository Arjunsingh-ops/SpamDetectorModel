"""Call Behavior Pattern Analyzer."""

import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.spam.behavior.rate_monitor import call_rate_monitor

logger = logging.getLogger("ai_call_agent.spam.behavior.analyzer")


class BehaviorAnalyzer:
    """Analyzes behavioral attributes: call frequency, burst rate, short call repeats."""

    @staticmethod
    def evaluate_behavior(
        caller_number: str,
        duration_seconds: int = 0,
        db_session: Optional[Session] = None,
    ) -> Dict[str, Any]:
        burst_exceeded, call_count, score_penalty = call_rate_monitor.record_and_check_burst(caller_number)

        triggers = []
        if burst_exceeded:
            triggers.append(f"burst_frequency_exceeded_{call_count}_calls_5min")
        elif call_count > 2:
            triggers.append(f"repeated_calls_count_{call_count}")

        return {
            "score": score_penalty,
            "call_count_5min": call_count,
            "burst_exceeded": burst_exceeded,
            "triggers": triggers,
        }


behavior_analyzer = BehaviorAnalyzer()
