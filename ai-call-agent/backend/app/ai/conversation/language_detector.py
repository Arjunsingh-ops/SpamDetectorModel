"""Bilingual Language Classifier (English, Hindi, Hinglish)."""

import re
from typing import Dict, Any


class LanguageDetector:
    """Classifies spoken or transcribed text into en-IN, hi-IN, or mixed (Hinglish)."""

    HINDI_DEVANAGARI_REGEX = re.compile(r"[\u0900-\u097F]")
    HINDI_KEYWORD_PATTERNS = [
        "namaste", "aap", "ji", "kaise", "hain", "kya", "bataiye", "sahayata",
        "shukriya", "dhanyavaad", "ha", "nahi", "samajh", "kripya"
    ]

    @classmethod
    def detect_language(cls, text: str) -> Dict[str, Any]:
        if not text:
            return {"language": "en-IN", "confidence": 1.0}

        # Devanagari script check
        if cls.HINDI_DEVANAGARI_REGEX.search(text):
            return {"language": "hi-IN", "confidence": 0.98, "script": "devanagari"}

        # Transliterated Hindi / Hinglish keyword check
        text_lower = text.lower()
        hindi_count = sum(1 for kw in cls.HINDI_KEYWORD_PATTERNS if kw in text_lower)

        if hindi_count >= 2:
            return {"language": "mixed", "confidence": 0.85, "script": "latin_hinglish"}
        elif hindi_count == 1:
            return {"language": "hi-IN", "confidence": 0.75, "script": "latin"}

        return {"language": "en-IN", "confidence": 0.95, "script": "latin"}
