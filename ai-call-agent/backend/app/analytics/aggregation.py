"""Period Metrics Aggregation Engine.

Task 5, 6, 7 & 8: Daily, Weekly, Monthly, and Department/Recipient Analytics.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.analytics.queries import AnalyticsQueryEngine, resolve_reporting_window, get_timezone_object
from app.models.call import Call
from app.models.transfer import TransferRecord
from app.models.recipient import Recipient


class AnalyticsAggregationEngine:
    def __init__(self, db: Session):
        self.db = db
        self.query_engine = AnalyticsQueryEngine(db)

    def get_period_analytics(
        self,
        period_type: str = "today",
        time_zone: str = "Asia/Kolkata",
        owner_user_id: Optional[UUID] = None,
        department: Optional[str] = None,
        call_source: Optional[str] = None,
        custom_start: Optional[datetime] = None,
        custom_end: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        start_utc, end_utc, tz_key = resolve_reporting_window(
            period_type=period_type,
            tz_name=time_zone,
            custom_start=custom_start,
            custom_end=custom_end,
        )

        metrics = self.query_engine.aggregate_metrics(
            start_utc=start_utc,
            end_utc=end_utc,
            time_zone=tz_key,
            owner_user_id=owner_user_id,
            department=department,
            call_source=call_source,
        )

        # Hourly Volume Distribution
        hourly_distribution = self.get_hourly_distribution(start_utc, end_utc, owner_user_id)

        # Department Breakdown
        department_breakdown = self.get_department_breakdown(start_utc, end_utc)

        # Recipient Breakdown
        recipient_breakdown = self.get_recipient_breakdown(start_utc, end_utc)

        return {
            "periodType": period_type,
            "timeZone": tz_key,
            "periodStart": start_utc.isoformat(),
            "periodEnd": end_utc.isoformat(),
            "metrics": metrics,
            "totalCalls": metrics["totalCalls"],
            "spamCallsBlocked": metrics["spamCallsBlocked"],
            "hourlyVolume": hourly_distribution,
            "departments": department_breakdown,
            "recipients": recipient_breakdown,
            "dataQuality": {
                "hasUncertainSpamWithoutReview": metrics["pendingSpamReviews"] > 0,
                "note": "Metrics aggregated directly from verified database call records.",
            },
        }

    def get_hourly_distribution(
        self,
        start_utc: datetime,
        end_utc: datetime,
        owner_user_id: Optional[UUID] = None,
    ) -> List[Dict[str, Any]]:
        query = self.db.query(Call).filter(Call.created_at >= start_utc, Call.created_at < end_utc)
        if owner_user_id:
            query = query.filter(Call.user_id == owner_user_id)

        calls = query.all()
        hourly_map: Dict[str, Dict[str, int]] = {f"{h:02d}:00": {"legitimate": 0, "spam": 0} for h in range(8, 18)}

        for c in calls:
            hour_str = c.created_at.strftime("%H:00") if c.created_at else "09:00"
            if hour_str in hourly_map:
                if c.disposition == "spam":
                    hourly_map[hour_str]["spam"] += 1
                else:
                    hourly_map[hour_str]["legitimate"] += 1

        return [{"hour": h, "legitimate": v["legitimate"], "spam": v["spam"]} for h, v in hourly_map.items()]

    def get_department_breakdown(self, start_utc: datetime, end_utc: datetime) -> List[Dict[str, Any]]:
        results = (
            self.db.query(
                TransferRecord.department,
                func.count(TransferRecord.id).label("total_transfers"),
                func.sum(
                    case((TransferRecord.transfer_status.in_(["ACCEPTED", "CONNECTED"]), 1), else_=0)
                ).label("successful"),
            )
            .join(Call)
            .filter(Call.created_at >= start_utc, Call.created_at < end_utc)
            .group_by(TransferRecord.department)
            .all()
        )

        dept_list = []
        for r in results:
            dept_name = r.department or "General"
            tot = r.total_transfers or 0
            succ = r.successful or 0
            dept_list.append({
                "department": dept_name,
                "totalTransfers": tot,
                "successfulTransfers": succ,
                "successRate": round((succ / max(1, tot)) * 100, 1),
            })
        return dept_list

    def get_recipient_breakdown(self, start_utc: datetime, end_utc: datetime) -> List[Dict[str, Any]]:
        recipients = self.db.query(Recipient).filter(Recipient.is_active.is_(True)).all()
        output = []
        for r in recipients:
            trs = (
                self.db.query(TransferRecord)
                .join(Call)
                .filter(
                    Call.created_at >= start_utc,
                    Call.created_at < end_utc,
                    TransferRecord.recipient_id == r.id,
                )
                .all()
            )
            tot = len(trs)
            succ = sum(1 for t in trs if t.transfer_status in ["ACCEPTED", "CONNECTED"])
            output.append({
                "id": str(r.id),
                "name": r.display_name,
                "department": r.department,
                "assignedTransfers": tot,
                "acceptedTransfers": succ,
                "availability": r.availability_status,
            })
        return output
