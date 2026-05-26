## Context

Actualmente los alérgenos se guardan como texto libre en `ingredientes.alergenos` (VARCHAR(500)). El frontend admin usa 10 checkboxes hardcodeados (`ALERGENOS_COMUNES`). El catálogo agrupa por el string literal y filtra por ID de ingrediente, no por tipo de alérgeno.

### Estado actual

```
ingredientes (tabla)
├── id
├── nombre
├── alergenos VARCHAR(500) ← "Gluten, Lácteos" (texto libre)
```

```
Catálogo: agrupa ingredientes por el string `alergenos`
          → grupo "Gluten", grupo "Lácteos", grupo "Lácteos, Gluten" (separado!)
          → seleccionar un ingrediente excluye SOLO ese ingrediente
          → no hay forma de decir "excluí todo lo que tenga Gluten"
```

### Estado futuro

```
alergenos (nueva tabla)      ingrediente_alergeno (nueva tabla)
├── id                        ├── ingrediente_id (FK)
├── nombre                    ├── alergeno_id (FK)
├── icono (opcional)          └── PK compuesta
└── activo
        │
        ▼
ingredientes (existente — se agrega relación many-to-many)
└── alergenos VARCHAR ← se deja pero deja de usarse
```

## Goals / Non-Goals

**Goals:**

- Normalizar los tipos de alérgenos en una tabla separada con IDs
- Poder excluir por tipo de alérgeno en el catálogo (ej. "excluí todo lo que tenga Gluten")
- Mostrar los alérgenos reales en la ficha del producto ("Contiene: Gluten, Lácteos")
- Admin CRUD de alérgenos (tipos disponibles)
- Formulario de ingrediente trae los alérgenos del backend (no hardcodeados)
- Migrar datos existentes del VARCHAR a la nueva tabla

**Non-Goals:**

- No se elimina la columna `alergenos` de la tabla ingredientes (retrocompatibilidad)
- No se agregan traducciones ni i18n
- No se agregan fotos/iconos complejos a los alérgenos (solo un campo `icono` opcional)
- No se modifica el carrito ni el flujo de checkout

## Decisions

### D01 — Modelo de datos: tabla `alergenos` + tabla puente `ingrediente_alergeno`

**Decisión:** Crear dos tablas nuevas en vez de modificar el VARCHAR existente.

**Alternativa considerada:** Mantener VARCHAR pero usando IDs separados por coma. Se descartó porque no permite integridad referencial ni consultas eficientes con JOINs.

**Modelo:**

```python
class Alergeno(BaseModel, SQLModel, table=True):
    __tablename__ = "alergenos"
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100, unique=True)
    icono: Optional[str] = Field(default=None, max_length=50)
    activo: bool = Field(default=True)

class IngredienteAlergeno(SQLModel, table=True):
    __tablename__ = "ingrediente_alergeno"
    ingrediente_id: int = Field(foreign_key="ingredientes.id", primary_key=True)
    alergeno_id: int = Field(foreign_key="alergenos.id", primary_key=True)
```

### D02 — Relación en Ingrediente: many-to-many con Alergeno

**Decisión:** Agregar `alergenos_rel: List[IngredienteAlergeno] = Relationship(back_populates="ingrediente")` al modelo `Ingrediente`, y similar en `Alergeno`. El campo `alergenos` VARCHAR se deja como está pero deja de utilizarse en la lógica de negocio.

### D03 — CRUD de alérgenos como módulo Feature

**Decisión:** Crear `backend/features/allergens/` con models, schemas, service, router. Endpoints:

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/alergenos` | Lista todos los alérgenos activos |
| POST | `/api/v1/alergenos` | Crear nuevo alérgeno (admin) |
| PUT | `/api/v1/alergenos/{id}` | Actualizar alérgeno (admin) |
| DELETE | `/api/v1/alergenos/{id}` | Eliminar (desactivar) alérgeno (admin) |

`GET /api/v1/alergenos` es público (lo necesita el catálogo). El resto requiere rol admin.

### D04 — Ingrediente schemas: cambiar `alergenos: str` por `alergeno_ids: List[int]`

**Decisión:**

- `IngredienteCreate.alergenos` → `alergeno_ids: Optional[List[int]] = None`
- `IngredienteUpdate.alergenos` → `alergeno_ids: Optional[List[int]] = None`
- `IngredienteResponse.alergenos` se mantiene para retrocompatibilidad, pero se agrega `alergenos_list: List[AlergenoInfo] = []`

Donde:

```python
class AlergenoInfo(BaseModel):
    id: int
    nombre: str
    icono: Optional[str] = None
