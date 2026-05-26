"""add_usuario_id_to_historial_estado

Revision ID: f5bc84cf5f6f
Revises: b25c163f8beb
Create Date: 2026-05-21 09:03:55.327099

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f5bc84cf5f6f'
down_revision: Union[str, Sequence[str], None] = 'b25c163f8beb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('historial_estado_pedido', sa.Column('usuario_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_historial_estado_usuario',
        'historial_estado_pedido', 'usuarios',
        ['usuario_id'], ['id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_historial_estado_usuario', 'historial_estado_pedido', type_='foreignkey')
    op.drop_column('historial_estado_pedido', 'usuario_id')
