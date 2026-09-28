"""Shared Pydantic Schemas and Response Envelopes."""

from typing import Generic, List, TypeVar, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class IdentifiableSchema(BaseSchema):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int


class MessageResponse(BaseModel):
    message: str
    status: str = "success"
