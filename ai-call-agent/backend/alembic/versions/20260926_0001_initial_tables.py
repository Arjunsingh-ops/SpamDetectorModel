"""Initial database tables migration

Revision ID: 20260926_0001
Revises: 
Create Date: 2026-09-26 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '20260926_0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='receptionist'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_id', 'users', ['id'], unique=False)

    # 2. phone_numbers
    op.create_table(
        'phone_numbers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('phone_number', sa.String(length=32), nullable=False),
        sa.Column('label', sa.String(length=100), nullable=False, server_default='Primary Reception'),
        sa.Column('forward_to_number', sa.String(length=32), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False, server_default='mock'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_phone_numbers_phone_number', 'phone_numbers', ['phone_number'], unique=True)
    op.create_index('ix_phone_numbers_owner_id', 'phone_numbers', ['owner_id'], unique=False)

    # 3. calls
    op.create_table(
        'calls',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
        sa.Column('phone_number_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('phone_numbers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('external_call_sid', sa.String(length=100), nullable=False),
        sa.Column('caller_number', sa.String(length=32), nullable=False),
        sa.Column('recipient_number', sa.String(length=32), nullable=False),
        sa.Column('direction', sa.String(length=20), nullable=False, server_default='inbound'),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='initiated'),
        sa.Column('disposition', sa.String(length=30), nullable=False, server_default='uncertain'),
        sa.Column('detected_language', sa.String(length=20), nullable=False, server_default='en-IN'),
        sa.Column('caller_name', sa.String(length=255), nullable=True),
        sa.Column('caller_intent', sa.Text(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('spam_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('recording_s3_key', sa.String(length=512), nullable=True),
        sa.Column('transcript_summary', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_calls_external_call_sid', 'calls', ['external_call_sid'], unique=True)
    op.create_index('ix_calls_caller_number', 'calls', ['caller_number'], unique=False)
    op.create_index('ix_calls_status_disposition', 'calls', ['status', 'disposition'], unique=False)
    op.create_index('ix_calls_created_at', 'calls', ['created_at'], unique=False)

    # 4. call_events
    op.create_table(
        'call_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('call_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('calls.id', ondelete='CASCADE'), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('actor', sa.String(length=50), nullable=False, server_default='system'),
        sa.Column('payload', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_call_events_call_id', 'call_events', ['call_id'], unique=False)
    op.create_index('ix_call_events_event_type', 'call_events', ['event_type'], unique=False)

    # 5. spam_assessments
    op.create_table(
        'spam_assessments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('call_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('calls.id', ondelete='CASCADE'), nullable=False),
        sa.Column('composite_score', sa.Integer(), nullable=False),
        sa.Column('reputation_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('semantic_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('behavioral_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('classification', sa.String(length=30), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('detected_triggers', sa.String(length=512), nullable=True),
        sa.Column('ai_rationale', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_spam_assessments_call_id', 'spam_assessments', ['call_id'], unique=True)
    op.create_index('ix_spam_assessments_composite_score', 'spam_assessments', ['composite_score'], unique=False)

    # 6. transfers
    op.create_table(
        'transfers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('call_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('calls.id', ondelete='CASCADE'), nullable=False),
        sa.Column('target_phone_number', sa.String(length=32), nullable=False),
        sa.Column('target_name', sa.String(length=100), nullable=True),
        sa.Column('transfer_type', sa.String(length=30), nullable=False, server_default='warm'),
        sa.Column('transfer_status', sa.String(length=30), nullable=False, server_default='initiated'),
        sa.Column('failure_reason', sa.String(length=100), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_transfers_call_id', 'transfers', ['call_id'], unique=False)

    # 7. spam_reports
    op.create_table(
        'spam_reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('call_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('calls.id', ondelete='CASCADE'), nullable=False),
        sa.Column('reviewed_by_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('review_decision', sa.String(length=50), nullable=False),
        sa.Column('reported_to_telecom_authority', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('authority_reference_id', sa.String(length=100), nullable=True),
        sa.Column('reviewer_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_spam_reports_call_id', 'spam_reports', ['call_id'], unique=True)

    # 8. audit_logs
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('actor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('resource_type', sa.String(length=50), nullable=False),
        sa.Column('resource_id', sa.String(length=64), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'], unique=False)
    op.create_index('ix_audit_logs_resource', 'audit_logs', ['resource_type', 'resource_id'], unique=False)
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('spam_reports')
    op.drop_table('transfers')
    op.drop_table('spam_assessments')
    op.drop_table('call_events')
    op.drop_table('calls')
    op.drop_table('phone_numbers')
    op.drop_table('users')
