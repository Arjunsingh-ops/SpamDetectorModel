"""Report Schedule Entity Model."""

from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class ReportSchedule(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Configuration for recurring automated report generation and delivery."""

    __tablename__ = "report_schedules"

    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    report_type = Column(String(50), nullable=False)  # daily | weekly | monthly
    frequency = Column(String(30), nullable=False, default="daily")  # daily | weekly | monthly
    export_format = Column(String(20), nullable=False, default="pdf")  # pdf | xlsx | csv
    time_zone = Column(String(50), nullable=False, default="Asia/Kolkata")

    delivery_time_utc = Column(String(10), nullable=False, default="00:00")  # HH:MM format
    recipient_emails = Column(Text, nullable=False)  # Comma-separated list of emails

    is_active = Column(Boolean, default=True, nullable=False, index=True)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User")
    reports = relationship("GeneratedReport", back_populates="schedule", cascade="all, delete-orphan")
