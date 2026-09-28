"""Voice AI Integration Adapters."""

from app.integrations.voice.base import VoiceAIAdapter
from app.integrations.voice.mock import MockVoiceAIAdapter

__all__ = ["VoiceAIAdapter", "MockVoiceAIAdapter"]
