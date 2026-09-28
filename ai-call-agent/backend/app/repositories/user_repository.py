"""User Data Access Repository."""

from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.refresh_token import RefreshToken


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: UUID) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email.lower().strip()).first()

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User) -> User:
        self.db.commit()
        self.db.refresh(user)
        return user

    def list_all(self, limit: int = 50, offset: int = 0) -> List[User]:
        return self.db.query(User).order_by(User.created_at.desc()).offset(offset).limit(limit).all()

    # Refresh Token persistence
    def save_refresh_token(self, token_obj: RefreshToken) -> RefreshToken:
        self.db.add(token_obj)
        self.db.commit()
        return token_obj

    def get_refresh_token(self, token_hash: str) -> Optional[RefreshToken]:
        return self.db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash, RefreshToken.revoked.is_(False)).first()

    def revoke_refresh_token(self, token_hash: str) -> bool:
        token = self.get_refresh_token(token_hash)
        if token:
            token.revoked = True
            self.db.commit()
            return True
        return False
