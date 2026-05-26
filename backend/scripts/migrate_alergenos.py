"""Migrate allergens data from VARCHAR to normalized tables."""
from database import get_session
from sqlmodel import text

ALERGENOS = [
    "Lácteos", "Huevo", "Gluten", "Maní", "Frutos secos",
    "Soja", "Pescado", "Sésamo", "Mostaza", "Sulfitos",
]

with get_session() as s:
    # Check if we already have allergens
    existing = s.exec(text("SELECT COUNT(*) FROM alergenos")).one()
    if existing == 0:
        for nombre in ALERGENOS:
            s.exec(
                text(
                    "INSERT INTO alergenos (nombre, icono, activo, creado_en, actualizado_en) "
                    "VALUES (:nombre, NULL, TRUE, NOW(), NOW())"
                ),
                {"nombre": nombre},
            )
        print(f"Inserted {len(ALERGENOS)} default allergens")
    else:
        print(f"Allergens table already has {existing} entries")

    # Get alergeno map (case-insensitive)
    rows = s.exec(text("SELECT id, nombre FROM alergenos")).all()
    alergeno_map = {r[1].lower(): r[0] for r in rows}
    print(f"Alergeno map: {alergeno_map}")

    # Migrate existing data
    ingredientes = s.exec(
        text(
            "SELECT id, alergenos FROM ingredientes "
            "WHERE alergenos IS NOT NULL AND alergenos != ''"
        )
    ).all()
    count = 0
    warnings = 0
    for ing_id, alerg_str in ingredientes:
        nombres = [a.strip() for a in alerg_str.split(",") if a.strip()]
        for nombre in nombres:
            key = nombre.lower().strip()
            aid = alergeno_map.get(key)
            if aid:
                s.exec(
                    text(
                        "INSERT IGNORE INTO ingrediente_alergeno "
                        "(ingrediente_id, alergeno_id) VALUES (:iid, :aid)"
                    ),
                    {"iid": ing_id, "aid": aid},
                )
                count += 1
            else:
                print(
                    f"  [!] No se reconoce alergeno '{nombre}' en ingrediente {ing_id}"
                )
                warnings += 1
    print(f"Created {count} ingrediente_alergeno relationships")
    if warnings:
        print(f"{warnings} unmatchable values skipped")
    s.commit()
