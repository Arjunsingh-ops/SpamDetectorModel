"""ML-Powered Multi-Signal Spam & Fraud Detection Engine Adapter."""

import os
from typing import Dict, Any, Optional
import pandas as pd
from app.integrations.spam.base import SpamDetectionAdapter
from app.core.config import settings
from app.core.logging import logger

try:
    import joblib
    HAS_JOBLIB = True
except ImportError:
    HAS_JOBLIB = False


class MLSpamDetectionAdapter(SpamDetectionAdapter):
    """
    Production ML-Enhanced Spam Detection Adapter.
    Integrates:
    - Pillar A: Known Spam Numbers CSV database lookup + carrier prefixes
    - Pillar B: Scikit-learn TF-IDF + Logistic Regression NLP model for conversational intent & keywords
    - Pillar C: Acoustic & behavioral audio metrics
    """

    KNOWN_SPAM_PREFIXES = ["+91140", "+919000000000", "+1800555"]
    FRAUD_KEYWORDS = [
        "otp", "kyc expired", "electricity bill", "power disconnect",
        "arrest warrant", "customs parcel", "cbi officer", "lottery prize",
        "aadhaar link", "free crypto", "instant loan approved", "bank details"
    ]

    def __init__(self, model_dir: Optional[str] = None):
        self.model_loaded = False
        self.model = None
        self.vectorizer = None
        self.spam_numbers_df = None
        self.known_spam_numbers = set()

        if model_dir is None:
            # Default to root spam-detector directory relative to backend
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "spam-detector"))
            model_dir = base_dir

        self.model_path = os.path.join(model_dir, "spam_model.pkl")
        self.vectorizer_path = os.path.join(model_dir, "tfidf_vectorizer.pkl")
        self.csv_path = os.path.join(model_dir, "spam_numbers.csv")

        self._load_artifacts()

    def _load_artifacts(self):
        # Load spam numbers CSV if available
        if os.path.exists(self.csv_path):
            try:
                df = pd.read_csv(self.csv_path)
                if "phone_number" in df.columns:
                    df["clean_number"] = (
                        df["phone_number"]
                        .astype(str)
                        .str.replace("+", "", regex=False)
                        .str.strip()
                    )
                    self.spam_numbers_df = df
                    self.known_spam_numbers = set(df["clean_number"])
                    logger.info(f"[MLSpamEngine] Loaded {len(self.known_spam_numbers)} spam numbers from CSV.")
            except Exception as e:
                logger.warning(f"[MLSpamEngine] Failed to load spam numbers CSV: {e}")

        # Load ML model & vectorizer if available
        if HAS_JOBLIB and os.path.exists(self.model_path) and os.path.exists(self.vectorizer_path):
            try:
                self.model = joblib.load(self.model_path)
                self.vectorizer = joblib.load(self.vectorizer_path)
                self.model_loaded = True
                logger.info("[MLSpamEngine] Successfully loaded ML model and TF-IDF vectorizer.")
            except Exception as e:
                logger.warning(f"[MLSpamEngine] Error loading ML model/vectorizer: {e}")
        else:
            logger.info("[MLSpamEngine] ML artifacts not found or joblib missing, falling back to heuristic ML mode.")

    def evaluate_call(
        self,
        caller_number: str,
        transcript: Optional[str] = None,
        audio_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        logger.info(f"[MLSpamEngine] Evaluating call risk for {caller_number}")
        clean_num = caller_number.replace("+", "").strip()

        # Pillar A: Reputation & Carrier Lookup (0-100)
        reputation_score = 0
        triggers = []

        if clean_num in self.known_spam_numbers:
            reputation_score = 95
            if self.spam_numbers_df is not None:
                match = self.spam_numbers_df[self.spam_numbers_df["clean_number"] == clean_num]
                if not match.empty:
                    cat = match.iloc[0].get("category", "spam")
                    reports = match.iloc[0].get("reports", 1)
                    triggers.append(f"db_spam_number:{cat}(reports={reports})")
                else:
                    triggers.append("db_spam_number")
            else:
                triggers.append("db_spam_number")
        elif any(caller_number.startswith(prefix) for prefix in self.KNOWN_SPAM_PREFIXES):
            reputation_score = 85
            triggers.append("known_telemarketer_or_spam_prefix")

        # Pillar B: Semantic & NLP ML Analysis (0-100)
        semantic_score = 0
        ml_confidence = 0.0

        if transcript:
            text_lower = transcript.lower()
            matched_keywords = [kw for kw in self.FRAUD_KEYWORDS if kw in text_lower]

            if self.model_loaded:
                try:
                    text_vec = self.vectorizer.transform([transcript])
                    pred = self.model.predict(text_vec)[0]
                    probs = self.model.predict_proba(text_vec)[0]

                    # Probability of class 1 (SPAM)
                    spam_prob = float(probs[1]) if len(probs) > 1 else float(pred)
                    ml_score = int(spam_prob * 100)
                    ml_confidence = max(probs)

                    # Combine ML model probability with keyword presence
                    if matched_keywords:
                        semantic_score = max(ml_score, min(95, 30 + len(matched_keywords) * 25))
                        triggers.extend([f"ml_spam_prob:{spam_prob:.2f}"] + [f"keyword:{kw}" for kw in matched_keywords])
                    else:
                        semantic_score = ml_score
                        if pred == 1:
                            triggers.append(f"ml_spam_model_detected (prob={spam_prob:.2f})")
                except Exception as e:
                    logger.warning(f"[MLSpamEngine] Inference error: {e}")
                    if matched_keywords:
                        semantic_score = min(95, 30 + len(matched_keywords) * 25)
                        triggers.extend([f"keyword:{kw}" for kw in matched_keywords])
            else:
                if matched_keywords:
                    semantic_score = min(95, 30 + len(matched_keywords) * 25)
                    triggers.extend([f"keyword:{kw}" for kw in matched_keywords])

        # Pillar C: Behavioral Analysis (0-100)
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
            rationale = f"High probability scam/spam detected. Triggers: {', '.join(triggers)}"
        elif composite >= settings.SPAM_THRESHOLD_UNCERTAIN:
            classification = "uncertain"
            rationale = f"Suspicious signals detected requiring interactive challenge. Triggers: {', '.join(triggers)}"
        else:
            classification = "legitimate"
            rationale = "No spam indicators detected; call verified for forwarding."

        confidence = float(ml_confidence) if ml_confidence > 0 else (0.95 if (classification in ["spam", "legitimate"]) else 0.70)

        return {
            "composite_score": composite,
            "reputation_score": reputation_score,
            "semantic_score": semantic_score,
            "behavioral_score": behavioral_score,
            "classification": classification,
            "confidence": round(confidence, 2),
            "detected_triggers": ", ".join(triggers) if triggers else "none",
            "ai_rationale": rationale,
            "engine": "MLSpamDetectionAdapter" if self.model_loaded else "HeuristicMLSpamDetectionAdapter"
        }


ml_spam_adapter = MLSpamDetectionAdapter()
