"""Human Review Feedback and Allowlist/Blocklist Service."""

import logging
from typing import Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.spam_report import SpamReport
from app.models.spam_allowlist_blocklist import SpamAllowlistBlocklist
from app.models.caller_reputation import CallerReputation
from app.models.call import Call
from app.models.audit_log import AuditLog

logger = logging.getLogger("ai_call_agent.spam.feedback.service")


class HumanFeedbackService:
    """Manages operator manual review actions, false positive corrections, and allowlist/blocklist entries."""

    @staticmethod
    def process_review(
        db: Session,
        call_id: UUID,
        review_decision: str,  # confirmed_spam | false_positive
        reviewed_by_user_id: UUID,
        notes: Optional[str] = None,
        submit_telecom_report: bool = False,
        add_to_allowlist: bool = False,
        add_to_blocklist: bool = False,
    ) -> Dict[str, Any]:
        call = db.query(Call).filter(Call.id == call_id).first()
        if not call:
            return {"success": False, "message": "Call record not found."}

        # Update or create SpamReport
        report = db.query(SpamReport).filter(SpamReport.call_id == call_id).first()
        if not report:
            report = SpamReport(
                call_id=call_id,
                reviewed_by_user_id=reviewed_by_user_id,
                review_decision=review_decision,
                report_status="reviewed",
                reviewer_notes=notes,
            )
            db.add(report)
        else:
            report.review_decision = review_decision
            report.reviewer_notes = notes

        # Update Call status & disposition
        if review_decision == "confirmed_spam":
            call.disposition = "spam"
            call.status = "FLAGGED"
        elif review_decision == "false_positive":
            call.disposition = "legitimate"
            call.status = "COMPLETED"

        # Telecom reporting signoff
        authority_ref = None
        if submit_telecom_report and review_decision == "confirmed_spam":
            import uuid
            authority_ref = f"TRAI-REPORT-{uuid.uuid4().hex[:8].upper()}"
            report.reported_to_telecom_authority = True
            report.authority_reference_id = authority_ref
            report.report_status = "submitted_to_authority"

        # Update CallerReputation counters
        rep = db.query(CallerReputation).filter(CallerReputation.phone_number == call.caller_number).first()
        if not rep:
            rep = CallerReputation(phone_number=call.caller_number)
            db.add(rep)

        if review_decision == "confirmed_spam":
            rep.confirmed_spam_count += 1
        elif review_decision == "false_positive":
            rep.dismissed_spam_count += 1

        # Allowlist / Blocklist placement if requested
        if add_to_allowlist:
            rep.allowlist_status = True
            entry = db.query(SpamAllowlistBlocklist).filter(SpamAllowlistBlocklist.phone_number == call.caller_number).first()
            if not entry:
                db.add(SpamAllowlistBlocklist(phone_number=call.caller_number, list_type="allowlist", reason=notes, added_by_user_id=reviewed_by_user_id))
        elif add_to_blocklist:
            rep.blocklist_status = True
            entry = db.query(SpamAllowlistBlocklist).filter(SpamAllowlistBlocklist.phone_number == call.caller_number).first()
            if not entry:
                db.add(SpamAllowlistBlocklist(phone_number=call.caller_number, list_type="blocklist", reason=notes, added_by_user_id=reviewed_by_user_id))

        # Audit log entry
        audit = AuditLog(
            action=f"SPAM_REVIEW_{review_decision.upper()}",
            resource_type="spam_assessment",
            resource_id=str(call_id),
            actor_id=reviewed_by_user_id,
            payload={"decision": review_decision, "telecom_report": submit_telecom_report, "authority_ref": authority_ref},
        )
        db.add(audit)

        db.commit()
        logger.info(f"Operator review submitted for call {call_id}: decision={review_decision}")
        return {
            "success": True,
            "call_id": str(call_id),
            "review_decision": review_decision,
            "authority_reference_id": authority_ref,
            "message": f"Review recorded as {review_decision}.",
        }


human_feedback_service = HumanFeedbackService()
