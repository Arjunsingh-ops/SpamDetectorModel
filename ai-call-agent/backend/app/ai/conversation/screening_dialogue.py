"""
Bilingual AI Screening Dialogue Engine and Prompt Injection Shield.

Conducts receptionist screening questions, extracts structured entity slots,
detects language, protects against prompt injection attacks, and prepares human-forwarding context.
"""

import re
import logging
from typing import Dict, Any, Optional, Tuple
from app.schemas.screening import ExtractedScreeningInfo, PersonalAssistantSettings

logger = logging.getLogger("ai_call_agent.ai.conversation.screening_dialogue")


# Prompt Injection / Adversarial Override Patterns
PROMPT_INJECTION_PATTERNS = [
    r"\b(?:ignore|forget|disregard)\s+(?:all\s+)?(?:previous|prior|system)\s+(?:instructions|prompts|rules)\b",
    r"\byou\s+are\s+now\s+(?:an?\s+)?(?:unrestricted|admin|operator|developer)\b",
    r"\boverride\s+(?:safety|screening|transfer|protocol)\b",
    r"\btransfer\s+me\s+(?:immediately|now|directly)\s+without\s+asking\b",
    r"\bsudo\s+connect\b",
    r"\bsystem\s+command\b",
]


class ScreeningDialogueEngine:
    """Manages bilingual phone screening conversation turns and slot extraction."""

    def __init__(self, settings: Optional[PersonalAssistantSettings] = None):
        self.settings = settings or PersonalAssistantSettings()

    def generate_initial_greeting(self, language: str = "en-IN") -> str:
        """Generate greeting tailored to language and user name."""
        user_name = self.settings.user_name

        if "hi" in language.lower():
            return f"नमस्ते, आप {user_name} के AI assistant से जुड़े हैं। कृपया अपना नाम और कॉल करने का कारण बताइए।"
        elif "hinglish" in language.lower() or "mix" in language.lower():
            return f"Hello, main {user_name} ka AI assistant hoon. Aap apna naam aur call karne ka reason bata sakte hain?"
        else:
            return f"Hello, you've reached {user_name}'s AI assistant. May I know who's calling and what this is regarding?"

    def generate_followup_question(self, question_number: int, language: str = "en-IN") -> str:
        """Generate a neutral, polite follow-up screening question."""
        user_name = self.settings.user_name
        is_hindi = "hi" in language.lower()

        if question_number == 1:
            if is_hindi:
                return "क्या आप बता सकते हैं कि यह कॉल किस काम से संबंधित है?"
            return "Could you tell me a little more about the reason for the call?"
        elif question_number == 2:
            if is_hindi:
                return f"धन्यवाद। क्या आप अपनी संस्था या कंपनी का नाम बता सकते हैं ताकि मैं {user_name} को सूचित कर सकूँ?"
            return f"Thank you. Could you mention your organization or affiliation so I can notify {user_name}?"
        else:
            if is_hindi:
                return f"मैं {user_name} की उपलब्धता जाँच रहा हूँ, कृपया एक क्षण प्रतीक्षा करें।"
            return f"Thanks, let me check if {user_name} is available to take this call."

    def check_prompt_injection(self, text: str) -> Tuple[bool, Optional[str]]:
        """Identify adversarial prompt injection attempts aiming to bypass screening."""
        lower = text.lower()
        for pattern in PROMPT_INJECTION_PATTERNS:
            if re.search(pattern, lower, re.IGNORECASE):
                logger.warning(f"[Security] Detected prompt injection pattern in caller speech: {pattern}")
                return True, f"Adversarial instruction override attempt detected: {pattern}"
        return False, None

    def extract_screening_info(self, transcript: str) -> ExtractedScreeningInfo:
        """
        Deterministically extract caller_name, organization, purpose,
        department, urgency, and requested action from transcript.
        """
        text_lower = transcript.lower()

        # 1. Caller Name Extraction
        caller_name = None
        name_patterns = [
            r"(?:this is|i'm|i am|my name is|mera naam)\s+([a-zA-Z]{2,15}(?:\s+[a-zA-Z]{2,15})?)(?:\s+(?:from|calling|regarding|and|with|here|ka|ki|se|bol)\b|[,\.\?]|\s*$)",
            r"(?:hi|hello),?\s+(?:this is|i'm|i am)\s+([a-zA-Z]{2,15}(?:\s+[a-zA-Z]{2,15})?)(?:\s+(?:from|calling|regarding|and|with|here|ka|ki|se|bol)\b|[,\.\?]|\s*$)",
        ]
        for pat in name_patterns:
            m = re.search(pat, transcript, re.IGNORECASE)
            if m:
                candidate = m.group(1).strip()
                cleaned_words = [w for w in candidate.split() if w.lower() not in {"from", "regarding", "calling", "here", "and", "the", "a", "an", "at", "for", "with"}]
                if cleaned_words:
                    caller_name = " ".join(cleaned_words).title()
                    break

        # 2. Organization / Affiliation Extraction
        organization = None
        org_patterns = [
            r"(?:from|representing|working with|working at|se hoon|se bol raha hoon)\s+([a-zA-Z0-9\s]{2,35})(?:\s+(?:team|office|branch|department|calling|regarding|about)\b|$)",
        ]
        for pat in org_patterns:
            m = re.search(pat, transcript, re.IGNORECASE)
            if m:
                raw_org = m.group(1).strip()
                cleaned_words = [w for w in raw_org.split() if w.lower() not in {"and", "i", "to", "regarding", "calling"}]
                if cleaned_words:
                    organization = " ".join(cleaned_words).title()
                    break

        # 3. Purpose Extraction
        purpose = None
        purpose_patterns = [
            r"(?:calling (?:about|regarding|for)|regarding|call karne ka reason|baat karni hai)\s+([a-zA-Z0-9\s\.\-]{3,60})",
            r"(?:wanted to discuss|want to discuss|discussing)\s+([a-zA-Z0-9\s\.\-]{3,60})",
        ]
        for pat in purpose_patterns:
            m = re.search(pat, transcript, re.IGNORECASE)
            if m:
                raw_purpose = m.group(1).strip()
                if raw_purpose:
                    purpose = raw_purpose.capitalize()
                    break

        # Fallback keyword-based purpose heuristic if explicit syntax missing
        if not purpose:
            if "project" in text_lower or "presentation" in text_lower or "assignment" in text_lower:
                purpose = "College project and presentation discussion"
            elif "delivery" in text_lower or "courier" in text_lower or "package" in text_lower or "parcel" in text_lower:
                purpose = "Delivery package coordination"
            elif "doctor" in text_lower or "appointment" in text_lower or "clinic" in text_lower:
                purpose = "Medical / Appointment scheduling"
            elif "interview" in text_lower or "resume" in text_lower or "job" in text_lower:
                purpose = "Job opportunity / interview coordination"
            elif "meeting" in text_lower or "schedule" in text_lower:
                purpose = "Meeting scheduling"

        # 4. Department
        department = "General"
        if any(w in text_lower for w in ["support", "issue", "bug", "broken", "help"]):
            department = "Support"
        elif any(w in text_lower for w in ["sales", "pricing", "cost", "quote", "buy"]):
            department = "Sales"
        elif any(w in text_lower for w in ["billing", "invoice", "payment", "fee"]):
            department = "Billing"
        elif any(w in text_lower for w in ["project", "college", "team", "presentation", "tech"]):
            department = "Personal / Project"

        # 5. Stated Identity
        stated_identity = None
        if "project team" in text_lower or "teammate" in text_lower:
            stated_identity = "Teammate / Project Collaborator"
        elif "courier" in text_lower or "delivery" in text_lower:
            stated_identity = "Delivery Personnel"
        elif "friend" in text_lower or "colleague" in text_lower:
            stated_identity = "Friend / Colleague"

        # 6. Urgency & Flags
        urgency = "medium"
        if any(w in text_lower for w in ["urgent", "emergency", "immediately", "asap", "jaldi"]):
            urgency = "high"
        elif any(w in text_lower for w in ["whenever free", "no rush", "free time"]):
            urgency = "low"

        human_requested = any(w in text_lower for w in ["speak to arjun", "connect to arjun", "human", "talk to him", "transfer me"])
        callback_requested = any(w in text_lower for w in ["call me back", "callback", "waapis call"])

        # Language Detection
        detected_lang = "en-IN"
        if any(w in text_lower for w in ["namaste", "aap", "kaise", "hai", "karo", "bol raha", "hoon"]):
            detected_lang = "hi-IN" if ("hai" in text_lower and "se" in text_lower and "nahi" in text_lower) else "hinglish"

        return ExtractedScreeningInfo(
            caller_name=caller_name,
            organization=organization,
            purpose=purpose,
            department=department,
            urgency=urgency,
            language=detected_lang,
            callback_requested=callback_requested,
            human_requested=human_requested,
            stated_identity=stated_identity,
            requested_action="call_transfer" if human_requested else "discussion",
        )


screening_dialogue_engine = ScreeningDialogueEngine()
