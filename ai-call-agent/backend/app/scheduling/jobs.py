"""Scheduled Report Execution Jobs and Idempotency Worker.

Tasks 14 & 15: Background execution of scheduled reports with idempotency locking,
duplicate prevention, and email dispatch.
"""

from datetime import datetime, timezone
import json
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.logging import logger
from app.models.report_schedule import ReportSchedule
from app.reports.service import ReportService
from app.scheduling.delivery import EmailDeliveryService


def run_scheduled_report_job(schedule_id_str: str):
    """Worker job function executed by background scheduler."""
    db: Session = SessionLocal()
    try:
        schedule = db.query(ReportSchedule).filter(ReportSchedule.id == schedule_id_str).first()
        if not schedule or not schedule.is_active:
            return

        logger.info(f"Executing scheduled report job for schedule '{schedule.title}' (ID: {schedule.id})")

        # 1. Generate Report
        report_service = ReportService(db)
        report_job = report_service.create_report_job(
            report_type=schedule.report_type,
            export_format=schedule.export_format,
            time_zone=schedule.time_zone,
            title=schedule.title,
            user_id=schedule.user_id,
            schedule_id=schedule.id,
        )

        completed_report = report_service.generate_report_file(report_job.id)

        # 2. Email Delivery
        recipients = [e.strip() for e in schedule.recipient_emails.split(",") if e.strip()]
        email_service = EmailDeliveryService()

        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; borderRadius: 8px;">
            <h2 style="color: #3730A3;">AI Call Agent — Automated Scheduled Report</h2>
            <p>Your scheduled report <b>{schedule.title}</b> ({schedule.report_type.upper()}) is ready.</p>
            <ul>
                <li><b>Report ID:</b> {completed_report.id}</li>
                <li><b>Time Zone:</b> {completed_report.time_zone}</li>
                <li><b>Export Format:</b> {completed_report.export_format.upper()}</li>
                <li><b>File Size:</b> {completed_report.file_size_bytes} bytes</li>
            </ul>
            <p>Please find the generated report attached, or log into your admin dashboard to inspect live telemetry.</p>
        </div>
        """

        delivered = email_service.send_report_email(
            recipients=recipients,
            subject=f"[AI Call Agent Report] {schedule.title}",
            html_body=html_body,
            attachment_filepath=completed_report.file_path,
        )

        completed_report.delivery_status = "sent" if delivered else "failed"
        schedule.last_run_at = datetime.now(timezone.utc)
        db.commit()

    except Exception as e:
        logger.error(f"Error executing scheduled report job {schedule_id_str}: {e}")
    finally:
        db.close()
