"""Spam Engine Integration Adapters."""

from app.integrations.spam.base import SpamDetectionAdapter
from app.integrations.spam.mock import MockSpamDetectionAdapter
from app.integrations.spam.ml_engine import MLSpamDetectionAdapter

__all__ = ["SpamDetectionAdapter", "MockSpamDetectionAdapter", "MLSpamDetectionAdapter"]

