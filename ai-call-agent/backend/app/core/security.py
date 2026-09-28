"""Enterprise Security, Password Hashing, and JWT Token Utilities."""

import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from app.core.config import settings
from app.core.exceptions import AppException

# Password hashing context using PBKDF2-SHA256
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
ALGORITHM = "HS256"


def get_password_hash(password: str) -> str:
    """Generate secure salted bcrypt hash of raw password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify raw password against stored bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    role: str = "receptionist",
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Create signed JWT access token with user claims and expiration."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(hours=8)  # Standard 8-hour shift token

    payload = {
        "sub": str(subject),
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": settings.APP_NAME,
    }

    if extra_claims:
        payload.update(extra_claims)

    encoded_jwt = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and cryptographically verify JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM],
            issuer=settings.APP_NAME,
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AppException(
            message="Access token has expired. Please authenticate again.",
            status_code=401,
            code="TOKEN_EXPIRED",
        )
    except jwt.InvalidTokenError:
        raise AppException(
            message="Invalid or tampered access token signature.",
            status_code=401,
            code="TOKEN_INVALID",
        )


def get_current_user_from_token(token: str, db: Any) -> Any:
    """Decode JWT token and retrieve corresponding user from database."""
    from app.models.user import User
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise AppException(message="Token missing subject claim", status_code=401, code="TOKEN_INVALID")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise AppException(message="User account inactive or not found", status_code=401, code="USER_INACTIVE")
    return user

