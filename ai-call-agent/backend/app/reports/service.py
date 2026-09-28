"""Report Generation Engine and Storage Service.

Task 13: Report History Persistence, File Storage, and Status Lifecycle.
"""

import json
import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.analytics.aggregation import AnalyticsAggregationEngine
from app.analytics.queries import resolve_reporting_window
from app.reports.pdf_export import generate_pdf_report
from app.reports.excel_export import generate_excel_report
from app.reports.csv_export import generate_csv_call_export
from app.models.generated_report import GeneratedReport
from app.models.call import Call


STORAGE_REPORTS_DIR = os.path.join(os.getcwd(), "storage", "reports")


class ReportService:
    def __init__(self, db: Session):
        self.db = db
        self.aggregation_engine = AnalyticsAggregationEngine(db)

    def create_report_job(
        self,
        report_type: str = "daily",
        export_format: str = "pdf",
        time_zone: str = "Asia/Kolkata",
        title: Optional[str] = None,
        user_id: Optional[UUID] = None,
        schedule_id: Optional[UUID] = None,
        custom_start: Optional[datetime] = None,
        custom_end: Optional[datetime] = None,
    ) -> GeneratedReport:
        """Create database entry for a new report job."""
        start_utc, end_utc, tz_key = resolve_reporting_window(
            period_type=report_type,
            tz_name=time_zone,
            custom_start=custom_start,
            custom_end=custom_end,
        )

        report_title = title or f"{report_type.capitalize()} Telephony Operations Report"

        report_entry = GeneratedReport(
            user_id=user_id,
            report_schedule_id=schedule_id,
            title=report_title,
            report_type=report_type,
            export_format=export_format.lower(),
            time_zone=tz_key,
            period_start=start_utc,
            period_end=end_utc,
            status="pending",
            delivery_status="not_applicable",
            metric_definition_version="v1.0.0",
        )

        self.db.add(report_entry)
        self.db.commit()
        self.db.refresh(report_entry)
        return report_entry

    def generate_report_file(self, report_id: UUID) -> GeneratedReport:
        """Execute calculations and generate output file (PDF / XLSX / CSV)."""
        report = self.db.query(GeneratedReport).filter(GeneratedReport.id == report_id).first()
        if not report:
            raise ValueError(f"Report {report_id} not found.")

        report.status = "generating"
        self.db.commit()

        try:
            # 1. Aggregate Data
            report_data = self.aggregation_engine.get_period_analytics(
                period_type=report.report_type,
                time_zone=report.time_zone,
                owner_user_id=report.user_id,
                custom_start=report.period_start,
                custom_end=report.period_end,
            )

            # 2. File Path Setup
            timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            filename = f"report_{report.report_type}_{timestamp_str}_{str(report.id)[:8]}.{report.export_format}"
            filepath = os.path.join(STORAGE_REPORTS_DIR, filename)

            # 3. Generate Format File
            if report.export_format == "pdf":
                generate_pdf_report(report_data, filepath, title=report.title)
            elif report.export_format == "xlsx":
                generate_excel_report(report_data, filepath, title=report.title)
            elif report.export_format == "csv":
                calls = (
                    self.db.query(Call)
                    .filter(Call.created_at >= report.period_start, Call.created_at < report.period_end)
                    .all()
                )
                generate_csv_call_export(calls, output_filepath=filepath)
            else:
                generate_pdf_report(report_data, filepath, title=report.title)

            # 4. Update Metadata
            file_size = os.path.getsize(filepath) if os.path.exists(filepath) else 0
            report.status = "completed"
            report.file_path = filepath
            report.file_size_bytes = file_size
            report.metrics_summary_json = json.dumps(report_data.get("metrics", {}))
            self.db.commit()
            self.db.refresh(report)
            return report

        except Exception as e:
            report.status = "failed"
            report.error_message = str(e)
            self.db.commit()
            raise e

    def list_reports(self, user_id: Optional[UUID] = None, limit: int = 50) -> List[GeneratedReport]:
        query = self.db.query(GeneratedReport)
        if user_id:
            query = query.filter(GeneratedReport.user_id == user_id)
        return query.order_by(GeneratedReport.created_at.desc()).limit(limit).all()

    def get_report_by_id(self, report_id: UUID) -> Optional[GeneratedReport]:
        return self.db.query(GeneratedReport).filter(GeneratedReport.id == report_id).first()
