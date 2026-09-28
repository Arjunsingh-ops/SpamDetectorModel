"""Analytics and Telemetry Endpoints."""

from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import RequireRole
from app.analytics.aggregation import AnalyticsAggregationEngine
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics & Telemetry"])


@router.get("/overview", summary="Get Overview KPI Analytics")
def get_analytics_overview(
    period: str = Query("today", description="Period: today | yesterday | 7d | 30d | this_month | previous_month | custom"),
    time_zone: str = Query("Asia/Kolkata", description="Target reporting time zone"),
    department: Optional[str] = Query(None, description="Filter by department"),
    call_source: Optional[str] = Query(None, description="Filter by call source: real | simulated"),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    engine = AnalyticsAggregationEngine(db)
    owner_filter = None if current_user.role == "admin" else current_user.id
    return engine.get_period_analytics(
        period_type=period,
        time_zone=time_zone,
        owner_user_id=owner_filter,
        department=department,
        call_source=call_source,
    )


@router.get("/daily", summary="Get Daily Hourly Volume Distribution")
def get_daily_analytics(
    time_zone: str = Query("Asia/Kolkata", description="Target reporting time zone"),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    engine = AnalyticsAggregationEngine(db)
    owner_filter = None if current_user.role == "admin" else current_user.id
    return engine.get_period_analytics(
        period_type="today",
        time_zone=time_zone,
        owner_user_id=owner_filter,
    )


@router.get("/call-volume", summary="Get Call Volume Trend Analytics")
def get_call_volume_analytics(
    period: str = Query("7d"),
    time_zone: str = Query("Asia/Kolkata"),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    engine = AnalyticsAggregationEngine(db)
    owner_filter = None if current_user.role == "admin" else current_user.id
    res = engine.get_period_analytics(period_type=period, time_zone=time_zone, owner_user_id=owner_filter)
    return {
        "period": period,
        "totalCalls": res["metrics"]["totalCalls"],
        "hourlyVolume": res["hourlyVolume"],
    }


@router.get("/call-outcomes", summary="Get Call Outcome Breakdown")
def get_call_outcomes_analytics(
    period: str = Query("today"),
    time_zone: str = Query("Asia/Kolkata"),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    engine = AnalyticsAggregationEngine(db)
    owner_filter = None if current_user.role == "admin" else current_user.id
    res = engine.get_period_analytics(period_type=period, time_zone=time_zone, owner_user_id=owner_filter)
    m = res["metrics"]
    return {
        "answered": m["answeredCalls"],
        "missed": m["missedCalls"],
        "abandoned": m["abandonedCalls"],
        "completed": m["completedCalls"],
        "failed": m["failedCalls"],
    }


@router.get("/spam", summary="Get Spam Screening Telemetry")
def get_spam_analytics(
    period: str = Query("today"),
    time_zone: str = Query("Asia/Kolkata"),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    engine = AnalyticsAggregationEngine(db)
    owner_filter = None if current_user.role == "admin" else current_user.id
    res = engine.get_period_analytics(period_type=period, time_zone=time_zone, owner_user_id=owner_filter)
    m = res["metrics"]
    return {
        "screened": m["screenedByAi"],
        "flagged": m["flaggedForReview"],
        "blocked": m["spamCallsBlocked"],
        "confirmedSpam": m["confirmedSpamCalls"],
        "confirmedLegitimate": m["confirmedLegitimateCalls"],
        "pendingReviews": m["pendingSpamReviews"],
    }


@router.get("/transfers", summary="Get Transfer & Forwarding Outcomes")
def get_transfers_analytics(
    period: str = Query("today"),
    time_zone: str = Query("Asia/Kolkata"),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    engine = AnalyticsAggregationEngine(db)
    owner_filter = None if current_user.role == "admin" else current_user.id
    res = engine.get_period_analytics(period_type=period, time_zone=time_zone, owner_user_id=owner_filter)
    m = res["metrics"]
    return {
        "attempts": m["transferAttempts"],
        "successful": m["successfulTransfers"],
        "declined": m["declinedTransfers"],
        "unanswered": m["unansweredTransfers"],
        "failed": m["failedTransfers"],
        "successRate": m["forwardingSuccessRate"],
        "departments": res["departments"],
    }


@router.get("/recipients", summary="Get Recipient & Department Analytics")
def get_recipients_analytics(
    period: str = Query("today"),
    time_zone: str = Query("Asia/Kolkata"),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    engine = AnalyticsAggregationEngine(db)
    res = engine.get_period_analytics(period_type=period, time_zone=time_zone)
    return {
        "departments": res["departments"],
        "recipients": res["recipients"],
    }


@router.get("/voicemail", summary="Get Voicemail Analytics")
def get_voicemail_analytics(
    period: str = Query("today"),
    time_zone: str = Query("Asia/Kolkata"),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    engine = AnalyticsAggregationEngine(db)
    res = engine.get_period_analytics(period_type=period, time_zone=time_zone)
    return {
        "voicemailCount": res["metrics"]["voicemailCount"],
    }


@router.get("/callbacks", summary="Get Callback Requests Analytics")
def get_callbacks_analytics(
    period: str = Query("today"),
    time_zone: str = Query("Asia/Kolkata"),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    engine = AnalyticsAggregationEngine(db)
    res = engine.get_period_analytics(period_type=period, time_zone=time_zone)
    m = res["metrics"]
    return {
        "pending": m["pendingCallbacks"],
        "completed": m["completedCallbacks"],
    }
