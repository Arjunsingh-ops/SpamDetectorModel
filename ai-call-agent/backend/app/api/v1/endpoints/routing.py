"""Routing Policies and Rules REST API Endpoints."""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import RequireRole, get_current_user
from app.models.user import User
from app.models.routing_policy import RoutingRule, RoutingDecision
from app.routing.schemas import RoutingRuleSchema

router = APIRouter(prefix="/routing", tags=["Smart Call Routing"])


@router.get("/rules")
def list_routing_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all active configurable smart routing rules."""
    rules = db.query(RoutingRule).filter(RoutingRule.is_active.is_(True)).all()
    return rules


@router.put("/rules")
def update_routing_rules(
    rules: List[RoutingRuleSchema],
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"])),
):
    """Update system-wide smart call routing rules."""
    db.query(RoutingRule).delete()
    for rule in rules:
        r = RoutingRule(**rule.model_dump())
        db.add(r)
    db.commit()
    return {"message": f"Successfully updated {len(rules)} routing rules."}


@router.get("/decisions")
def list_routing_decisions(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List audit log of smart routing decisions."""
    decisions = db.query(RoutingDecision).order_by(RoutingDecision.created_at.desc()).limit(limit).all()
    return decisions
