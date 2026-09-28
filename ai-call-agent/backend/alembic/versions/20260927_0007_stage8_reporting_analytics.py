"""Stage 8 Daily Reporting and Advanced Analytics entities migration

Revision ID: 20260927_0007
Revises: 20260926_0006
Create Date: 2026-09-27 21:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '20260927_0007'
down_revision: Union[str, None] = '20260926_0006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. report_schedules
    op.create_table(
        'report_schedules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('report_type', sa.String(length=50), nullable=False),
        sa.Column('frequency', sa.String(length=30), nullable=False, server_default='daily'),
        sa.Column('export_format', sa.String(length=20), nullable=False, server_default='pdf'),
        sa.Column('time_zone', sa.String(length=50), nullable=False, server_default='Asia/Kolkata'),
        sa.Column('delivery_time_utc', sa.String(length=10), nullable=False, server_default='00:00'),
        sa.Column('recipient_emails', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('next_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 2. generated_reports
    op.create_table(
        'generated_reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
        sa.Column('report_schedule_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('report_schedules.id', ondelete='SET NULL'), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('report_type', sa.String(length=50), nullable=False),
        sa.Column('export_format', sa.String(length=20), nullable=False, server_default='pdf'),
        sa.Column('time_zone', sa.String(length=50), nullable=False, server_default='Asia/Kolkata'),
        sa.Column('period_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('period_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='pending'),
        sa.Column('file_path', sa.String(length=512), nullable=True),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('delivery_status', sa.String(length=30), nullable=False, server_default='not_applicable'),
        sa.Column('delivery_error', sa.Text(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('metrics_summary_json', sa.Text(), nullable=True),
        sa.Column('metric_definition_version', sa.String(length=20), nullable=False, server_default='v1.0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('generated_reports')
    op.drop_table('report_schedules')
