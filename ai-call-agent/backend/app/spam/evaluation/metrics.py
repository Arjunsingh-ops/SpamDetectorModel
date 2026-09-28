"""Spam Classifier Evaluation Benchmark Metrics."""

import time
import logging
from typing import Dict, Any, List, Optional
from app.spam.engine import hybrid_spam_engine
from app.spam.evaluation.dataset import SYNTHETIC_EVAL_DATASET

logger = logging.getLogger("ai_call_agent.spam.evaluation.metrics")


class SpamEvaluator:
    """Evaluates hybrid spam classification precision, recall, F1 score, and latency metrics."""

    def evaluate(self, dataset: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        return self.run_benchmark(dataset)

    @staticmethod
    def run_benchmark(dataset: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        eval_data = dataset or SYNTHETIC_EVAL_DATASET

        tp, fp, fn, tn = 0, 0, 0, 0
        total_latency_ms = 0.0
        lang_latency: Dict[str, List[float]] = {"en-IN": [], "hi-IN": [], "mixed": []}

        for item in eval_data:
            start_t = time.perf_counter()
            res = hybrid_spam_engine.evaluate_call(
                caller_number=item["caller_number"],
                transcript=item["transcript"],
                use_llm=False,  # Deterministic benchmark mode
            )
            elapsed_ms = (time.perf_counter() - start_t) * 1000.0
            total_latency_ms += elapsed_ms

            lang = item.get("language", "en-IN")
            if lang in lang_latency:
                lang_latency[lang].append(elapsed_ms)

            actual_scam = item["ground_truth_category"] in ["suspected_scam", "suspected_spam", "marketing"]
            pred_scam = res["risk_category"] in ["HIGH", "UNCERTAIN"] or res["classification"] in ["spam", "uncertain"]

            if actual_scam and pred_scam:
                tp += 1
            elif not actual_scam and pred_scam:
                fp += 1
            elif actual_scam and not pred_scam:
                fn += 1
            else:
                tn += 1

        precision = tp / (tp + fp) if (tp + fp) > 0 else 1.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 1.0
        f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        fp_rate = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        fn_rate = fn / (fn + tp) if (fn + tp) > 0 else 0.0
        avg_latency = round(total_latency_ms / len(eval_data), 2) if eval_data else 0.0

        lang_averages = {}
        for lang_code, times in lang_latency.items():
            lang_averages[lang_code] = round(sum(times) / len(times), 2) if times else 0.0

        results = {
            "total_samples": len(eval_data),
            "true_positives": tp,
            "false_positives": fp,
            "false_negatives": fn,
            "true_negatives": tn,
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1_score, 4),
            "false_positive_rate": round(fp_rate, 4),
            "false_negative_rate": round(fn_rate, 4),
            "average_latency_ms": avg_latency,
            "latency_by_language_ms": lang_averages,
            "confusion_matrix": {"TP": tp, "FP": fp, "FN": fn, "TN": tn},
        }

        logger.info(f"Completed Spam Evaluation: F1={results['f1_score']}, Precision={results['precision']}, Latency={avg_latency}ms")
        return results


spam_evaluator = SpamEvaluator()
