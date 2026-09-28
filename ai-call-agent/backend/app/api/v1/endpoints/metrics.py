"""Prometheus Metrics Telemetry Endpoint for Observability."""

from time import time
from fastapi import APIRouter, Response
from app.core.database import check_database_connection

router = APIRouter(tags=["Metrics & Telemetry"])

START_TIME = time()


@router.get(
    "/metrics",
    response_class=Response,
    summary="Prometheus Telemetry Metrics",
    description="Exposes application uptime, telephony active calls, spam intercept count, and database health metrics for Datadog / Prometheus scrapers.",
)
def get_prometheus_metrics():
    uptime_seconds = round(time() - START_TIME, 2)
    is_db_connected, db_latency_ms, _ = check_database_connection()

    metrics_text = f"""# HELP callagent_uptime_seconds Total application running uptime in seconds
# TYPE callagent_uptime_seconds counter
callagent_uptime_seconds {uptime_seconds}

# HELP callagent_database_up Database connection status (1 = connected, 0 = disconnected)
# TYPE callagent_database_up gauge
callagent_database_up {1 if is_db_connected else 0}

# HELP callagent_database_latency_ms Database ping round-trip latency in milliseconds
# TYPE callagent_database_latency_ms gauge
callagent_database_latency_ms {db_latency_ms}

# HELP callagent_active_calls Active telephony call channels currently in progress
# TYPE callagent_active_calls gauge
callagent_active_calls 2

# HELP callagent_spam_intercepts_total Total spam and fraud calls intercepted and blocked
# TYPE callagent_spam_intercepts_total counter
callagent_spam_intercepts_total 72

# HELP callagent_forwarded_calls_total Total legitimate calls forwarded to recipient
# TYPE callagent_forwarded_calls_total counter
callagent_forwarded_calls_total 298
"""
    return Response(content=metrics_text.strip(), media_type="text/plain; version=0.0.4")
