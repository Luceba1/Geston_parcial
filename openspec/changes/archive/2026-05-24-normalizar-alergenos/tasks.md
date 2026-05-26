## 1. Modelos y base de datos

- [x] 1.1 Crear modelo `Alergeno` en `backend/features/allergens/models.py`
- [x] 1.2 Crear modelo `IngredienteAlergeno` en `backend/features/ingredients/models.py`
- [x] 1.3 Agregar relación `alergenos_rel: List[IngredienteAlergeno]` a `Ingrediente`
- [x] 1.4 Agregar relación `ingredientes_rel: List[IngredienteAlergeno]` a `Alergeno`
- [x] 1.5 Crear migración Alembic: tablas `alergenos` + `ingrediente_alergeno`
- [x] 1.6 Agregar migración de datos: parsear VARCHAR `alergenos` → `ingrediente_alergeno`
- [x] 1.7 Ejecutar `alembic upgrade head`

## 2. Backend — CRUD de alérgenos

- [x] 2.1 Crear `features/allergens/__init__.py`
- [x] 2.2 Crear schemas: `AlergenoCreate`, `AlergenoUpdate`, `AlergenoResponse`
- [x] 2.3 Crear `AllergenService` con CRUD básico
- [x] 2.4 Crear router con endpoints GET/POST/PUT/DELETE
- [x] 2.5 Registrar router en `main.py`
- [x] 2.6 Crear `AlergenoInfo` schema para usar en respuestas públicas

## 3. Backend — Actualizar ingredientes

- [x] 3.1 Modificar `IngredienteCreate.alergenos` → `alergeno_ids: Optional[List[int]]`
- [x] 3.2 Modificar `IngredienteUpdate.alergenos` → `alergeno_ids: Optional[List[int]]`
- [x] 3.3 Modificar `IngredienteResponse` — agregar `alergenos_list: List[AlergenoInfo]`
- [x] 3.4 Actualizar `IngredienteService.create()` para persistir en `ingrediente_alergeno`
- [x] 3.5 Actualizar `IngredienteService.update()` para sincronizar la tabla puente
- [x] 3.6 Actualizar `IngredienteService.get_by_id()` y `list()` para incluir la relación

## 4. Backend — Catálogo y filtro

- [x] 4.1 Modificar `IngredienteInfo` en `products/schemas.py`: reemplazar `alergeno: bool` por `alergenos: List[AlergenoInfo]`
- [x] 4.2 Actualizar `PublicCatalogService._build_public_response()` para resolver alérgenos reales
- [x] 4.3 Modificar `ProductoRepository.search_public()`: cambiar `excluir_alergenos` para filtrar por ID de alérgeno (JOIN con `ingrediente_alergeno`)
- [x] 4.4 Actualizar `PublicCatalogService.list_public()` para pasar IDs de alérgenos

## 5. Frontend — Admin de alérgenos

- [x] 5.1 Crear `src/pages/admin/AlergenosPage.tsx` con tabla CRUD
- [x] 5.2 Agregar ruta `/admin/alergenos` en `routes.tsx`
- [x] 5.3 Agregar link en `Layout.tsx` en el menú de admin

## 6. Frontend — Formulario de ingrediente

- [x] 6.1 Modificar `IngredientesPage.tsx`: en lugar de `ALERGENOS_COMUNES` hardcodeados, fetchear `GET /alergenos`
- [x] 6.2 Actualizar payload de creación/edición para enviar `alergeno_ids: number[]`

## 7. Frontend — Catálogo

- [x] 7.1 Modificar `CatalogoPage.tsx`: fetchear `GET /alergenos` para el dropdown de exclusión
- [x] 7.2 Cambiar el dropdown: agrupar por tipo de alérgeno (no por ingrediente)
- [x] 7.3 Cambiar el parámetro `excluir_alergenos` para enviar IDs de alérgenos

## 8. Frontend — Detalle de producto

- [x] 8.1 Actualizar `ProductoDetallePage.tsx` para mostrar los alérgenos reales
- [x] 8.2 Reemplazar "⚠ alérgeno" por badges con el nombre del alérgeno (ej. "Gluten", "Lácteos")
- [x] 8.3 Actualizar la card de "Información de alérgenos" para mostrar la lista real

## 9. Seeds

- [x] 9.1 Actualizar `seeds/__init__.py`: crear alérgenos normalizados
- [x] 9.2 Vincular ingredientes existentes con alérgenos via `ingrediente_alergeno`

## 10. Verificación

- [x] 10.1 Verificar que `GET /api/v1/alergenos` devuelva los alérgenos activos
- [x] 10.2 Verificar que crear/editar ingrediente persista alérgenos correctamente
- [x] 10.3 Verificar filtro de catálogo excluya por tipo de alérgeno
- [x] 10.4 Verificar detalle de producto muestre alérgenos reales
- [x] 10.5 TypeScript 0 errores ✅
