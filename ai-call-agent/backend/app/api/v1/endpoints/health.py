"""Public Health Liveness Endpoint."""

from datetime import datetime, timezone
from fastapi import APIRouter, status
from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Application Liveness Probe",
    description="Deterministic liveness probe for orchestrators (Render, K8s, Docker). Does NOT require database or external API credentials.",
)
async def get_health() -> HealthResponse:
    """Return 200 OK liveness status without touching external dependencies."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc),
        service=settings.APP_NAME,
        version=settings.APP_VERSION,
    )
