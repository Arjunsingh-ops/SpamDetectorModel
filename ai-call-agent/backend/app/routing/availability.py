"""Recipient Availability Service and Business Hours Evaluator."""

from datetime import datetime, timezone
try:
    from zoneinfo import ZoneInfo
except ImportError:
    ZoneInfo = None

import logging
from typing import Tuple, Optional
from app.models.recipient import Recipient

logger = logging.getLogger("ai_call_agent.routing.availability")


class RecipientAvailabilityService:
    """Evaluates recipient availability taking into account manual status, business hours, and timezones."""

    @staticmethod
    def is_within_business_hours(recipient: Recipient, current_dt: Optional[datetime] = None) -> bool:
        """Check if current time is within recipient's configured business hours and work days."""
        try:
            if ZoneInfo and recipient.time_zone:
                tz = ZoneInfo(recipient.time_zone)
                now = (current_dt or datetime.now(timezone.utc)).astimezone(tz)
            else:
                now = current_dt or datetime.now()
        except Exception:
            now = datetime.now()

        # Check work days (e.g. ["mon", "tue", "wed", "thu", "fri"])
        day_str = now.strftime("%a").lower()
        if recipient.work_days and day_str not in [d.lower() for d in recipient.work_days]:
            return False

        # Parse start and end times (HH:MM)
        start_h, start_m = map(int, recipient.business_hours_start.split(":"))
        end_h, end_m = map(int, recipient.business_hours_end.split(":"))

        current_time = now.time()
        start_time = current_time.replace(hour=start_h, minute=start_m, second=0, microsecond=0)
        end_time = current_time.replace(hour=end_h, minute=end_m, second=0, microsecond=0)

        return start_time <= current_time <= end_time

    @classmethod
    def evaluate_availability(cls, recipient: Recipient) -> Tuple[bool, str]:
        """
        Evaluate full availability for a recipient.
        Returns tuple: (is_available, status_description).
        """
        if not recipient or not recipient.is_active:
            return False, "Recipient is inactive or disabled."

        if recipient.availability_status == "dnd":
            return False, "Recipient status is set to Do Not Disturb."

        if recipient.availability_status == "offline":
            return False, "Recipient is currently offline."

        if recipient.availability_status == "busy":
            return False, "Recipient is currently busy in another call."

        if recipient.availability_status == "away":
            return False, "Recipient is currently away from desk."

        # Check business hours
        in_hours = cls.is_within_business_hours(recipient)
        if not in_hours:
            return False, f"Outside business hours ({recipient.business_hours_start} - {recipient.business_hours_end} {recipient.time_zone})."

        return True, "Available for transfer."


recipient_availability_service = RecipientAvailabilityService()
