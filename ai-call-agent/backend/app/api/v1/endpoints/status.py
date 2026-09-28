"""System Readiness and Diagnostic Status Endpoint."""

from datetime import datetime, timezone
from fastapi import APIRouter, status
from app.core.config import settings
from app.core.database import check_database_connection
from app.schemas.health import SystemStatusResponse, DatabaseStatus, AdapterStatus

router = APIRouter(tags=["Status"])


@router.get(
    "/status",
    response_model=SystemStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="System Status & Readiness Diagnostic",
    description="Inspects database connectivity, active telephony adapter mode, spam detection adapter mode, and runtime capabilities.",
)
async def get_system_status() -> SystemStatusResponse:
    is_db_connected, db_latency_ms, dialect = check_database_connection()

    return SystemStatusResponse(
        status="operational" if is_db_connected else "degraded",
        environment=settings.ENVIRONMENT,
        version=settings.APP_VERSION,
        timestamp=datetime.now(timezone.utc),
        database=DatabaseStatus(
            connected=is_db_connected,
            dialect=dialect,
            latency_ms=db_latency_ms,
        ),
        adapters={
            "telephony": AdapterStatus(
                provider=settings.TELEPHONY_PROVIDER,
                mode="mock_simulation" if settings.TELEPHONY_PROVIDER == "mock" else "live_carrier",
                ready=True,
                languages=["en-IN", "hi-IN"],
            ),
            "voice_ai": AdapterStatus(
                provider=settings.VOICE_AI_PROVIDER,
                mode="bilingual_simulation" if settings.VOICE_AI_PROVIDER == "mock" else "realtime_streaming",
                ready=True,
                languages=["en-IN", "hi-IN", "hinglish"],
            ),
            "spam_engine": AdapterStatus(
                provider=settings.SPAM_ENGINE_PROVIDER,
                mode="rule_based_heuristics" if settings.SPAM_ENGINE_PROVIDER == "mock" else "multi_signal_ml",
                ready=True,
                languages=["en-IN", "hi-IN"],
            ),
        },
        capabilities={
            "pstn_inbound": True,
            "bilingual_greeting": True,
            "intent_extraction": True,
            "multi_signal_spam_scoring": True,
            "call_forwarding": True,
            "human_in_the_loop_review": True,
            "carrier_kyc_validation": False,  # Future integration
        },
    )
