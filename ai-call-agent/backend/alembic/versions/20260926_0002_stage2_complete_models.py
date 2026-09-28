"""Stage 2 complete entities migration

Revision ID: 20260926_0002
Revises: 20260926_0001
Create Date: 2026-09-26 18:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '20260926_0002'
down_revision: Union[str, None] = '20260926_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add status column to users if not exists
    op.add_column('users', sa.Column('status', sa.String(length=30), nullable=False, server_default='active'))

    # Add model_version to spam_assessments
    op.add_column('spam_assessments', sa.Column('model_version', sa.String(length=50), nullable=False, server_default='v1.0.0-heuristics'))

    # Add report_status to spam_reports
    op.add_column('spam_reports', sa.Column('report_status', sa.String(length=50), nullable=False, server_default='reviewed'))

    # Create conversations table
    op.create_table(
        'conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('call_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('calls.id', ondelete='CASCADE'), nullable=False),
        sa.Column('transcript', sa.Text(), nullable=False, server_default=''),
        sa.Column('language', sa.String(length=20), nullable=False, server_default='en-IN'),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('recording_reference', sa.String(length=512), nullable=True),
        sa.Column('entities_extracted', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_conversations_call_id', 'conversations', ['call_id'], unique=True)

    # Create user_settings table
    op.create_table(
        'user_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('forwarding_rules', sa.JSON(), nullable=True),
        sa.Column('working_hours', sa.JSON(), nullable=True),
        sa.Column('preferred_language', sa.String(length=20), nullable=False, server_default='en-IN'),
        sa.Column('notification_settings', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_user_settings_user_id', 'user_settings', ['user_id'], unique=True)

    # Create refresh_tokens table
    op.create_table(
        'refresh_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token_hash', sa.String(length=128), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'], unique=False)
    op.create_index('ix_refresh_tokens_token_hash', 'refresh_tokens', ['token_hash'], unique=True)


def downgrade() -> None:
    op.drop_table('refresh_tokens')
    op.drop_table('user_settings')
    op.drop_table('conversations')
    op.drop_column('spam_reports', 'report_status')
    op.drop_column('spam_assessments', 'model_version')
    op.drop_column('users', 'status')
