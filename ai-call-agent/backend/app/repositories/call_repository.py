"""Call and Event Data Access Repository with Multi-Tenant Ownership Filtering."""

from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.call import Call
from app.models.call_event import CallEvent
from app.models.conversation import Conversation


class CallRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, call_id: UUID, owner_user_id: Optional[UUID] = None) -> Optional[Call]:
        query = self.db.query(Call).filter(Call.id == call_id)
        if owner_user_id:
            query = query.filter(Call.user_id == owner_user_id)
        return query.first()

    def get_by_external_sid(self, external_sid: str) -> Optional[Call]:
        return self.db.query(Call).filter(Call.external_call_sid == external_sid).first()

    def create_call(self, call: Call) -> Call:
        self.db.add(call)
        self.db.commit()
        self.db.refresh(call)
        return call

    def update_call(self, call: Call) -> Call:
        self.db.commit()
        self.db.refresh(call)
        return call

    def list_calls(
        self,
        owner_user_id: Optional[UUID] = None,
        status: Optional[str] = None,
        disposition: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[Call], int]:
        query = self.db.query(Call)

        if owner_user_id:
            query = query.filter(Call.user_id == owner_user_id)

        if status:
            query = query.filter(Call.status == status)

        if disposition:
            query = query.filter(Call.disposition == disposition)

        if search:
            term = f"%{search}%"
            query = query.filter(
                (Call.caller_number.ilike(term)) |
                (Call.caller_name.ilike(term)) |
                (Call.caller_intent.ilike(term))
            )

        total = query.count()
        items = query.order_by(Call.created_at.desc()).offset(offset).limit(limit).all()
        return items, total

    def add_event(self, event: CallEvent) -> CallEvent:
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def get_events_for_call(self, call_id: UUID) -> List[CallEvent]:
        return (
            self.db.query(CallEvent)
            .filter(CallEvent.call_id == call_id)
            .order_by(CallEvent.created_at.asc())
            .all()
        )

    def get_conversation(self, call_id: UUID) -> Optional[Conversation]:
        return self.db.query(Conversation).filter(Conversation.call_id == call_id).first()

    def create_or_update_conversation(self, conversation: Conversation) -> Conversation:
        existing = self.get_conversation(conversation.call_id)
        if existing:
            existing.transcript = conversation.transcript
            existing.summary = conversation.summary
            existing.recording_reference = conversation.recording_reference
            existing.language = conversation.language
            self.db.commit()
            self.db.refresh(existing)
            return existing
        else:
            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)
            return conversation
