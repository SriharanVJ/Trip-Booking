"""add email to users

Revision ID: 8c41f2a97b30
Revises: d736186bfe52
Create Date: 2026-09-14
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8c41f2a97b30'
down_revision: Union[str, None] = 'd736186bfe52'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # POC: no production data. Existing rows get a deterministic placeholder
    # derived from their (unique) phone so the NOT NULL + unique index holds;
    # a placeholder marks "email not collected yet" — it is replaced by the
    # real address the next time that account requests an OTP.
    op.add_column('users', sa.Column('email', sa.String(length=255), nullable=False, server_default=''))
    op.execute("UPDATE users SET email = replace(phone, '+', '') || '@phone.placeholder' WHERE email = ''")
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    # Backfill done — future inserts must always supply an email.
    op.alter_column('users', 'email', server_default=None)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_column('users', 'email')
