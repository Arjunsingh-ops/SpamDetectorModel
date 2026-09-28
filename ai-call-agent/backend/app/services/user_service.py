"""User Management Service."""

from typing import Dict, Any, Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.core.exceptions import AppException, ResourceNotFoundException
from app.models.user import User
from app.repositories.user_repository import UserRepository


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)

    def list_users(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        users = self.repo.list_all(limit=limit, offset=offset)
        return [
            {
                "id": str(u.id),
                "email": u.email,
                "fullName": u.full_name,
                "role": u.role,
                "status": u.status,
                "isActive": u.is_active,
                "createdAt": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ]

    def create_user(self, email: str, full_name: str, role: str, password: str = "Password123!") -> Dict[str, Any]:
        clean_email = email.lower().strip()
        existing = self.repo.get_by_email(clean_email)
        if existing:
            raise AppException(message="Email address already registered.", status_code=400, code="EMAIL_EXISTS")

        from app.core.security import get_password_hash
        user = User(
            email=clean_email,
            full_name=full_name.strip(),
            role=role.lower(),
            status="active",
            is_active=True,
            hashed_password=get_password_hash(password),
        )
        created = self.repo.create(user)
        return {
            "id": str(created.id),
            "email": created.email,
            "fullName": created.full_name,
            "role": created.role,
            "status": created.status,
            "isActive": created.is_active,
            "createdAt": created.created_at.isoformat() if created.created_at else None,
        }

    def admin_update_user(
        self,
        user_id: UUID,
        full_name: Optional[str] = None,
        email: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Dict[str, Any]:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundException("User", str(user_id))

        if full_name:
            user.full_name = full_name.strip()
        if email:
            clean_email = email.lower().strip()
            existing = self.repo.get_by_email(clean_email)
            if existing and existing.id != user.id:
                raise AppException(message="Email address already registered.", status_code=400, code="EMAIL_EXISTS")
            user.email = clean_email
        if role:
            user.role = role.lower()
        if is_active is not None:
            user.is_active = is_active
            user.status = "active" if is_active else "inactive"

        updated = self.repo.update(user)
        return {
            "id": str(updated.id),
            "email": updated.email,
            "fullName": updated.full_name,
            "role": updated.role,
            "status": updated.status,
            "isActive": updated.is_active,
        }

    def deactivate_user(self, user_id: UUID) -> bool:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundException("User", str(user_id))
        user.is_active = False
        user.status = "inactive"
        self.repo.update(user)
        return True
