"""Callback Request Management Service."""

import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.callback_request import CallbackRequest

logger = logging.getLogger("ai_call_agent.services.callback")


class CallbackService:
    """Manages callback request queues, assignment, and status updates."""

    @staticmethod
    def get_callbacks(
        db: Session,
        status: Optional[str] = None,
        recipient_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[CallbackRequest]:
        query = db.query(CallbackRequest)
        if status:
            query = query.filter(CallbackRequest.status == status)
        if recipient_id:
            query = query.filter(CallbackRequest.recipient_id == recipient_id)
        return query.order_by(CallbackRequest.created_at.desc()).limit(limit).all()

    @staticmethod
    def update_callback_status(
        db: Session,
        callback_id: str,
        status: str,
        resolution_notes: Optional[str] = None,
        assigned_user_id: Optional[str] = None,
    ) -> Optional[CallbackRequest]:
        cb = db.query(CallbackRequest).filter(CallbackRequest.id == callback_id).first()
        if cb:
            cb.status = status
            if resolution_notes:
                cb.resolution_notes = resolution_notes
            if assigned_user_id:
                cb.assigned_user_id = assigned_user_id
            db.commit()
            db.refresh(cb)
        return cb


callback_service = CallbackService()
