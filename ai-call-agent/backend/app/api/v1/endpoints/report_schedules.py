"""REST Endpoints for Scheduled Report Management."""

from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import RequireRole
from app.models.user import User
from app.models.report_schedule import ReportSchedule

router = APIRouter(prefix="/report-schedules", tags=["Report Schedules"])


class CreateSchedulePayload(BaseModel):
    title: str
    report_type: str = "daily"  # daily | weekly | monthly
    frequency: str = "daily"    # daily | weekly | monthly
    export_format: str = "pdf"  # pdf | xlsx | csv
    time_zone: str = "Asia/Kolkata"
    delivery_time_utc: str = "00:00"
    recipient_emails: str


class UpdateSchedulePayload(BaseModel):
    title: Optional[str] = None
    frequency: Optional[str] = None
    export_format: Optional[str] = None
    time_zone: Optional[str] = None
    delivery_time_utc: Optional[str] = None
    recipient_emails: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("", summary="List Recurring Report Schedules")
@router.get("/", summary="List Recurring Report Schedules")
def list_report_schedules(
    current_user: User = Depends(RequireRole(["admin", "operator"])),
    db: Session = Depends(get_db),
):
    query = db.query(ReportSchedule)
    if current_user.role != "admin":
        query = query.filter(ReportSchedule.user_id == current_user.id)
    schedules = query.order_by(ReportSchedule.created_at.desc()).all()
    return [
        {
            "id": str(s.id),
            "title": s.title,
            "report_type": s.report_type,
            "frequency": s.frequency,
            "export_format": s.export_format,
            "time_zone": s.time_zone,
            "delivery_time_utc": s.delivery_time_utc,
            "recipient_emails": s.recipient_emails,
            "is_active": s.is_active,
            "last_run_at": s.last_run_at.isoformat() if s.last_run_at else None,
            "created_at": s.created_at.isoformat(),
        }
        for s in schedules
    ]


@router.post("", summary="Create Recurring Report Schedule", status_code=status.HTTP_201_CREATED)
@router.post("/", summary="Create Recurring Report Schedule", status_code=status.HTTP_201_CREATED)
def create_report_schedule(
    payload: CreateSchedulePayload,
    current_user: User = Depends(RequireRole(["admin", "operator"])),
    db: Session = Depends(get_db),
):
    schedule = ReportSchedule(
        user_id=current_user.id,
        title=payload.title,
        report_type=payload.report_type,
        frequency=payload.frequency,
        export_format=payload.export_format,
        time_zone=payload.time_zone,
        delivery_time_utc=payload.delivery_time_utc,
        recipient_emails=payload.recipient_emails,
        is_active=True,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return {
        "id": str(schedule.id),
        "title": schedule.title,
        "report_type": schedule.report_type,
        "frequency": schedule.frequency,
        "export_format": schedule.export_format,
        "is_active": schedule.is_active,
        "created_at": schedule.created_at.isoformat(),
    }


@router.patch("/{id}", summary="Update Report Schedule")
def update_report_schedule(
    payload: UpdateSchedulePayload,
    id: UUID = Path(..., description="Schedule UUID"),
    current_user: User = Depends(RequireRole(["admin", "operator"])),
    db: Session = Depends(get_db),
):
    schedule = db.query(ReportSchedule).filter(ReportSchedule.id == id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Report schedule not found.")

    if current_user.role != "admin" and schedule.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to this report schedule.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(schedule, field, val)

    db.commit()
    db.refresh(schedule)
    return {
        "id": str(schedule.id),
        "title": schedule.title,
        "is_active": schedule.is_active,
    }


@router.delete("/{id}", summary="Delete Report Schedule", status_code=status.HTTP_204_NO_CONTENT)
def delete_report_schedule(
    id: UUID = Path(..., description="Schedule UUID"),
    current_user: User = Depends(RequireRole(["admin", "operator"])),
    db: Session = Depends(get_db),
):
    schedule = db.query(ReportSchedule).filter(ReportSchedule.id == id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Report schedule not found.")

    if current_user.role != "admin" and schedule.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    db.delete(schedule)
    db.commit()
    return None
