"""Structured Intent and Slot Extractor."""

import re
from typing import Dict, Any

STOPWORDS_PATTERN = r"(?:\s+(?:and|i|from|regarding|to|with|for|hai|a|an|the|need|want)\b.*|$)"


class IntentExtractor:
    """Extracts entity slots: caller_name, purpose, target_person, urgency from conversation text."""

    @classmethod
    def extract_slots(cls, transcript: str) -> Dict[str, Any]:
        text_lower = transcript.lower()
        caller_name = None
        target_person = None
        urgency = "medium"
        purpose = "General Reception Inquiry"

        # Match caller name pattern "my name is X" or "i am X" or "mera naam X hai"
        name_match = re.search(r"(?:my name is|i am|mera naam|naam hai)\s+([a-zA-Z\.\s]{2,30})" + STOPWORDS_PATTERN, transcript, re.IGNORECASE)
        if name_match:
            raw_name = name_match.group(1).strip()
            words = raw_name.split()
            valid_words = []
            for w in words:
                if w.lower() in ["and", "i", "from", "regarding", "to", "with", "for", "hai", "a", "an", "the", "need", "want"]:
                    break
                valid_words.append(w)
            if valid_words:
                caller_name = " ".join(valid_words).title()

        # Match target person/dept pattern "speak to X" or "talk to X" or "transfer to X"
        target_match = re.search(r"(?:speak to|talk to|connect me with|transfer to|meet)\s+([a-zA-Z\.\s]{2,30})" + STOPWORDS_PATTERN, transcript, re.IGNORECASE)
        if target_match:
            raw_target = target_match.group(1).strip()
            words = raw_target.split()
            valid_words = []
            for w in words:
                if w.lower() in ["and", "i", "from", "regarding", "to", "with", "for", "hai", "a", "an", "the", "need", "want"]:
                    break
                valid_words.append(w)
            if valid_words:
                target_person = " ".join(valid_words).title()

        if "appointment" in text_lower or "doctor" in text_lower or "schedule" in text_lower:
            purpose = "Appointment Scheduling"
        elif "urgent" in text_lower or "emergency" in text_lower or "immediately" in text_lower:
            purpose = "Urgent Request"
            urgency = "high"
        elif "billing" in text_lower or "invoice" in text_lower or "payment" in text_lower:
            purpose = "Billing & Payments"

        return {
            "caller_name": caller_name,
            "purpose": purpose,
            "target_person": target_person,
            "urgency": urgency,
        }
