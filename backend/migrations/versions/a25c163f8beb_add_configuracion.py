"""add configuracion table

Revision ID: a25c163f8beb
Revises: 6403a2112f82
Create Date: 2026-05-12 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = 'a25c163f8beb'
down_revision: Union[str, Sequence[str], None] = '6403a2112f82'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('configuracion',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('clave', sa.String(length=100), nullable=False),
        sa.Column('valor', sa.String(length=5000), nullable=False),
        sa.Column('updated_by_user_id', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['updated_by_user_id'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id'),
        mysql_collate='utf8mb4_unicode_ci',
    )
    op.create_index('ix_configuracion_clave', 'configuracion', ['clave'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_configuracion_clave', table_name='configuracion')
    op.drop_table('configuracion')
