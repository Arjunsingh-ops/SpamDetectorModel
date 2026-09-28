"""Readiness Probe Endpoint."""

from datetime import datetime, timezone
from fastapi import APIRouter, Response, status
from app.core.config import settings
from app.core.database import check_database_connection

router = APIRouter(tags=["Readiness"])


@router.get(
    "/ready",
    status_code=status.HTTP_200_OK,
    summary="Service Readiness Probe",
    description="Readiness probe for Kubernetes / Render traffic ingress. Returns 200 if system is ready to accept traffic, 530 if degraded.",
)
async def readiness_probe(response: Response):
    is_db_connected, latency, dialect = check_database_connection()

    if not is_db_connected:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "ready": False,
            "reason": "Database connection offline",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    return {
        "ready": True,
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": {"connected": True, "latency_ms": latency, "dialect": dialect},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
