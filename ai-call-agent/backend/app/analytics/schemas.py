"""Pydantic Schemas for Advanced Analytics and Telemetry API."""

from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class MetricSummarySchema(BaseModel):
    totalCalls: int = 0
    answeredCalls: int = 0
    missedCalls: int = 0
    abandonedCalls: int = 0
    completedCalls: int = 0
    failedCalls: int = 0
    simulatedCalls: int = 0
    realTelephoneCalls: int = 0
    screenedByAi: int = 0
    flaggedForReview: int = 0
    spamCallsBlocked: int = 0
    confirmedSpamCalls: int = 0
    confirmedLegitimateCalls: int = 0
    pendingSpamReviews: int = 0
    transferAttempts: int = 0
    successfulTransfers: int = 0
    declinedTransfers: int = 0
    unansweredTransfers: int = 0
    failedTransfers: int = 0
    forwardingSuccessRate: float = 0.0
    avgDurationSeconds: float = 0.0
    voicemailCount: int = 0
    pendingCallbacks: int = 0
    completedCallbacks: int = 0
    languages: Dict[str, int] = Field(default_factory=dict)


class AnalyticsResponseSchema(BaseModel):
    periodType: str
    timeZone: str
    periodStart: str
    periodEnd: str
    metrics: MetricSummarySchema
    hourlyVolume: List[Dict[str, Any]] = Field(default_factory=list)
    departments: List[Dict[str, Any]] = Field(default_factory=list)
    recipients: List[Dict[str, Any]] = Field(default_factory=list)
    dataQuality: Dict[str, Any] = Field(default_factory=dict)
