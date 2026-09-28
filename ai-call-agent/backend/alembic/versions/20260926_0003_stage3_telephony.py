"""Stage 3 Telephony integration migration

Revision ID: 20260926_0003
Revises: 20260926_0002
Create Date: 2026-09-26 19:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '20260926_0003'
down_revision: Union[str, None] = '20260926_0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add Stage 3 telephony columns to calls table
    op.add_column('calls', sa.Column('telephony_provider', sa.String(length=50), nullable=False, server_default='twilio'))
    op.add_column('calls', sa.Column('provider_call_id', sa.String(length=100), nullable=True))
    op.add_column('calls', sa.Column('stream_id', sa.String(length=100), nullable=True))
    op.add_column('calls', sa.Column('provider_status', sa.String(length=50), nullable=True))
    op.add_column('calls', sa.Column('call_direction', sa.String(length=20), nullable=False, server_default='inbound'))
    op.add_column('calls', sa.Column('destination_number', sa.String(length=32), nullable=True))
    op.add_column('calls', sa.Column('connect_time', sa.DateTime(timezone=True), nullable=True))
    op.add_column('calls', sa.Column('disconnect_reason', sa.String(length=100), nullable=True))
    op.add_column('calls', sa.Column('audio_session_status', sa.String(length=30), nullable=False, server_default='idle'))
    op.add_column('calls', sa.Column('provider_error_code', sa.String(length=50), nullable=True))

    op.create_index('ix_calls_provider_call_id', 'calls', ['provider_call_id'], unique=False)
    op.create_index('ix_calls_stream_id', 'calls', ['stream_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_calls_stream_id', table_name='calls')
    op.drop_index('ix_calls_provider_call_id', table_name='calls')
    op.drop_column('calls', 'provider_error_code')
    op.drop_column('calls', 'audio_session_status')
    op.drop_column('calls', 'disconnect_reason')
    op.drop_column('calls', 'connect_time')
    op.drop_column('calls', 'destination_number')
    op.drop_column('calls', 'call_direction')
    op.drop_column('calls', 'provider_status')
    op.drop_column('calls', 'stream_id')
    op.drop_column('calls', 'provider_call_id')
    op.drop_column('calls', 'telephony_provider')
