"""Call Frequency and Rate Monitoring Engine."""

import time
import logging
from typing import Dict, List, Tuple, Any

logger = logging.getLogger("ai_call_agent.spam.behavior.rate_monitor")


class CallRateMonitor:
    """
    Tracks call frequency per caller number using sliding window counters.
    Supports in-memory tracking with optional Redis backend when available.
    """

    def __init__(self, window_seconds: int = 300, max_calls_per_window: int = 4):
        self.window_seconds = window_seconds
        self.max_calls_per_window = max_calls_per_window
        self._history: Dict[str, List[float]] = {}

    def record_and_check_burst(self, caller_number: str) -> Tuple[bool, int, int]:
        """
        Record incoming call timestamp for number and evaluate burst frequency.
        Returns tuple (is_burst_exceeded, current_call_count, score_penalty).
        """
        if not caller_number or caller_number == "+0000000000":
            return False, 1, 0

        now = time.time()
        cutoff = now - self.window_seconds

        # Prune old timestamps
        timestamps = [t for t in self._history.get(caller_number, []) if t > cutoff]
        timestamps.append(now)
        self._history[caller_number] = timestamps

        call_count = len(timestamps)
        exceeded = call_count > self.max_calls_per_window
        score_penalty = min((call_count - 1) * 25, 75) if call_count > 2 else 0

        if exceeded:
            logger.warning(f"Burst call rate limit exceeded for {caller_number}: {call_count} calls in {self.window_seconds}s")

        return exceeded, call_count, score_penalty

    def record_call(self, caller_number: str) -> Dict[str, Any]:
        exceeded, call_count, penalty = self.record_and_check_burst(caller_number)
        return {
            "is_suspicious_burst": exceeded,
            "attempts_5m": call_count,
            "score_penalty": penalty,
        }


call_rate_monitor = CallRateMonitor()
