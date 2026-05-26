"""change mp_payment_id and mp_merchant_order_id to BIGINT

Los IDs de MercadoPago (payment_id) pueden exceder el rango de INT
(2147483647). Por ejemplo: 159975995395 no entra en un INT.
Se cambia a BIGINT para soportar IDs de hasta 9 quintillones.

Revision ID: 3d9e6f2b4d8c
Revises: 2d8e5f1a3c7b
Create Date: 2026-05-23 21:45:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '3d9e6f2b4d8c'
down_revision: Union[str, Sequence[str], None] = '2d8e5f1a3c7b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Cambia mp_payment_id y mp_merchant_order_id de INTEGER a BIGINT."""
    op.alter_column(
        'pagos',
        'mp_payment_id',
        existing_type=sa.Integer(),
        type_=sa.BigInteger(),
        existing_nullable=True,
    )
    op.alter_column(
        'pagos',
        'mp_merchant_order_id',
        existing_type=sa.Integer(),
        type_=sa.BigInteger(),
        existing_nullable=True,
    )


def downgrade() -> None:
    """Vuelve mp_payment_id y mp_merchant_order_id a INTEGER."""
    op.alter_column(
        'pagos',
        'mp_payment_id',
        existing_type=sa.BigInteger(),
        type_=sa.Integer(),
        existing_nullable=True,
    )
    op.alter_column(
        'pagos',
        'mp_merchant_order_id',
        existing_type=sa.BigInteger(),
        type_=sa.Integer(),
        existing_nullable=True,
    )
