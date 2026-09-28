"""Stage 4 Voice Agent entities migration

Revision ID: 20260926_0004
Revises: 20260926_0003
Create Date: 2026-09-26 19:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '20260926_0004'
down_revision: Union[str, None] = '20260926_0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create voice_profiles table
    op.create_table(
        'voice_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False, server_default='local_tts'),
        sa.Column('voice_id', sa.String(length=255), nullable=False),
        sa.Column('sample_s3_key', sa.String(length=512), nullable=True),
        sa.Column('language', sa.String(length=20), nullable=False, server_default='en-IN'),
        sa.Column('consent_granted', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('consent_metadata', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_voice_profiles_user_id', 'voice_profiles', ['user_id'], unique=False)

    # Create transcript_segments table
    op.create_table(
        'transcript_segments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('call_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('calls.id', ondelete='CASCADE'), nullable=False),
        sa.Column('speaker', sa.String(length=20), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('language', sa.String(length=20), nullable=False, server_default='en-IN'),
        sa.Column('confidence', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('audio_timestamp_start', sa.Float(), nullable=True),
        sa.Column('audio_timestamp_end', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_transcript_segments_call_id', 'transcript_segments', ['call_id'], unique=False)


def downgrade() -> None:
    op.drop_table('transcript_segments')
    op.drop_table('voice_profiles')
