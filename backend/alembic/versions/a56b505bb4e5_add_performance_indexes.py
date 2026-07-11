"""add_performance_indexes

Revision ID: a56b505bb4e5
Revises: 47524e466950
Create Date: 2026-07-11 21:15:33.823306

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a56b505bb4e5'
down_revision: Union[str, Sequence[str], None] = '47524e466950'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'], unique=False)
    op.create_index('ix_applications_email', 'applications', ['email'], unique=False)
    op.create_index('ix_interview_sessions_user_id', 'interview_sessions', ['user_id'], unique=False)
    op.create_index('ix_cover_letters_user_id', 'cover_letters', ['user_id'], unique=False)
    op.create_index('ix_learning_roadmaps_user_id', 'learning_roadmaps', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_learning_roadmaps_user_id', table_name='learning_roadmaps')
    op.drop_index('ix_cover_letters_user_id', table_name='cover_letters')
    op.drop_index('ix_interview_sessions_user_id', table_name='interview_sessions')
    op.drop_index('ix_applications_email', table_name='applications')
    op.drop_index('ix_notifications_user_id', table_name='notifications')
