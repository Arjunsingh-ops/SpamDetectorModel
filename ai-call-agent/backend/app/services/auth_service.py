"""Authentication, Token Refresh, and Token Revocation Service."""

import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.core.security import verify_password, create_access_token
from app.core.exceptions import AppException
from app.models.refresh_token import RefreshToken
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)

    def _hash_token(self, token_str: str) -> str:
        return hashlib.sha256(token_str.encode("utf-8")).hexdigest()

    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        user = self.repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise AppException(
                message="Invalid corporate email or password.",
                status_code=401,
                code="AUTHENTICATION_FAILED",
            )

        if not user.is_active or user.status != "active":
            raise AppException(
                message="User account is deactivated or suspended.",
                status_code=403,
                code="ACCOUNT_SUSPENDED",
            )

        # Generate Access Token (8 hours) and Refresh Token (7 days)
        access_token = create_access_token(subject=str(user.id), role=user.role)
        raw_refresh_token = f"ref_{uuid.uuid4().hex}_{uuid.uuid4().hex}"
        refresh_hash = self._hash_token(raw_refresh_token)

        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        ref_obj = RefreshToken(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=expires_at,
            revoked=False,
        )
        self.repo.save_refresh_token(ref_obj)

        return {
            "access_token": access_token,
            "refresh_token": raw_refresh_token,
            "token_type": "bearer",
            "expires_in": 28800,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "fullName": user.full_name,
                "role": user.role,
                "status": user.status,
            },
        }

    def rotate_refresh_token(self, raw_refresh_token: str) -> Dict[str, Any]:
        """Verify refresh token, revoke old one, and issue new access & refresh tokens."""
        refresh_hash = self._hash_token(raw_refresh_token)
        stored_token = self.repo.get_refresh_token(refresh_hash)

        if not stored_token or stored_token.revoked:
            raise AppException(
                message="Invalid or revoked refresh token.",
                status_code=401,
                code="REFRESH_TOKEN_INVALID",
            )

        now = datetime.now(timezone.utc)
        if stored_token.expires_at < now:
            stored_token.revoked = True
            self.db.commit()
            raise AppException(
                message="Refresh token has expired. Please log in again.",
                status_code=401,
                code="REFRESH_TOKEN_EXPIRED",
            )

        # Revoke old refresh token
        stored_token.revoked = True
        self.db.commit()

        user = self.repo.get_by_id(stored_token.user_id)
        if not user or not user.is_active:
            raise AppException(message="User no longer active.", status_code=403, code="USER_INACTIVE")

        # Issue new token pair
        new_access_token = create_access_token(subject=str(user.id), role=user.role)
        new_raw_refresh = f"ref_{uuid.uuid4().hex}_{uuid.uuid4().hex}"
        new_refresh_hash = self._hash_token(new_raw_refresh)

        new_ref_obj = RefreshToken(
            user_id=user.id,
            token_hash=new_refresh_hash,
            expires_at=now + timedelta(days=7),
            revoked=False,
        )
        self.repo.save_refresh_token(new_ref_obj)

        return {
            "access_token": new_access_token,
            "refresh_token": new_raw_refresh,
            "token_type": "bearer",
            "expires_in": 28800,
        }

    def revoke_token(self, raw_refresh_token: str) -> bool:
        refresh_hash = self._hash_token(raw_refresh_token)
        return self.repo.revoke_refresh_token(refresh_hash)
