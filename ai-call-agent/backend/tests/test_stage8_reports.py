"""Stage 8 Daily Reporting and Advanced Analytics Tests."""

import os
import tempfile
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.reports.service import ReportService
from app.reports.csv_export import generate_csv_report
from app.reports.excel_export import generate_excel_report
from app.reports.pdf_export import generate_pdf_report
from app.analytics.queries import resolve_reporting_window, AnalyticsQueryEngine


def test_reporting_window_resolution():
    start_utc, end_utc, tz_key = resolve_reporting_window(
        period_type="today", tz_name="Asia/Kolkata"
    )
    assert tz_key == "Asia/Kolkata"
    assert start_utc < end_utc
    assert start_utc.tzinfo == timezone.utc
    assert end_utc.tzinfo == timezone.utc


def test_metrics_calculation_with_empty_db(db_session: Session):
    engine = AnalyticsQueryEngine(db_session)
    start_utc, end_utc, _ = resolve_reporting_window("today")
    metrics = engine.aggregate_metrics(start_utc, end_utc)

    assert metrics["totalCalls"] == 0
    assert metrics["answeredCalls"] == 0
    assert metrics.get("avgDurationSeconds", 0.0) == 0.0
    assert metrics.get("forwardingSuccessRate", 0.0) == 0.0


def test_csv_formula_injection_protection():
    calls_data = [
        {
            "id": "1",
            "caller": "9876543210",
            "recipient": "=cmd|' /C calc'!A0",
            "status": "+COMPLETED",
            "disposition": "-spam",
            "duration": 45,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    ]
    csv_str = generate_csv_report(calls_data, mask_pii=True)
    assert "'=cmd" in csv_str
    assert "XXX-XXX-1234" in csv_str


def test_excel_export_generation():
    report_data = {
        "periodType": "today",
        "timeZone": "Asia/Kolkata",
        "periodStart": "2026-09-27T00:00:00Z",
        "periodEnd": "2026-09-27T23:59:59Z",
        "metrics": {
            "totalCalls": 10,
            "answeredCalls": 8,
            "missedCalls": 2,
            "abandonedCalls": 0,
            "completedCalls": 8,
            "failedCalls": 0,
            "simulatedCalls": 2,
            "realTelephoneCalls": 8,
            "screenedByAi": 10,
            "flaggedForReview": 1,
            "spamCallsBlocked": 1,
            "confirmedSpam": 1,
            "confirmedLegitimate": 8,
            "pendingSpamReviews": 0,
            "transferAttempts": 4,
            "successfulTransfers": 4,
            "declinedTransfers": 0,
            "unansweredTransfers": 0,
            "failedTransfers": 0,
            "avgDurationSeconds": 64.5,
            "voicemailsReceived": 1,
            "pendingCallbacks": 0,
            "completedCallbacks": 1,
            "forwardingSuccessRate": 100.0,
        },
        "hourlyVolume": [{"hour": "09:00", "legitimate": 5, "spam": 1}],
        "departments": [{"department": "Sales", "totalTransfers": 4, "successfulTransfers": 4, "successRate": 100.0}],
        "recipients": [],
    }

    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
        path = tmp.name

    try:
        res_path = generate_excel_report(report_data, output_filepath=path, title="Daily Operations Report")
        assert os.path.exists(res_path)
        assert os.path.getsize(res_path) > 500
    finally:
        if os.path.exists(path):
            os.remove(path)


def test_pdf_export_generation():
    report_data = {
        "periodType": "today",
        "timeZone": "Asia/Kolkata",
        "periodStart": "2026-09-27T00:00:00Z",
        "periodEnd": "2026-09-27T23:59:59Z",
        "metrics": {
            "totalCalls": 15,
            "answeredCalls": 12,
            "missedCalls": 3,
            "abandonedCalls": 0,
            "completedCalls": 12,
            "failedCalls": 0,
            "simulatedCalls": 5,
            "realTelephoneCalls": 10,
            "screenedByAi": 15,
            "flaggedForReview": 2,
            "spamCallsBlocked": 2,
            "confirmedSpam": 2,
            "confirmedLegitimate": 10,
            "pendingSpamReviews": 0,
            "transferAttempts": 5,
            "successfulTransfers": 4,
            "declinedTransfers": 1,
            "unansweredTransfers": 0,
            "failedTransfers": 0,
            "avgDurationSeconds": 52.0,
            "voicemailsReceived": 2,
            "pendingCallbacks": 1,
            "completedCallbacks": 1,
            "forwardingSuccessRate": 80.0,
        },
        "hourlyVolume": [{"hour": "10:00", "legitimate": 8, "spam": 2}],
        "departments": [{"department": "Support", "totalTransfers": 5, "successfulTransfers": 4, "successRate": 80.0}],
        "recipients": [],
    }

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        path = tmp.name

    try:
        res_path = generate_pdf_report(report_data, output_filepath=path, title="Daily Executive Report")
        assert os.path.exists(res_path)
        assert os.path.getsize(res_path) > 1000
    finally:
        if os.path.exists(path):
            os.remove(path)


def test_report_service_creation_and_download(db_session: Session):
    service = ReportService(db_session)
    job = service.create_report_job(
        report_type="daily",
        export_format="pdf",
        time_zone="Asia/Kolkata",
    )
    assert job.id is not None
    assert job.status == "pending"

    completed = service.generate_report_file(job.id)
    assert completed.status == "completed"
    assert os.path.exists(completed.file_path)


def test_report_endpoints_and_schedules(client: TestClient):
    # 1. Post report request
    gen_resp = client.post(
        "/api/v1/reports",
        json={
            "report_type": "daily",
            "period_type": "today",
            "export_format": "pdf",
            "time_zone": "Asia/Kolkata",
        },
    )
    assert gen_resp.status_code in (200, 201)
    gen_data = gen_resp.json()
    report_id = gen_data["id"]
    assert gen_data["status"] in ("pending", "completed")

    # 2. Get reports list
    list_resp = client.get("/api/v1/reports")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1

    # 3. Download report file
    dl_resp = client.get(f"/api/v1/reports/{report_id}/download")
    assert dl_resp.status_code in (200, 202)

    # 4. Create Schedule
    sched_resp = client.post(
        "/api/v1/report-schedules",
        json={
            "title": "Daily Morning Summary",
            "report_type": "daily",
            "frequency": "daily",
            "export_format": "xlsx",
            "time_zone": "Asia/Kolkata",
            "delivery_time_utc": "08:00",
            "recipient_emails": "analytics@company.com,ops@company.com",
        },
    )
    assert sched_resp.status_code in (200, 201)
    sched_data = sched_resp.json()
    schedule_id = sched_data["id"]
    assert sched_data["title"] == "Daily Morning Summary"

    # 5. List schedules
    list_sched = client.get("/api/v1/report-schedules")
    assert list_sched.status_code == 200
    assert len(list_sched.json()) >= 1

    # 6. Delete schedule
    del_resp = client.delete(f"/api/v1/report-schedules/{schedule_id}")
    assert del_resp.status_code in (200, 204)
