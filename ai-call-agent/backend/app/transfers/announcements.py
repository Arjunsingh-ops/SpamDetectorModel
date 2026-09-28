"""Warm Call Transfer TTS Announcement Generator."""

import logging
from typing import Dict, Optional

logger = logging.getLogger("ai_call_agent.transfers.announcements")


class WarmTransferAnnouncementGenerator:
    """Generates recipient warm call announcements in English and Hindi."""

    @staticmethod
    def generate_announcement(
        caller_name: Optional[str] = None,
        purpose: Optional[str] = None,
        department: Optional[str] = None,
        language: str = "en-IN",
    ) -> Dict[str, str]:
        name_str = caller_name or "an incoming caller"
        purpose_str = purpose or "a general inquiry"

        if "hi" in language.lower():
            text = (
                f"आपके पास {name_str} से {purpose_str} के संबंध में एक कॉल है। "
                f"स्वीकार करने के लिए 1 दबाएं या अस्वीकार करने के लिए 2 दबाएं।"
            )
        else:
            text = (
                f"You have an incoming call from {name_str} regarding {purpose_str}. "
                f"Press 1 to accept or 2 to decline."
            )

        return {
            "announcement_text": text,
            "language": language,
            "dtmf_prompt": "1: accept, 2: decline",
        }


warm_transfer_announcements = WarmTransferAnnouncementGenerator()
