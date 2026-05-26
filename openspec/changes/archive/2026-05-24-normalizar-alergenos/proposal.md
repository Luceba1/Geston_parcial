## Why

El sistema actual de alérgenos usa un campo de texto libre (`alergenos VARCHAR`) en la tabla `ingredientes`, donde se guardan nombres separados por coma. Esto impide:

- Filtrar en el catálogo por **tipo de alérgeno** (ej. "excluí todo lo que tenga Gluten"). Hoy solo se excluye por **ID de ingrediente** individual.
- Que los nombres de alérgenos sean consistentes (seed usa `"gluten"`, frontend admin usa `"Gluten"`).
- Mostrar en la ficha del producto **qué alérgenos específicos** contiene, no solo un booleano genérico.
- Escalar a futuro (iconos, traducciones, grupos).

## What Changes

1. **Crear tabla `alergenos`** — entidad normalizada con `id`, `nombre`, `icono` (opcional), `activo`.
2. **Crear tabla `ingrediente_alergeno`** — relación muchos-a-muchos entre ingredientes y alérgenos.
3. **Migrar datos existentes** — parsear el campo `alergenos` de cada ingrediente y poblarlo en la nueva tabla. El campo `alergenos` deja de usarse.
4. **Admin de alérgenos** — CRUD de alérgenos en el panel admin para gestionar los tipos disponibles.
5. **Formulario de ingrediente** — en vez de checkboxes hardcodeados, fetchea los alérgenos del backend y persiste la relación en la tabla puente.
6. **GET /api/v1/productos/public** — devuelve los alérgenos reales de cada producto (resueltos a través de sus ingredientes), no solo un booleano.
7. **Filtro de catálogo** — excluye por **ID de alérgeno** en vez de por ID de ingrediente. El dropdown agrupa por tipo de alérgeno.
8. **Detalle de producto** — muestra la lista real de alérgenos ("Contiene: Gluten, Lácteos") en vez de "⚠ alérgeno".
9. **Seeds actualizados** — usan la nueva tabla de alérgenos.

## Capabilities

### New Capabilities
- `gestion-alergenos`: CRUD de alérgenos, asignación a ingredientes, migración de datos existentes.
- `catalog-allergen-filter`: Filtro por tipo de alérgeno en el catálogo público, exclusión por ID de alérgeno.

### Modified Capabilities
- Ninguna (no hay specs previas).

## Impact

- **Backend**: Nuevos modelos (`Alergeno`, `IngredienteAlergeno`), migración Alembic, nuevos endpoints CRUD (`/api/v1/alergenos`), cambios en `ProductoRepository.search_public` y `PublicCatalogService._build_public_response`.
- **Frontend**: Admin de alérgenos (página nueva), formulario de ingrediente modificado, catálogo filtro modificado, detalle de producto modificado.
- **Base de datos**: Nuevas tablas `alergenos` e `ingrediente_alergeno`. Migración de datos del campo `alergenos` VARCHAR a la tabla puente. No se elimina la columna para mantener retrocompatibilidad.
