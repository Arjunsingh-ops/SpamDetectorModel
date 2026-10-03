"""REST Endpoints for Report Generation and Downloads."""

import os
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import RequireRole
from app.models.user import User
from app.reports.service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])


class CreateReportPayload(BaseModel):
    title: Optional[str] = None
    report_type: str = "daily"  # daily | weekly | monthly | custom
    export_format: str = "pdf"  # pdf | xlsx | csv
    time_zone: str = "Asia/Kolkata"
    custom_start: Optional[datetime] = None
    custom_end: Optional[datetime] = None


@router.get("", summary="List Generated Reports Audit History")
@router.get("/", summary="List Generated Reports Audit History")
def list_reports(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    service = ReportService(db)
    owner_filter = None if current_user.role == "admin" else current_user.id
    reports = service.list_reports(user_id=owner_filter, limit=limit)
    return [
        {
            "id": str(r.id),
            "title": r.title,
            "report_type": r.report_type,
            "export_format": r.export_format,
            "time_zone": r.time_zone,
            "period_start": r.period_start.isoformat(),
            "period_end": r.period_end.isoformat(),
            "status": r.status,
            "file_size_bytes": r.file_size_bytes,
            "delivery_status": r.delivery_status,
            "created_at": r.created_at.isoformat(),
            "error_message": r.error_message,
        }
        for r in reports
    ]


@router.post("", summary="Generate Report Task", status_code=status.HTTP_201_CREATED)
@router.post("/", summary="Generate Report Task", status_code=status.HTTP_201_CREATED)
def create_report(
    payload: CreateReportPayload,
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    service = ReportService(db)
    report_job = service.create_report_job(
        report_type=payload.report_type,
        export_format=payload.export_format,
        time_zone=payload.time_zone,
        title=payload.title,
        user_id=current_user.id,
        custom_start=payload.custom_start,
        custom_end=payload.custom_end,
    )
    completed_report = service.generate_report_file(report_job.id)
    return {
        "id": str(completed_report.id),
        "title": completed_report.title,
        "report_type": completed_report.report_type,
        "export_format": completed_report.export_format,
        "status": completed_report.status,
        "file_size_bytes": completed_report.file_size_bytes,
        "created_at": completed_report.created_at.isoformat(),
    }


@router.get("/{id}", summary="Get Report Details")
def get_report_details(
    id: UUID = Path(..., description="Report UUID"),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    service = ReportService(db)
    report = service.get_report_by_id(id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return {
        "id": str(report.id),
        "title": report.title,
        "report_type": report.report_type,
        "export_format": report.export_format,
        "time_zone": report.time_zone,
        "period_start": report.period_start.isoformat(),
        "period_end": report.period_end.isoformat(),
        "status": report.status,
        "file_size_bytes": report.file_size_bytes,
        "delivery_status": report.delivery_status,
        "metrics_summary": report.metrics_summary_json,
        "created_at": report.created_at.isoformat(),
    }


@router.get("/{id}/download", summary="Authenticated Report File Download")
def download_report_file(
    id: UUID = Path(..., description="Report UUID"),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist", "viewer"])),
    db: Session = Depends(get_db),
):
    service = ReportService(db)
    report = service.get_report_by_id(id)
    if not report or not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found or generation incomplete.")

    media_type = "application/pdf"
    if report.export_format == "xlsx":
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    elif report.export_format == "csv":
        media_type = "text/csv"

    filename = os.path.basename(report.file_path)
    return FileResponse(
        path=report.file_path,
        media_type=media_type,
        filename=filename,
    )


@router.post("/{id}/retry", summary="Retry Failed Report Generation")
def retry_report_generation(
    id: UUID = Path(..., description="Report UUID"),
    current_user: User = Depends(RequireRole(["admin", "operator"])),
    db: Session = Depends(get_db),
):
    service = ReportService(db)
    completed_report = service.generate_report_file(id)
    return {
        "id": str(completed_report.id),
        "status": completed_report.status,
        "file_size_bytes": completed_report.file_size_bytes,
    }
