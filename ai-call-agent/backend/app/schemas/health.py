"""Health and System Status Schemas."""

from typing import Dict, List
from datetime import datetime
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Application health status")
    timestamp: datetime = Field(description="Current UTC timestamp")
    service: str = Field(description="Service name")
    version: str = Field(description="Service version")


class DatabaseStatus(BaseModel):
    connected: bool
    dialect: str
    latency_ms: float


class AdapterStatus(BaseModel):
    provider: str
    mode: str
    ready: bool
    languages: List[str] = Field(default_factory=list)


class SystemStatusResponse(BaseModel):
    status: str
    environment: str
    version: str
    timestamp: datetime
    database: DatabaseStatus
    adapters: Dict[str, AdapterStatus]
    capabilities: Dict[str, bool]
