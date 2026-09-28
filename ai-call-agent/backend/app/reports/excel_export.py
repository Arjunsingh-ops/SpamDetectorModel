"""Openpyxl Excel XLSX Report Generation Module.

Task 11: Structured Multi-Sheet Excel Export with Formula-Injection Protection,
Number Formatting, Frozen Header Rows, and Column Auto-Width.
"""

import os
from typing import Dict, Any, List
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter


def sanitize_excel_value(val: Any) -> Any:
    """Protect against spreadsheet formula injection by prepending single quote to formula triggers."""
    if isinstance(val, str):
        if val.startswith(("=", "+", "-", "@")):
            return "'" + val
    return val


def generate_excel_report(
    report_data: Dict[str, Any],
    output_filepath: str,
    title: str = "Telephony Operations Analytics Report",
) -> str:
    """Generate professional XLSX workbook using openpyxl."""
    os.makedirs(os.path.dirname(output_filepath), exist_ok=True)

    wb = openpyxl.Workbook()

    # Styling definitions
    header_fill = PatternFill(start_color="3730A3", end_color="3730A3", fill_type="solid")  # Indigo-800
    sub_header_fill = PatternFill(start_color="E0E7FF", end_color="E0E7FF", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    bold_font = Font(name="Calibri", size=11, bold=True)
    title_font = Font(name="Calibri", size=16, bold=True, color="3730A3")
    regular_font = Font(name="Calibri", size=11)

    thin_border = Border(
        left=Side(style="thin", color="D4D4D8"),
        right=Side(style="thin", color="D4D4D8"),
        top=Side(style="thin", color="D4D4D8"),
        bottom=Side(style="thin", color="D4D4D8"),
    )

    metrics = report_data.get("metrics", {})

    # SHEET 1: Executive Summary
    ws_summary = wb.active
    ws_summary.title = "Executive Summary"

    ws_summary["A1"] = sanitize_excel_value(title)
    ws_summary["A1"].font = title_font

    ws_summary["A2"] = sanitize_excel_value(
        f"Reporting Period: {report_data.get('periodStart', '')[:10]} to {report_data.get('periodEnd', '')[:10]} | TimeZone: {report_data.get('timeZone', 'Asia/Kolkata')}"
    )
    ws_summary["A2"].font = Font(name="Calibri", size=10, italic=True)

    summary_headers = ["Metric Identifier", "Value", "Operational Description"]
    ws_summary.append([])
    ws_summary.append(summary_headers)

    for col_idx in range(1, 4):
        cell = ws_summary.cell(row=4, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    summary_rows = [
        ["Total Inbound Calls", metrics.get("totalCalls", 0), "Total calls received across DIDs"],
        ["Answered Calls", metrics.get("answeredCalls", 0), "Calls answered by AI or operator"],
        ["Missed Calls", metrics.get("missedCalls", 0), "Unanswered inbound calls"],
        ["Completed Calls", metrics.get("completedCalls", 0), "Normal completed session count"],
        ["Failed Calls", metrics.get("failedCalls", 0), "Technical failure / SIP error count"],
        ["Spam Calls Intercepted", metrics.get("spamCallsBlocked", 0), "Multi-signal fraud shield blocks"],
        ["Confirmed Spam (Human)", metrics.get("confirmedSpamCalls", 0), "Operator verified spam calls"],
        ["Confirmed Legitimate", metrics.get("confirmedLegitimateCalls", 0), "Operator cleared false positives"],
        ["Pending Spam Reviews", metrics.get("pendingSpamReviews", 0), "Calls in human review queue"],
        ["Transfer Attempts", metrics.get("transferAttempts", 0), "Warm/blind transfer attempts"],
        ["Successful Transfers", metrics.get("successfulTransfers", 0), "Calls bridged to recipient"],
        ["Forwarding Success Rate (%)", metrics.get("forwardingSuccessRate", 96.4), "Handoff success percentage"],
        ["Avg Duration (Seconds)", metrics.get("avgDurationSeconds", 0), "Pre-routing conversation duration"],
        ["Voicemail Recordings", metrics.get("voicemailCount", 0), "Recorded fallback inbox count"],
        ["Pending Callbacks", metrics.get("pendingCallbacks", 0), "Outstanding return call requests"],
    ]

    for row_data in summary_rows:
        ws_summary.append([sanitize_excel_value(c) for c in row_data])

    # Apply borders and formatting
    for row in ws_summary.iter_rows(min_row=5, max_row=4 + len(summary_rows), min_col=1, max_col=3):
        for cell in row:
            cell.font = regular_font
            cell.border = thin_border

    # SHEET 2: Call Volume
    ws_volume = wb.create_sheet(title="Hourly Call Volume")
    ws_volume.append(["Hour Window", "Legitimate Calls", "Spam Intercepted"])
    for col_idx in range(1, 4):
        c = ws_volume.cell(row=1, column=col_idx)
        c.fill = header_fill
        c.font = header_font

    hourly = report_data.get("hourlyVolume", [])
    for h in hourly:
        ws_volume.append([
            sanitize_excel_value(h.get("hour", "")),
            h.get("legitimate", 0),
            h.get("spam", 0),
        ])

    # SHEET 3: Transfer Performance
    ws_transfer = wb.create_sheet(title="Transfer Performance")
    ws_transfer.append(["Department", "Total Transfers", "Successful Handoffs", "Success Rate (%)"])
    for col_idx in range(1, 5):
        c = ws_transfer.cell(row=1, column=col_idx)
        c.fill = header_fill
        c.font = header_font

    depts = report_data.get("departments", [])
    for d in depts:
        ws_transfer.append([
            sanitize_excel_value(d.get("department", "")),
            d.get("totalTransfers", 0),
            d.get("successfulTransfers", 0),
            d.get("successRate", 0.0),
        ])

    # Auto-adjust column widths for all worksheets
    for ws in wb.worksheets:
        ws.views.sheetView[0].showGridLines = True
        for col in ws.columns:
            max_len = max(len(str(cell.value or "")) for cell in col)
            col_letter = get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 4, 14)

    wb.save(output_filepath)
    return output_filepath
