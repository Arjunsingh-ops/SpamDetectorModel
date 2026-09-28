"""Custom Voice Profiles and Consent Management Endpoints."""

import uuid
import logging
from typing import List
from uuid import UUID as PyUUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.voice_profile import VoiceProfile
from app.ai.tts.custom_voice import CustomVoiceProvider
from pydantic import BaseModel

logger = logging.getLogger("ai_call_agent.api.v1.voice_profiles")

router = APIRouter(prefix="/voice/profiles", tags=["voice-profiles"])
custom_voice_provider = CustomVoiceProvider()


class VoiceProfileResponse(BaseModel):
    id: PyUUID
    name: str
    provider: str
    voice_id: str
    language: str
    consent_granted: bool
    is_active: bool

    class Config:
        from_attributes = True


@router.get("", response_model=List[VoiceProfileResponse])
def list_voice_profiles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve list of authorized voice profiles for current tenant/user."""
    profiles = db.query(VoiceProfile).filter(VoiceProfile.user_id == current_user.id).all()
    return profiles


@router.post("", response_model=VoiceProfileResponse, status_code=201)
async def create_voice_profile(
    name: str = Form(...),
    provider: str = Form("custom_xtts"),
    language: str = Form("en-IN"),
    consent_granted: bool = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload an authorized voice sample and create a voice profile.
    Requires explicit voice-owner consent verification (regulatory requirement).
    """
    if not consent_granted:
        raise HTTPException(
            status_code=400,
            detail="Voice cloning requires documented voice-owner authorization consent.",
        )

    file_bytes = await file.read()
    val_res = custom_voice_provider.validate_voice_sample(file_bytes, file.filename or "sample.wav")
    if not val_res["valid"]:
        raise HTTPException(status_code=400, detail=val_res["reason"])

    voice_id = f"custom_voice_{uuid.uuid4().hex[:12]}"
    sample_key = f"voice_samples/{current_user.id}/{voice_id}_{file.filename}"

    new_profile = VoiceProfile(
        user_id=current_user.id,
        name=name,
        provider=provider,
        voice_id=voice_id,
        sample_s3_key=sample_key,
        language=language,
        consent_granted=True,
        consent_metadata={
            "user_email": current_user.email,
            "ip_address": "127.0.0.1",
            "agreement": "I confirm that I possess full legal rights and explicit consent to clone this voice sample.",
        },
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    logger.info(f"Created authorized voice profile '{new_profile.name}' for user {current_user.id}")
    return new_profile


@router.delete("/{profile_id}")
def delete_voice_profile(
    profile_id: PyUUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an existing custom voice profile."""
    profile = db.query(VoiceProfile).filter(
        VoiceProfile.id == profile_id,
        VoiceProfile.user_id == current_user.id,
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Voice profile not found.")

    db.delete(profile)
    db.commit()
    return {"message": "Voice profile deleted successfully."}
