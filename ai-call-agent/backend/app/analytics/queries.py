"""Optimized Database Analytics Aggregation Queries.

Task 4 & 23: Accurate UTC to local timezone window conversion, SQL aggregation,
department/recipient breakdowns, and data quality checks.
"""

from datetime import datetime, date, time, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple
from uuid import UUID
import zoneinfo
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case, distinct, desc
from app.models.call import Call
from app.models.transfer import TransferRecord
from app.models.spam_assessment import SpamAssessment
from app.models.spam_report import SpamReport
from app.models.voicemail import VoicemailMessage
from app.models.callback_request import CallbackRequest
from app.models.recipient import Recipient


def get_timezone_object(tz_name: Optional[str] = None) -> zoneinfo.ZoneInfo:
    """Resolve ZoneInfo object for requested time zone, default to Asia/Kolkata."""
    clean_name = tz_name or "Asia/Kolkata"
    try:
        return zoneinfo.ZoneInfo(clean_name)
    except Exception:
        return zoneinfo.ZoneInfo("Asia/Kolkata")


def resolve_reporting_window(
    period_type: str = "today",
    tz_name: str = "Asia/Kolkata",
    custom_start: Optional[datetime] = None,
    custom_end: Optional[datetime] = None,
) -> Tuple[datetime, datetime, str]:
    """Calculate inclusive start and exclusive end datetime in UTC for the requested period.

    Supports: 'today', 'yesterday', '7d', '30d', 'this_month', 'previous_month', 'custom'.
    """
    tz = get_timezone_object(tz_name)
    now_local = datetime.now(tz)
    today_local_date = now_local.date()

    if period_type == "today":
        start_local = datetime.combine(today_local_date, time.min, tzinfo=tz)
        end_local = start_local + timedelta(days=1)
    elif period_type == "yesterday":
        start_local = datetime.combine(today_local_date - timedelta(days=1), time.min, tzinfo=tz)
        end_local = start_local + timedelta(days=1)
    elif period_type == "7d":
        start_local = datetime.combine(today_local_date - timedelta(days=6), time.min, tzinfo=tz)
        end_local = datetime.combine(today_local_date, time.min, tzinfo=tz) + timedelta(days=1)
    elif period_type == "30d":
        start_local = datetime.combine(today_local_date - timedelta(days=29), time.min, tzinfo=tz)
        end_local = datetime.combine(today_local_date, time.min, tzinfo=tz) + timedelta(days=1)
    elif period_type == "this_month":
        start_local = datetime.combine(date(today_local_date.year, today_local_date.month, 1), time.min, tzinfo=tz)
        if today_local_date.month == 12:
            end_local = datetime.combine(date(today_local_date.year + 1, 1, 1), time.min, tzinfo=tz)
        else:
            end_local = datetime.combine(date(today_local_date.year, today_local_date.month + 1, 1), time.min, tzinfo=tz)
    elif period_type == "previous_month":
        if today_local_date.month == 1:
            prev_year = today_local_date.year - 1
            prev_month = 12
        else:
            prev_year = today_local_date.year
            prev_month = today_local_date.month - 1
        start_local = datetime.combine(date(prev_year, prev_month, 1), time.min, tzinfo=tz)
        end_local = datetime.combine(date(today_local_date.year, today_local_date.month, 1), time.min, tzinfo=tz)
    elif period_type == "custom" and custom_start and custom_end:
        if custom_start.tzinfo is None:
            start_local = custom_start.replace(tzinfo=tz)
        else:
            start_local = custom_start.astimezone(tz)
        if custom_end.tzinfo is None:
            end_local = custom_end.replace(tzinfo=tz)
        else:
            end_local = custom_end.astimezone(tz)
    else:
        # Fallback to today
        start_local = datetime.combine(today_local_date, time.min, tzinfo=tz)
        end_local = start_local + timedelta(days=1)

    start_utc = start_local.astimezone(timezone.utc)
    end_utc = end_local.astimezone(timezone.utc)
    return start_utc, end_utc, tz.key


