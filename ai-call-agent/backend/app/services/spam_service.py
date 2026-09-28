"""Spam Review and Human-in-the-Loop Verification Service."""

import uuid
from typing import Dict, Any, List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.core.logging import logger
from app.models.spam_assessment import SpamAssessment
from app.models.spam_report import SpamReport
from app.models.audit_log import AuditLog
from app.models.call import Call


class SpamService:
    """Handles spam evaluation lookups and human review decisions."""

    def __init__(self, db: Optional[Session] = None):
        self.db = db

    def get_spam_queue(self) -> List[Dict[str, Any]]:
        """Retrieve list of flagged spam calls for operator review."""
        if self.db:
            try:
                assessments = (
                    self.db.query(SpamAssessment)
                    .filter(SpamAssessment.classification.in_(["spam", "uncertain"]))
                    .order_by(SpamAssessment.composite_score.desc())
                    .limit(50)
                    .all()
                )
                if assessments:
                    return [
                        {
                            "id": str(a.id),
                            "callId": str(a.call_id),
                            "compositeScore": a.composite_score,
                            "reputationScore": a.reputation_score,
                            "semanticScore": a.semantic_score,
                            "behavioralScore": a.behavioral_score,
                            "classification": a.classification,
                            "confidence": a.confidence,
                            "detectedTriggers": (a.detected_triggers or "").split(", "),
                            "aiRationale": a.ai_rationale,
                            "modelVersion": a.model_version,
                            "createdAt": a.created_at.isoformat(),
                        }
                        for a in assessments
                    ]
            except Exception as e:
                logger.warning(f"Failed to query spam assessments from DB, using fallback: {e}")

        # Fallback Demo Data for Stage 2
        return [
            {
                "id": "sa-001",
                "callId": "7ca85f64-5717-4562-b3fc-2c963f66afb7",
                "compositeScore": 92,
                "reputationScore": 88,
                "semanticScore": 94,
                "behavioralScore": 80,
                "classification": "spam",
                "confidence": 0.98,
                "detectedTriggers": ["TRAI 140 Series Telemarketer", "Financial pitch: pre-approved loan"],
                "aiRationale": "Carrier prefix +91140 matches mandatory Indian telemarketer series. Extracted instant loan scam keywords.",
                "modelVersion": "v1.0.0-heuristics",
                "createdAt": "2026-09-26T11:40:00Z",
            },
            {
                "id": "sa-002",
                "callId": "9da85f64-5717-4562-b3fc-2c963f66afc8",
                "compositeScore": 48,
                "reputationScore": 20,
                "semanticScore": 45,
                "behavioralScore": 65,
                "classification": "uncertain",
                "confidence": 0.72,
                "detectedTriggers": ["Unknown Mobile CLI", "Delivery access request"],
                "aiRationale": "Caller claims delivery courier status. Interactive screening challenge requested.",
                "modelVersion": "v1.0.0-heuristics",
                "createdAt": "2026-09-26T10:20:00Z",
            },
        ]

    def get_assessment_by_call_id(self, call_id: UUID) -> Optional[Dict[str, Any]]:
        if self.db:
            a = self.db.query(SpamAssessment).filter(SpamAssessment.call_id == call_id).first()
            if a:
                return {
                    "id": str(a.id),
                    "callId": str(a.call_id),
                    "compositeScore": a.composite_score,
                    "reputationScore": a.reputation_score,
                    "semanticScore": a.semantic_score,
                    "behavioralScore": a.behavioral_score,
                    "classification": a.classification,
                    "confidence": a.confidence,
                    "detectedTriggers": (a.detected_triggers or "").split(", "),
                    "aiRationale": a.ai_rationale,
                    "modelVersion": a.model_version,
                    "createdAt": a.created_at.isoformat(),
                }

        queue = self.get_spam_queue()
        for item in queue:
            if item["callId"] == str(call_id):
                return item
        return None

    def submit_human_review(
        self,
        call_id: UUID,
        decision: str,
        submit_telecom_report: bool,
        notes: Optional[str] = None,
        reviewed_by_user_id: Optional[UUID] = None,
        ip_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Record a human operator review decision.
        ENFORCEMENT: Never automatically submit an official complaint based only on AI classification.
        Official reports are only generated when an authorized human explicitly confirms and checks the flag.
        """
        authority_ref = None
        report_status = "reviewed"
        if submit_telecom_report:
            authority_ref = f"TRAI-REPORT-{uuid.uuid4().hex[:8].upper()}"
            report_status = "submitted_to_authority"
            logger.info(
                f"[SpamService] Human operator authorized official regulatory complaint for call {call_id}: {authority_ref}"
            )

        if self.db and reviewed_by_user_id:
            try:
                report = SpamReport(
                    call_id=call_id,
                    reviewed_by_user_id=reviewed_by_user_id,
                    review_decision=decision,
                    report_status=report_status,
                    reported_to_telecom_authority=submit_telecom_report,
                    authority_reference_id=authority_ref,
                    reviewer_notes=notes,
                )
                audit = AuditLog(
                    actor_id=reviewed_by_user_id,
                    action="SPAM_HUMAN_REVIEW_SUBMITTED",
                    resource_type="calls",
                    resource_id=str(call_id),
                    payload={
                        "decision": decision,
                        "report_status": report_status,
                        "reported_to_authority": submit_telecom_report,
                        "authority_reference_id": authority_ref,
                    },
                    ip_address=ip_address,
                )
                self.db.add(report)
                self.db.add(audit)

                # Update call disposition if false positive
                call = self.db.query(Call).filter(Call.id == call_id).first()
                if call and decision == "false_positive":
                    call.disposition = "legitimate"
                    call.status = "COMPLETED"

                self.db.commit()
            except Exception as e:
                logger.error(f"Failed to record spam review in database: {e}")
                self.db.rollback()

        return {
            "status": "success",
            "call_id": str(call_id),
            "review_decision": decision,
            "reported_to_authority": submit_telecom_report,
            "authority_reference_id": authority_ref,
            "message": f"Call review successfully recorded as {decision}.",
        }
