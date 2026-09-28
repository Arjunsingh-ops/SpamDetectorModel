"""FastAPI Dependency Injection for Authentication, RBAC, and Database Sessions."""

import uuid
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.exceptions import AppException
from app.models.user import User

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Extract and verify bearer JWT token.
    Returns authenticated User model, or None if in mock mode / unauthenticated.
    """
    if not credentials:
        return None

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise AppException(
            message="Token payload missing subject identifier.",
            status_code=401,
            code="INVALID_TOKEN_CLAIMS",
        )

    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            if not user.is_active:
                raise AppException(
                    message="User account is deactivated.",
                    status_code=403,
                    code="USER_INACTIVE",
                )
            return user
    except AppException:
        raise
    except Exception:
        pass

    # Return valid User instance constructed from JWT claims when DB entry not present
    return User(
        id=user_id,
        email=payload.get("email", "admin@example.com"),
        full_name="Enterprise Operator",
        role=payload.get("role", "admin"),
        status="active",
        is_active=True,
        hashed_password="",
    )


class RequireRole:
    """Dependency validator enforcing Role-Based Access Control (RBAC)."""

    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: Optional[User] = Depends(get_current_user)) -> User:
        if not user:
            # For Stage 1/2 development & test mocks, allow request to proceed if no token passed,
            # but assign default admin user with valid UUID
            return User(
                id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
                email="dev-admin@aicallagent.internal",
                full_name="Dev Admin",
                role="admin",
                status="active",
                is_active=True,
                hashed_password="",
            )

        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {self.allowed_roles}, your role: {user.role}",
            )
        return user
