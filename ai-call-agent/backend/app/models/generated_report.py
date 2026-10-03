"""Generated Report History Entity Model."""

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, GUID


class GeneratedReport(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Persisted metadata, file location, and audit trail for generated reports."""

    __tablename__ = "generated_reports"

    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    report_schedule_id = Column(GUID, ForeignKey("report_schedules.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    report_type = Column(String(50), nullable=False, index=True)  # daily | weekly | monthly | custom
    export_format = Column(String(20), nullable=False, default="pdf")  # pdf | xlsx | csv

    time_zone = Column(String(50), nullable=False, default="Asia/Kolkata")
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)

    # Status: pending | generating | completed | failed
    status = Column(String(30), nullable=False, default="pending", index=True)
    file_path = Column(String(512), nullable=True)
    file_size_bytes = Column(Integer, default=0, nullable=False)

    # Delivery Status: not_applicable | queued | sent | failed
    delivery_status = Column(String(30), nullable=False, default="not_applicable")
    delivery_error = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    # Serialized metric summary JSON string for preview
    metrics_summary_json = Column(Text, nullable=True)
    metric_definition_version = Column(String(20), nullable=False, default="v1.0.0")

    # Relationships
    user = relationship("User")
    schedule = relationship("ReportSchedule", back_populates="reports")