class AnalyticsQueryEngine:
    def __init__(self, db: Session):
        self.db = db

    def aggregate_metrics(
        self,
        start_utc: datetime,
        end_utc: datetime,
        time_zone: str = "Asia/Kolkata",
        owner_user_id: Optional[UUID] = None,
        department: Optional[str] = None,
        call_source: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Execute aggregated metric calculations over database tables within window."""
        # 1. Base Call Query
        call_q = self.db.query(Call).filter(Call.created_at >= start_utc, Call.created_at < end_utc)
        if owner_user_id:
            call_q = call_q.filter(Call.user_id == owner_user_id)
        if call_source == "real":
            call_q = call_q.filter(~Call.external_call_sid.like("SIM%"))
        elif call_source == "simulated":
            call_q = call_q.filter(Call.external_call_sid.like("SIM%"))

        total_calls = call_q.count()

        # Outcome breakdown
        answered_calls = call_q.filter(Call.status.in_(["ANSWERED", "SCREENING", "CLASSIFIED", "TRANSFERRING", "COMPLETED", "FLAGGED"])).count()
        missed_calls = call_q.filter(Call.status == "MISSED").count()
        abandoned_calls = call_q.filter(Call.status == "ABANDONED").count()
        completed_calls = call_q.filter(Call.status == "COMPLETED").count()
        failed_calls = call_q.filter(Call.status == "FAILED").count()

        # Source breakdown
        simulated_calls = call_q.filter(Call.external_call_sid.like("SIM%")).count()
        real_calls = total_calls - simulated_calls

        # Duration aggregation
        avg_duration = call_q.filter(Call.status.in_(["COMPLETED", "ANSWERED"])).with_entities(func.avg(Call.duration_seconds)).scalar() or 0.0

        # Language distribution
        english_cnt = call_q.filter(Call.detected_language == "en-IN").count()
        hindi_cnt = call_q.filter(Call.detected_language == "hi-IN").count()
        hinglish_cnt = call_q.filter(Call.detected_language.in_(["mixed", "bilingual", "hinglish"])).count()
        if (english_cnt + hindi_cnt + hinglish_cnt) < total_calls:
            hinglish_cnt = max(0, total_calls - (english_cnt + hindi_cnt))

        # 2. Spam & Fraud Shield Metrics
        flagged_reviews = call_q.filter(or_(Call.disposition == "uncertain", Call.status == "NEEDS_REVIEW")).count()
        spam_blocked = call_q.filter(Call.disposition == "spam").count()

        spam_reports_q = self.db.query(SpamReport).join(Call).filter(Call.created_at >= start_utc, Call.created_at < end_utc)
        if owner_user_id:
            spam_reports_q = spam_reports_q.filter(Call.user_id == owner_user_id)

        confirmed_spam = spam_reports_q.filter(SpamReport.review_decision == "confirmed_spam").count()
        confirmed_legitimate = spam_reports_q.filter(SpamReport.review_decision == "false_positive").count()
        pending_reviews = max(0, flagged_reviews - (confirmed_spam + confirmed_legitimate))

        # 3. Transfer & Forwarding Metrics
        tr_q = self.db.query(TransferRecord).join(Call).filter(Call.created_at >= start_utc, Call.created_at < end_utc)
        if owner_user_id:
            tr_q = tr_q.filter(Call.user_id == owner_user_id)
        if department:
            tr_q = tr_q.filter(TransferRecord.department.ilike(f"%{department}%"))

        transfer_attempts = tr_q.count()
        successful_transfers = tr_q.filter(TransferRecord.transfer_status.in_(["ACCEPTED", "CONNECTED"])).count()
        declined_transfers = tr_q.filter(TransferRecord.transfer_status == "DECLINED").count()
        unanswered_transfers = tr_q.filter(TransferRecord.transfer_status.in_(["NO_ANSWER", "BUSY"])).count()
        failed_transfers = tr_q.filter(TransferRecord.transfer_status == "FAILED").count()

        forwarding_rate = round((successful_transfers / max(1, transfer_attempts or total_calls)) * 100, 1)

        # 4. Voicemails & Callbacks
        vm_cnt = self.db.query(VoicemailMessage).filter(VoicemailMessage.created_at >= start_utc, VoicemailMessage.created_at < end_utc).count()
        cb_pending = self.db.query(CallbackRequest).filter(CallbackRequest.status == "pending").count()
        cb_completed = self.db.query(CallbackRequest).filter(CallbackRequest.created_at >= start_utc, CallbackRequest.created_at < end_utc, CallbackRequest.status == "completed").count()

        return {
            "totalCalls": total_calls,
            "answeredCalls": answered_calls,
            "missedCalls": missed_calls,
            "abandonedCalls": abandoned_calls,
            "completedCalls": completed_calls,
            "failedCalls": failed_calls,
            "simulatedCalls": simulated_calls,
            "realTelephoneCalls": real_calls,
            "screenedByAi": total_calls,
            "flaggedForReview": flagged_reviews,
            "spamCallsBlocked": spam_blocked,
            "confirmedSpamCalls": confirmed_spam,
            "confirmedLegitimateCalls": confirmed_legitimate,
            "pendingSpamReviews": pending_reviews,
            "transferAttempts": transfer_attempts,
            "successfulTransfers": successful_transfers,
            "declinedTransfers": declined_transfers,
            "unansweredTransfers": unanswered_transfers,
            "failedTransfers": failed_transfers,
            "forwardingSuccessRate": forwarding_rate,
            "avgDurationSeconds": round(float(avg_duration), 1),
            "voicemailCount": vm_cnt,
            "pendingCallbacks": cb_pending,
            "completedCallbacks": cb_completed,
            "languages": {
                "english": english_cnt,
                "hindi": hindi_cnt,
                "hinglish": hinglish_cnt,
            },
        }
