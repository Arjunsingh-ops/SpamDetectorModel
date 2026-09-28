"""Stage 6 Smart Routing and Call Forwarding entities migration

Revision ID: 20260926_0006
Revises: 20260926_0005
Create Date: 2026-09-26 21:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '20260926_0006'
down_revision: Union[str, None] = '20260926_0005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. recipient_groups
    op.create_table(
        'recipient_groups',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False, unique=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('routing_strategy', sa.String(length=30), nullable=False, server_default='priority'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 2. recipients
    op.create_table(
        'recipients',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('group_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('recipient_groups.id', ondelete='SET NULL'), nullable=True),
        sa.Column('display_name', sa.String(length=100), nullable=False),
        sa.Column('department', sa.String(length=50), nullable=False, server_default='General'),
        sa.Column('role_title', sa.String(length=100), nullable=True),
        sa.Column('phone_number', sa.String(length=32), nullable=False),
        sa.Column('sip_uri', sa.String(length=255), nullable=True),
        sa.Column('availability_status', sa.String(length=20), nullable=False, server_default='available'),
        sa.Column('business_hours_start', sa.String(length=5), nullable=False, server_default='09:00'),
        sa.Column('business_hours_end', sa.String(length=5), nullable=False, server_default='18:00'),
        sa.Column('time_zone', sa.String(length=50), nullable=False, server_default='Asia/Kolkata'),
        sa.Column('work_days', sa.JSON(), nullable=False),
        sa.Column('routing_priority', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('backup_recipient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('recipients.id', ondelete='SET NULL'), nullable=True),
        sa.Column('allow_warm_transfer', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('enable_voicemail', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('enable_callback_requests', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 3. recipient_availability
    op.create_table(
        'recipient_availability',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('recipient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('recipients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=True),
        sa.Column('updated_by_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('valid_until', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 4. routing_rules
    op.create_table(
        'routing_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('rule_name', sa.String(length=100), nullable=False, unique=True),
        sa.Column('department', sa.String(length=50), nullable=True),
        sa.Column('match_intent_pattern', sa.String(length=255), nullable=True),
        sa.Column('max_spam_score_allowed', sa.Integer(), nullable=False, server_default='69'),
        sa.Column('target_group_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('recipient_groups.id', ondelete='SET NULL'), nullable=True),
        sa.Column('target_recipient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('recipients.id', ondelete='SET NULL'), nullable=True),
        sa.Column('fallback_strategy', sa.String(length=50), nullable=False, server_default='backup_recipient'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 5. routing_decisions
    op.create_table(
        'routing_decisions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('call_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('calls.id', ondelete='CASCADE'), nullable=False),
        sa.Column('caller_intent', sa.String(length=100), nullable=True),
        sa.Column('requested_department', sa.String(length=50), nullable=True),
        sa.Column('requested_recipient_name', sa.String(length=100), nullable=True),
        sa.Column('matched_recipient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('recipients.id', ondelete='SET NULL'), nullable=True),
        sa.Column('spam_score_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('risk_category_used', sa.String(length=20), nullable=False, server_default='LOW'),
        sa.Column('decision_action', sa.String(length=50), nullable=False),
        sa.Column('rule_applied', sa.String(length=100), nullable=True),
        sa.Column('rationale', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 6. voicemail_messages
    op.create_table(
        'voicemail_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('call_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('calls.id', ondelete='CASCADE'), nullable=False),
        sa.Column('recipient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('recipients.id', ondelete='SET NULL'), nullable=True),
        sa.Column('caller_number', sa.String(length=32), nullable=False),
        sa.Column('caller_name', sa.String(length=100), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('audio_url', sa.String(length=255), nullable=True),
        sa.Column('transcript', sa.Text(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('folder', sa.String(length=20), nullable=False, server_default='inbox'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 7. callback_requests
    op.create_table(
        'callback_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('call_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('calls.id', ondelete='CASCADE'), nullable=False),
        sa.Column('recipient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('recipients.id', ondelete='SET NULL'), nullable=True),
        sa.Column('caller_number', sa.String(length=32), nullable=False),
        sa.Column('caller_name', sa.String(length=100), nullable=True),
        sa.Column('requested_department', sa.String(length=50), nullable=True),
        sa.Column('purpose', sa.Text(), nullable=True),
        sa.Column('preferred_time', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('assigned_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('callback_requests')
    op.drop_table('voicemail_messages')
    op.drop_table('routing_decisions')
    op.drop_table('routing_rules')
    op.drop_table('recipient_availability')
    op.drop_table('recipients')
    op.drop_table('recipient_groups')
