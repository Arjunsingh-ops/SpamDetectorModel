"""Comprehensive Spam & Fraud Risk REST API Endpoints."""

from uuid import UUID
from fastapi import APIRouter, Depends, Path, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import RequireRole, get_current_user
from app.models.user import User
from app.models.spam_assessment import SpamAssessment
from app.models.spam_report import SpamReport
from app.models.spam_policy_rule import SpamPolicyRule
from app.models.spam_allowlist_blocklist import SpamAllowlistBlocklist
from app.spam.reputation.local_provider import local_reputation_provider
from app.spam.feedback.service import human_feedback_service
from app.spam.evaluation.metrics import spam_evaluator
from app.schemas.spam import SpamReviewRequest, SpamReviewResponse
from app.spam.schemas import AllowlistBlocklistRequest, SpamRuleCreateRequest, SpamOverviewMetrics

router = APIRouter(prefix="/spam", tags=["Spam & Fraud Engine"])


@router.get("/overview", response_model=SpamOverviewMetrics)
def get_spam_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve aggregate spam screening overview metrics, benchmark metrics, and review stats."""
    eval_res = spam_evaluator.run_benchmark()
    total_calls = db.query(SpamAssessment).count()
    flagged = db.query(SpamAssessment).filter(SpamAssessment.composite_score >= 40).count()
    confirmed_spam = db.query(SpamReport).filter(SpamReport.review_decision == "confirmed_spam").count()
    confirmed_legit = db.query(SpamReport).filter(SpamReport.review_decision == "false_positive").count()
    pending = db.query(SpamAssessment).filter(SpamAssessment.composite_score >= 40, ~SpamAssessment.call_id.in_(
        db.query(SpamReport.call_id)
    )).count()

    return SpamOverviewMetrics(
        total_screened_calls=max(total_calls, eval_res["total_samples"]),
        flagged_for_review=flagged,
        confirmed_spam_calls=confirmed_spam,
        confirmed_legitimate_calls=confirmed_legit,
        pending_reviews=pending,
        false_positives=eval_res["false_positives"],
        false_negatives=eval_res["false_negatives"],
        precision=eval_res["precision"],
        recall=eval_res["recall"],
        f1_score=eval_res["f1_score"],
    )


@router.get("")
@router.get("/")
@router.get("/assessments")
def list_spam_assessments(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all spam risk assessments chronologically."""
    assessments = db.query(SpamAssessment).order_by(SpamAssessment.created_at.desc()).limit(limit).all()
    return assessments


@router.get("/assessments/{id}")
def get_spam_assessment_by_id(
    id: UUID = Path(..., description="Call UUID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve detailed multi-factor risk breakdown for a call."""
    assessment = db.query(SpamAssessment).filter(SpamAssessment.call_id == id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Spam assessment not found for call ID.")
    return assessment


@router.post("/{id}/review", response_model=SpamReviewResponse)
@router.post("/assessments/{id}/review", response_model=SpamReviewResponse)
def submit_spam_review(
    payload: SpamReviewRequest,
    id: UUID = Path(..., description="Call UUID under review"),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "operator", "receptionist"])),
):
    """Submit operator manual review decision (confirmed_spam | false_positive)."""
    res = human_feedback_service.process_review(
        db=db,
        call_id=id,
        review_decision=payload.decision,
        reviewed_by_user_id=current_user.id,
        notes=payload.notes,
        submit_telecom_report=payload.submit_telecom_report,
    )
    return SpamReviewResponse(
        status="success",
        call_id=id,
        review_decision=payload.decision,
        reported_to_authority=payload.submit_telecom_report,
        authority_reference_id=res.get("authority_reference_id"),
        message=f"Review decision successfully recorded as {payload.decision}.",
    )


@router.get("/reports")
def list_spam_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List human review audit logs and telecom regulatory report submissions."""
    reports = db.query(SpamReport).order_by(SpamReport.created_at.desc()).all()
    return reports


@router.get("/rules")
def list_spam_policy_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List active configurable screening rules and scoring weights."""
    rules = db.query(SpamPolicyRule).all()
    return rules


@router.post("/rules", status_code=201)
def create_spam_policy_rule(
    payload: SpamRuleCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"])),
):
    """Create a custom screening policy rule (Admin only)."""
    rule = SpamPolicyRule(
        rule_name=payload.rule_name,
        category=payload.category,
        pattern=payload.pattern,
        weight=payload.weight,
        is_active=payload.is_active,
        description=payload.description,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("/reputation/{number}")
def get_caller_reputation(
    number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Query local reputation database for a phone number."""
    rep_res = local_reputation_provider.evaluate_reputation(number, db)
    return rep_res


@router.post("/allowlist")
def add_to_allowlist(
    payload: AllowlistBlocklistRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "operator"])),
):
    """Add a phone number to authorized tenant allowlist."""
    norm = local_reputation_provider.normalize_e164(payload.phone_number)
    entry = db.query(SpamAllowlistBlocklist).filter(SpamAllowlistBlocklist.phone_number == norm).first()
    if not entry:
        entry = SpamAllowlistBlocklist(phone_number=norm, list_type="allowlist", reason=payload.reason, added_by_user_id=current_user.id)
        db.add(entry)
    else:
        entry.list_type = "allowlist"
        entry.reason = payload.reason
    db.commit()
    return {"status": "success", "phone_number": norm, "list_type": "allowlist"}


@router.post("/blocklist")
def add_to_blocklist(
    payload: AllowlistBlocklistRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin", "operator"])),
):
    """Add a phone number to authorized tenant blocklist."""
    norm = local_reputation_provider.normalize_e164(payload.phone_number)
    entry = db.query(SpamAllowlistBlocklist).filter(SpamAllowlistBlocklist.phone_number == norm).first()
    if not entry:
        entry = SpamAllowlistBlocklist(phone_number=norm, list_type="blocklist", reason=payload.reason, added_by_user_id=current_user.id)
        db.add(entry)
    else:
        entry.list_type = "blocklist"
        entry.reason = payload.reason
    db.commit()
    return {"status": "success", "phone_number": norm, "list_type": "blocklist"}
