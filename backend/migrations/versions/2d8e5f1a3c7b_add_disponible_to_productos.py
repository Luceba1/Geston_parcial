"""add disponible field to productos

Revision ID: 2d8e5f1a3c7b
Revises: 44d4f21607bd
Create Date: 2026-05-23 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2d8e5f1a3c7b'
down_revision: Union[str, Sequence[str], None] = '44d4f21607bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Agrega columna disponible a productos (US-COCINA-07)."""
    op.add_column(
        'productos',
        sa.Column(
            'disponible',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('1'),
            comment='Disponible para la venta (lo puede togglear cocina)',
        ),
    )


def downgrade() -> None:
    """Elimina columna disponible."""
    op.drop_column('productos', 'disponible')
