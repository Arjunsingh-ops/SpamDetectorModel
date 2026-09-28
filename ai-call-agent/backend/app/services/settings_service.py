"""User Settings Service for Forwarding Rules, Working Hours, and Preferences."""

import uuid
from typing import Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user_settings import UserSettings
from app.core.config import settings as app_settings


class SettingsService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_settings(self, user_id: UUID) -> Dict[str, Any]:
        s = self.db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not s:
            # Default enterprise fallback
            return {
                "id": str(uuid.uuid4()),
                "userId": str(user_id),
                "forwardingRules": {
                    "defaultNumber": app_settings.DEFAULT_FORWARD_NUMBER,
                    "provider": app_settings.TELEPHONY_PROVIDER,
                    "fallbackAction": "voicemail",
                },
                "workingHours": {
                    "schedule": "mon_fri",
                    "startTime": "09:00",
                    "endTime": "18:00",
                    "timeZone": "Asia/Kolkata",
                },
                "preferredLanguage": "en-IN",
                "notificationSettings": {
                    "emailOnSpam": True,
                    "smsOnForward": False,
                },
            }

        return {
            "id": str(s.id),
            "userId": str(s.user_id),
            "forwardingRules": s.forwarding_rules or {"defaultNumber": app_settings.DEFAULT_FORWARD_NUMBER},
            "workingHours": s.working_hours or {"schedule": "mon_fri", "startTime": "09:00", "endTime": "18:00"},
            "preferredLanguage": s.preferred_language,
            "notificationSettings": s.notification_settings or {"emailOnSpam": True},
        }

    def update_user_settings(self, user_id: UUID, payload: Dict[str, Any]) -> Dict[str, Any]:
        s = self.db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not s:
            s = UserSettings(
                id=uuid.uuid4(),
                user_id=user_id,
                forwarding_rules=payload.get("forwardingRules"),
                working_hours=payload.get("workingHours"),
                preferred_language=payload.get("preferredLanguage", "en-IN"),
                notification_settings=payload.get("notificationSettings"),
            )
            self.db.add(s)
        else:
            if "forwardingRules" in payload and payload["forwardingRules"] is not None:
                s.forwarding_rules = payload["forwardingRules"]
            if "workingHours" in payload and payload["workingHours"] is not None:
                s.working_hours = payload["workingHours"]
            if "preferredLanguage" in payload and payload["preferredLanguage"] is not None:
                s.preferred_language = payload["preferredLanguage"]
            if "notificationSettings" in payload and payload["notificationSettings"] is not None:
                s.notification_settings = payload["notificationSettings"]

        self.db.commit()
        self.db.refresh(s)
        return self.get_user_settings(user_id)
