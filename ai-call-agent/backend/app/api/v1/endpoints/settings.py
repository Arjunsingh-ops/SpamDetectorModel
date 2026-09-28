"""User Settings and Telephony Rules Endpoints."""

from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import RequireRole
from app.services.settings_service import SettingsService
from app.models.user import User

router = APIRouter(prefix="/settings", tags=["Settings"])


class UpdateSettingsRequest(BaseModel):
    forwardingRules: Optional[Dict[str, Any]] = None
    workingHours: Optional[Dict[str, Any]] = None
    preferredLanguage: Optional[str] = None
    notificationSettings: Optional[Dict[str, Any]] = None


@router.get("", summary="Get User Telephony & Preference Settings")
def get_settings(
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist"])),
    db: Session = Depends(get_db),
):
    service = SettingsService(db)
    return service.get_user_settings(current_user.id)


@router.patch("", summary="Update User Telephony & Preference Settings")
def update_settings(
    payload: UpdateSettingsRequest,
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist"])),
    db: Session = Depends(get_db),
):
    service = SettingsService(db)
    return service.update_user_settings(current_user.id, payload.model_dump())
