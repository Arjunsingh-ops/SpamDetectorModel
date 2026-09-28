"""Pydantic Schemas Package."""

from app.schemas.common import BaseSchema, IdentifiableSchema, PaginatedResponse, MessageResponse
from app.schemas.health import HealthResponse, SystemStatusResponse, DatabaseStatus, AdapterStatus
from app.schemas.call import (
    CallBase,
    CallResponse,
    CallDetailResponse,
    CallEventResponse,
    InboundWebhookPayload,
    WebhookActionResponse,
)
from app.schemas.spam import (
    SpamAssessmentResponse,
    SpamReviewRequest,
    SpamReviewResponse,
)

__all__ = [
    "BaseSchema",
    "IdentifiableSchema",
    "PaginatedResponse",
    "MessageResponse",
    "HealthResponse",
    "SystemStatusResponse",
    "DatabaseStatus",
    "AdapterStatus",
    "CallBase",
    "CallResponse",
    "CallDetailResponse",
    "CallEventResponse",
    "InboundWebhookPayload",
    "WebhookActionResponse",
    "SpamAssessmentResponse",
    "SpamReviewRequest",
    "SpamReviewResponse",
]