```

### D05 — Servicio de ingredientes: persistir en la tabla puente

**Decisión:** En `IngredienteService.create()` y `.update()`, recibir `alergeno_ids` y sincronizar la tabla `IngredienteAlergeno`:

```python
# Eliminar relaciones existentes
for rel in ingrediente.alergenos_rel:
    session.delete(rel)
# Crear nuevas
for alergeno_id in alergeno_ids:
    session.add(IngredienteAlergeno(ingrediente_id=ingrediente.id, alergeno_id=alergeno_id))
```

### D06 — Filtro de catálogo: excluir por ID de alérgeno

**Decisión:** El frontend envía `excluir_alergenos=1,2,3` (IDs de **alérgenos**, no de ingredientes). El backend filtra:

```sql
WHERE producto.id NOT IN (
    SELECT pi.producto_id FROM producto_ingredientes pi
    JOIN ingrediente_alergeno ia ON ia.ingrediente_id = pi.ingrediente_id
    WHERE ia.alergeno_id IN (1,2,3)
)
```

**Alternativa considerada:** Seguir filtrando por ID de ingrediente pero resolviendo los ingredientes que tienen el alérgeno. Se descartó porque la subquery con JOIN es más directa y correcta.

### D07 — Product response: incluir alérgenos reales

**Decisión:** `IngredienteInfo` ahora incluye `alergenos: List[AlergenoInfo] = []` en vez de `alergeno: bool`. El `_build_public_response` resuelve los alérgenos a través de `pi.ingrediente.alergenos_rel → alergeno`.

```python
class IngredienteInfo(BaseModel):
    id: int
    nombre: str
    cantidad: float
    alergenos: List[AlergenoInfo] = []  # Antes: alergeno: bool
```

### D08 — Catálogo frontend: dropdown agrupa por tipo de alérgeno

**Decisión:** El dropdown de exclusión en `CatalogoPage` fetchea `GET /alergenos` en lugar de agrupar ingredientes. Cada checkbox es un alérgeno, no un ingrediente. Al seleccionar "Gluten", se excluyen TODOS los productos que contengan cualquier ingrediente con Gluten.

### D09 — Seeds: alérgenos normalizados + relación con ingredientes

**Decisión:** Los seeds crean los 10 alérgenos y vinculan ingredientes existentes. Los nombres coinciden con los del frontend (`ALERGENOS_COMUNES`):

```python
alergenos = ["Lácteos", "Huevo", "Gluten", "Maní", "Frutos secos", ...]
# Harina → Gluten, Leche → Lácteos, Huevo → Huevo, etc.
```

### D10 — Migración de datos: script one-shot

**Decisión:** Se crea un script de migración Alembic que:

1. Crea las tablas `alergenos` e `ingrediente_alergeno`
2. Crea los 10 alérgenos por defecto (los mismos que `ALERGENOS_COMUNES`)
3. Para cada ingrediente con `alergenos IS NOT NULL`, parsea el string, matchea contra los nombres de alérgenos, e inserta en `ingrediente_alergeno`
4. **No elimina** la columna `alergenos` de ingredientes

## Risks / Trade-offs

- **[MIGRACIÓN]** Si hay ingredientes con nombres de alérgenos inventados (ej. "algo raro" escrito a mano) que no matchean ningún alérgeno conocido, se pierde esa información → **Mitigación**: el script de migración loguea los valores no matcheados para revisión manual
- **[RENDIMIENTO]** Las consultas de catálogo ahora requieren dos JOINs más (ingrediente_alergeno + alergenos) → **Mitigación**: son tablas chicas (menos de 100 registros cada una), el impacto es despreciable
- **[RETROCOMPATIBILIDAD]** El campo `alergenos` VARCHAR se mantiene pero puede quedar desactualizado si alguien lo modifica directamente en BD → **Mitigación**: se documenta que el campo está deprecado y se elimina en un futuro change
- **[FRONTEND]** El formulario de ingrediente ahora depende de `GET /alergenos` para mostrar los checkboxes → **Mitigación**: si el endpoint falla, se muestra un mensaje de error, no se rompe el formulario

## Open Questions

- Ninguna por ahora
