"""Stage 5 Spam Engine entities migration

Revision ID: 20260926_0005
Revises: 20260926_0004
Create Date: 2026-09-26 20:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '20260926_0005'
down_revision: Union[str, None] = '20260926_0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create caller_reputations table
    op.create_table(
        'caller_reputations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('phone_number', sa.String(length=32), nullable=False),
        sa.Column('total_calls_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('confirmed_spam_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('dismissed_spam_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('allowlist_status', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('blocklist_status', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('last_contact_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_caller_reputations_phone_number', 'caller_reputations', ['phone_number'], unique=True)

    # Create spam_policy_rules table
    op.create_table(
        'spam_policy_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('rule_name', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False, server_default='semantic'),
        sa.Column('pattern', sa.Text(), nullable=False),
        sa.Column('weight', sa.Integer(), nullable=False, server_default='20'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # Create spam_allowlist_blocklist table
    op.create_table(
        'spam_allowlist_blocklist',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('phone_number', sa.String(length=32), nullable=False),
        sa.Column('list_type', sa.String(length=20), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('added_by_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_spam_allowlist_blocklist_phone_number', 'spam_allowlist_blocklist', ['phone_number'], unique=True)


def downgrade() -> None:
    op.drop_table('spam_allowlist_blocklist')
    op.drop_table('spam_policy_rules')
    op.drop_table('caller_reputations')
