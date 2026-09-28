"""Spam Engine Integration Adapters."""

from app.integrations.spam.base import SpamDetectionAdapter
from app.integrations.spam.mock import MockSpamDetectionAdapter

__all__ = ["SpamDetectionAdapter", "MockSpamDetectionAdapter"]
