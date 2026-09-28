from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import RequireRole
from app.services.user_service import UserService
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


class UpdateUserRequest(BaseModel):
    fullName: Optional[str] = None
    email: Optional[str] = None


class CreateUserPayload(BaseModel):
    email: str
    fullName: str
    role: str = "receptionist"
    password: Optional[str] = "Password123!"


class AdminUpdateUserPayload(BaseModel):
    fullName: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    isActive: Optional[bool] = None


@router.get("", summary="List All System Users")
@router.get("/", summary="List All System Users")
def list_users(
    limit: int = Query(50, ge=1, le=100),
    page: int = Query(1, ge=1),
    current_user: User = Depends(RequireRole(["admin"])),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    offset = (page - 1) * limit
    return service.list_users(limit=limit, offset=offset)


@router.post("", summary="Provision New User Account", status_code=status.HTTP_201_CREATED)
@router.post("/", summary="Provision New User Account", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: CreateUserPayload,
    current_user: User = Depends(RequireRole(["admin"])),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    return service.create_user(
        email=payload.email,
        full_name=payload.fullName,
        role=payload.role,
        password=payload.password or "Password123!",
    )


@router.get("/me", summary="Get Current User Profile")
def get_user_me(
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    return service.get_profile(current_user.id)


@router.patch("/me", summary="Update Current User Profile")
def update_user_me(
    payload: UpdateUserRequest,
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist"])),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    return service.update_profile(
        user_id=current_user.id,
        full_name=payload.fullName,
        email=payload.email,
    )


@router.patch("/{id}", summary="Admin Update User Account")
def admin_update_user(
    payload: AdminUpdateUserPayload,
    id: UUID = Path(..., description="Target User UUID"),
    current_user: User = Depends(RequireRole(["admin"])),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    return service.admin_update_user(
        user_id=id,
        full_name=payload.fullName,
        email=payload.email,
        role=payload.role,
        is_active=payload.isActive,
    )


@router.delete("/{id}", summary="Deactivate User Account", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(
    id: UUID = Path(..., description="Target User UUID"),
    current_user: User = Depends(RequireRole(["admin"])),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    service.deactivate_user(id)
    return None

