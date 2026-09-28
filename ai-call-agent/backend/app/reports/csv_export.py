"""CSV Export Generator Module.

Task 12: Streaming CSV Export with Formula Injection Protection and Stable Schema.
"""

import csv
import io
import os
from typing import List, Any, Optional
from sqlalchemy.orm import Session
from app.models.call import Call


def sanitize_csv_field(val: Any) -> str:
    """Sanitize string values to prevent formula injection in CSV readers."""
    if val is None:
        return ""
    s = str(val)
    if s.startswith(("=", "+", "-", "@")):
        s = "'" + s
    return s


def generate_csv_call_export(
    calls: List[Call],
    output_filepath: Optional[str] = None,
    mask_pii: bool = False,
) -> str:
    """Generate CSV report for call history log.

    If output_filepath is provided, writes to file and returns path.
    Otherwise returns raw CSV string.
    """
    headers = [
        "Call ID",
        "External SID",
        "Caller Number",
        "Recipient Number",
        "Direction",
        "Status",
        "Disposition",
        "Detected Language",
        "Caller Name",
        "Caller Intent",
        "Duration Seconds",
        "Spam Score",
        "Started At",
        "Completed At",
    ]

    rows = []
    for c in calls:
        caller = c.caller_number
        if mask_pii and caller and len(caller) >= 6:
            caller = caller[:3] + "••••" + caller[-4:]

        rows.append([
            sanitize_csv_field(str(c.id)),
            sanitize_csv_field(c.external_call_sid),
            sanitize_csv_field(caller),
            sanitize_csv_field(c.recipient_number),
            sanitize_csv_field(c.direction),
            sanitize_csv_field(c.status),
            sanitize_csv_field(c.disposition),
            sanitize_csv_field(c.detected_language),
            sanitize_csv_field(c.caller_name),
            sanitize_csv_field(c.caller_intent),
            c.duration_seconds,
            c.spam_score,
            c.started_at.isoformat() if c.started_at else "",
            c.completed_at.isoformat() if c.completed_at else "",
        ])

    if output_filepath:
        os.makedirs(os.path.dirname(output_filepath), exist_ok=True)
        with open(output_filepath, mode="w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            writer.writerows(rows)
        return output_filepath

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(rows)
    return output.getvalue()


def generate_csv_report(items: List[dict], mask_pii: bool = False) -> str:
    """Generic dictionary list CSV exporter with formula sanitization."""
    if not items:
        return ""
    headers = list(items[0].keys())
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    for item in items:
        row = []
        for k, v in item.items():
            val_str = str(v)
            if mask_pii and "caller" in k.lower() and len(val_str) > 5:
                val_str = "XXX-XXX-1234"
            row.append(sanitize_csv_field(val_str))
        writer.writerow(row)
    return output.getvalue()

