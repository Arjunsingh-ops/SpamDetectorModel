"""API Version 1 Master Router."""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    ready,
    status,
    calls,
    spam,
    auth,
    users,
    analytics,
    settings as user_settings,
    metrics,
    recipients,
    routing,
    transfers,
    voicemail,
    callbacks,
    reports,
    report_schedules,
)
from app.api.v1 import telephony, call_events, voice, voice_profiles, conversations, voice_transcribe

api_v1_router = APIRouter()

api_v1_router.include_router(health.router)
api_v1_router.include_router(ready.router)
api_v1_router.include_router(status.router)
api_v1_router.include_router(calls.router)
api_v1_router.include_router(spam.router)
api_v1_router.include_router(auth.router)
api_v1_router.include_router(users.router)
api_v1_router.include_router(analytics.router)
api_v1_router.include_router(user_settings.router)
api_v1_router.include_router(metrics.router)
api_v1_router.include_router(telephony.router)
api_v1_router.include_router(call_events.router)
api_v1_router.include_router(voice.router)
api_v1_router.include_router(voice_profiles.router)
api_v1_router.include_router(conversations.router)
api_v1_router.include_router(voice_transcribe.router)
api_v1_router.include_router(recipients.router)
api_v1_router.include_router(routing.router)
api_v1_router.include_router(transfers.router)
api_v1_router.include_router(voicemail.router)
api_v1_router.include_router(callbacks.router)
api_v1_router.include_router(reports.router)
api_v1_router.include_router(report_schedules.router)

