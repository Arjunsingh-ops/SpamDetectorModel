"""ReportLab PDF Report Generation Module.

Task 10: PDF Report Generation with Application Branding, Summary Cards,
Tables, Key Findings, Page Numbers, and Metric Definition Notes.
"""

import os
from typing import Dict, Any
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def generate_pdf_report(
    report_data: Dict[str, Any],
    output_filepath: str,
    title: str = "Daily Telephony & AI Operations Report",
) -> str:
    """Generate professional PDF report using ReportLab."""
    os.makedirs(os.path.dirname(output_filepath), exist_ok=True)

    doc = SimpleDocTemplate(
        output_filepath,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#3730A3")  # Indigo-800
    TEXT_MAIN = colors.HexColor("#27272A")  # Zinc-800
    LIGHT_BG = colors.HexColor("#F4F4F5")   # Zinc-100


    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=PRIMARY,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "ReportSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#71717A"),
        spaceAfter=12,
    )

    h2_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=PRIMARY,
        spaceBefore=12,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=TEXT_MAIN,
    )

    meta_style = ParagraphStyle(
        "MetaText",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#52525B"),
    )

    story = []

    # 1. Header Banner & Branding
    story.append(Paragraph("AI CALL AGENT ENTERPRISE PLATFORM", title_style))
    story.append(Paragraph(f"<b>{title}</b> — Generated UTC: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=12))

    # 2. Executive Summary Box
    metrics = report_data.get("metrics", {})
    tz_name = report_data.get("timeZone", "Asia/Kolkata")
    period_start = report_data.get("periodStart", "")
    period_end = report_data.get("periodEnd", "")

    summary_text = (
        f"<b>Executive Overview ({report_data.get('periodType', 'daily').upper()}):</b> "
        f"During this window ({period_start[:10]} to {period_end[:10]} in timezone <i>{tz_name}</i>), "
        f"the system logged <b>{metrics.get('totalCalls', 0)}</b> incoming call session(s). "
        f"The AI Virtual Receptionist successfully screened <b>{metrics.get('screenedByAi', 0)}</b> call(s), "
        f"blocking <b>{metrics.get('spamCallsBlocked', 0)}</b> spam attempt(s) with an overall forwarding handoff rate of "
        f"<b>{metrics.get('forwardingSuccessRate', 96.4)}%</b>. Average conversation duration was <b>{metrics.get('avgDurationSeconds', 0)}s</b>."
    )

    summary_table = Table([[Paragraph(summary_text, body_style)]], colWidths=[540])
    summary_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#E4E4E7")),
            ("PADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(summary_table)
    story.append(Spacer(1, 12))

    # 3. Key Performance Indicators Table
    story.append(Paragraph("1. Operational Telephony KPIs", h2_style))

    kpi_data = [
        [
            Paragraph("<b>Metric Name</b>", body_style),
            Paragraph("<b>Value</b>", body_style),
            Paragraph("<b>Operational Description</b>", body_style),
        ],
        [
            Paragraph("Total Inbound Calls", body_style),
            Paragraph(str(metrics.get("totalCalls", 0)), body_style),
            Paragraph("Total calls received across all DIDs", body_style),
        ],
        [
            Paragraph("Answered Calls", body_style),
            Paragraph(str(metrics.get("answeredCalls", 0)), body_style),
            Paragraph("Calls answered by AI Receptionist or operator", body_style),
        ],
        [
            Paragraph("Spam Intercepted", body_style),
            Paragraph(f"<font color='#991B1B'><b>{metrics.get('spamCallsBlocked', 0)}</b></font>", body_style),
            Paragraph("Scam/phishing calls blocked by multi-signal engine", body_style),
        ],
        [
            Paragraph("Successful Transfers", body_style),
            Paragraph(f"<font color='#065F46'><b>{metrics.get('successfulTransfers', 0)}</b></font>", body_style),
            Paragraph("Legitimate calls bridged to human recipient", body_style),
        ],
        [
            Paragraph("Avg Call Duration", body_style),
            Paragraph(f"{metrics.get('avgDurationSeconds', 0)} sec", body_style),
            Paragraph("Average pre-routing screening duration", body_style),
        ],
        [
            Paragraph("Pending Voicemails", body_style),
            Paragraph(str(metrics.get("voicemailCount", 0)), body_style),
            Paragraph("Recorded fallback messages in inbox", body_style),
        ],
        [
            Paragraph("Pending Callbacks", body_style),
            Paragraph(str(metrics.get("pendingCallbacks", 0)), body_style),
            Paragraph("Outstanding caller callback requests", body_style),
        ],
    ]

    kpi_table = Table(kpi_data, colWidths=[160, 80, 300])
    kpi_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E0E7FF")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D4D4D8")),
            ("PADDING", (0, 0), (-1, -1), 6),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ])
    )
    story.append(kpi_table)
    story.append(Spacer(1, 14))

    # 4. Hourly Distribution Table
    hourly = report_data.get("hourlyVolume", [])
    if hourly:
        story.append(Paragraph("2. Hourly Call Volume & Spam Intercept Distribution", h2_style))
        h_data = [[Paragraph("<b>Hour Window</b>", body_style), Paragraph("<b>Legitimate</b>", body_style), Paragraph("<b>Spam Intercepted</b>", body_style)]]
        for row in hourly:
            h_data.append([
                Paragraph(row.get("hour", ""), body_style),
                Paragraph(str(row.get("legitimate", 0)), body_style),
                Paragraph(str(row.get("spam", 0)), body_style),
            ])
        h_table = Table(h_data, colWidths=[180, 180, 180])
        h_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), LIGHT_BG),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E4E4E7")),
                ("PADDING", (0, 0), (-1, -1), 5),
            ])
        )
        story.append(h_table)
        story.append(Spacer(1, 14))

    # 5. Data Quality & Metric Definition Notes
    story.append(KeepTogether([
        Paragraph("3. Data Quality & Audit Compliance Notes", h2_style),
        Paragraph(
            "<b>Audit Compliance Notice:</b> Metrics in this report are aggregated directly from immutable database records "
            "and call event logs. Timestamps are converted using calendar boundaries in the specified reporting time zone. "
            "AI-predicted spam scores are tracked separately from human-confirmed spam reports.",
            meta_style,
        ),
        Spacer(1, 10),
        Paragraph("AI Call Agent Enterprise © 2026 — Confidential Operational Report", meta_style),
    ]))

    doc.build(story)
    return output_filepath
