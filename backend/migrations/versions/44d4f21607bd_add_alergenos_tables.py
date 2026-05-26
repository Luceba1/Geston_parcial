"""add_alergenos_tables + migrate existing data

Revision ID: 44d4f21607bd
Revises: f5bc84cf5f6f
Create Date: 2026-05-21 09:28:30.861635

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '44d4f21607bd'
down_revision: Union[str, Sequence[str], None] = 'f5bc84cf5f6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


ALERGENOS_POR_DEFECTO = [
    "Lácteos", "Huevo", "Gluten", "Maní", "Frutos secos",
    "Soja", "Pescado", "Sésamo", "Mostaza", "Sulfitos",
]


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Crear tabla alergenos
    op.create_table('alergenos',
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False),
        sa.Column('eliminado_en', sa.DateTime(), nullable=True),
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=100), nullable=False),
        sa.Column('icono', sa.String(length=50), nullable=True),
        sa.Column('activo', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nombre')
    )

    # 2. Crear tabla ingrediente_alergeno
    op.create_table('ingrediente_alergeno',
        sa.Column('ingrediente_id', sa.Integer(), nullable=False),
        sa.Column('alergeno_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['alergeno_id'], ['alergenos.id'], ),
        sa.ForeignKeyConstraint(['ingrediente_id'], ['ingredientes.id'], ),
        sa.PrimaryKeyConstraint('ingrediente_id', 'alergeno_id')
    )

    # 3. Insertar alérgenos por defecto
    alergenos_table = sa.table(
        'alergenos',
        sa.column('id', sa.Integer),
        sa.column('nombre', sa.String),
        sa.column('icono', sa.String),
        sa.column('activo', sa.Boolean),
        sa.column('creado_en', sa.DateTime),
        sa.column('actualizado_en', sa.DateTime),
    )
    from datetime import datetime
    now = datetime.utcnow()
    for nombre in ALERGENOS_POR_DEFECTO:
        op.execute(
            alergenos_table.insert().values(
                nombre=nombre,
                icono=None,
                activo=True,
                creado_en=now,
                actualizado_en=now,
            )
        )

    # 4. Migrar datos existentes: parsear ingredientes.alergenos VARCHAR → ingrediente_alergeno
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT id, alergenos FROM ingredientes WHERE alergenos IS NOT NULL AND alergenos != ''")
    )
    rows = result.fetchall()

    # Obtener mapa nombre → id de alérgenos
    alergenos_map = {}
    for nombre in ALERGENOS_POR_DEFECTO:
        res = conn.execute(
            sa.text("SELECT id FROM alergenos WHERE nombre = :nombre"),
            {"nombre": nombre}
        )
        row = res.fetchone()
        if row:
            alergenos_map[nombre.lower().strip()] = row[0]

    insert_count = 0
    warning_count = 0
    for ingrediente_id, alergenos_str in rows:
        nombres = [a.strip() for a in alergenos_str.split(',') if a.strip()]
        for nombre in nombres:
            key = nombre.lower().strip()
            alergeno_id = alergenos_map.get(key)
            if alergeno_id is not None:
                conn.execute(
                    sa.text(
                        "INSERT IGNORE INTO ingrediente_alergeno (ingrediente_id, alergeno_id) "
                        "VALUES (:ingrediente_id, :alergeno_id)"
                    ),
                    {"ingrediente_id": ingrediente_id, "alergeno_id": alergeno_id}
                )
                insert_count += 1
            else:
                print(f"  [!] Alergeno no reconocido en ingrediente {ingrediente_id}: '{nombre}'")
                warning_count += 1

    print(f"  -> {insert_count} relaciones creadas en ingrediente_alergeno")
    if warning_count:
        print(f"  -> {warning_count} valores no matcheados (se omitieron)")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('ingrediente_alergeno')
    op.drop_table('alergenos')
