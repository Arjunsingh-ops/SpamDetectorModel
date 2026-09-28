"""Analytics Aggregation Service."""

from typing import Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.call import Call


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_overview_analytics(self, owner_user_id: Optional[UUID] = None) -> Dict[str, Any]:
        query = self.db.query(Call)
        if owner_user_id:
            query = query.filter(Call.user_id == owner_user_id)

        total_calls = query.count()
        if total_calls == 0:
            # Stage 1 / Demo Data Fallback
            return {
                "totalCalls": 384,
                "legitimateCalls": 298,
                "spamCallsBlocked": 72,
                "uncertainScreened": 14,
                "avgDurationSeconds": 94,
                "forwardingSuccessRate": 96.4,
                "languages": {"english": 198, "hindi": 144, "hinglish": 42},
            }

        legitimate = query.filter(Call.disposition == "legitimate").count()
        spam = query.filter(Call.disposition == "spam").count()
        uncertain = query.filter(Call.disposition == "uncertain").count()

        avg_duration = self.db.query(func.avg(Call.duration_seconds)).scalar() or 0

        english_cnt = query.filter(Call.detected_language == "en-IN").count()
        hindi_cnt = query.filter(Call.detected_language == "hi-IN").count()
        mixed_cnt = total_calls - (english_cnt + hindi_cnt)

        forwarding_rate = round((legitimate / max(1, legitimate + spam)) * 100, 1)

        return {
            "totalCalls": total_calls,
            "legitimateCalls": legitimate,
            "spamCallsBlocked": spam,
            "uncertainScreened": uncertain,
            "avgDurationSeconds": round(float(avg_duration), 1),
            "forwardingSuccessRate": forwarding_rate,
            "languages": {
                "english": english_cnt,
                "hindi": hindi_cnt,
                "hinglish": max(0, mixed_cnt),
            },
        }

    def get_daily_analytics(self, owner_user_id: Optional[UUID] = None) -> Dict[str, Any]:
        return {
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "hourlyVolume": [
                {"hour": "08:00", "legitimate": 12, "spam": 4},
                {"hour": "09:00", "legitimate": 28, "spam": 11},
                {"hour": "10:00", "legitimate": 42, "spam": 15},
                {"hour": "11:00", "legitimate": 56, "spam": 18},
                {"hour": "12:00", "legitimate": 38, "spam": 9},
                {"hour": "13:00", "legitimate": 22, "spam": 3},
                {"hour": "14:00", "legitimate": 34, "spam": 6},
                {"hour": "15:00", "legitimate": 46, "spam": 4},
                {"hour": "16:00", "legitimate": 20, "spam": 2},
            ],
        }
