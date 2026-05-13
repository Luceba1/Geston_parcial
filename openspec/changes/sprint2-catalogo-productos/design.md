## Context

Actualmente existen los modelos SQLModel para `Categoria`, `Ingrediente`, `Producto`, `ProductoCategoria` y `ProductoIngrediente` en sus respectivos módulos feature. También existen los repositorios base (`BaseRepository`) y específicos (`CategoriaRepository`, `IngredienteRepository`, `ProductoRepository`) que extienden del genérico. Sin embargo:

- Los modelos **no heredan de `BaseModel`** ni tienen campos de auditoría (`creado_en`, `actualizado_en`, `eliminado_en`), lo que causará errores al usar `BaseRepository.update()` y `BaseRepository.soft_delete()`
- No existen **schemas Pydantic** para validación de requests/responses
- No existen **services** con lógica de negocio
- No existen **routers** con endpoints
- El frontend no tiene páginas para gestionar el catálogo

El resto del backend ya está operativo (auth con JWT, rate limiting, manejo de errores RFC 7807, dependencias `get_current_user` y `require_role`).

## Goals / Non-Goals

**Goals:**
- Implementar CRUD completo de categorías (crear, listar jerárquico, editar, soft delete)
- Implementar CRUD completo de ingredientes (crear, listar, editar, soft delete)
- Implementar CRUD completo de productos (crear, listar, editar, soft delete, gestionar stock)
- Implementar endpoints para asociar categorías e ingredientes a productos
- Implementar catálogo público con paginación, filtros y detalle de producto
- Proteger endpoints de administración con roles (Gestor de Stock / ADMIN)
- Crear páginas de frontend para gestión de catálogo (admin) y visualización pública

**Non-Goals:**
- Migraciones de base de datos (las tablas ya existen del Sprint 0)
- Carrito de compras (será otro sprint)
- Pedidos (será otro sprint)
- Integración con MercadoPago (será otro sprint)
- Dashboard de métricas (será otro sprint)

## Decisions

### 1. Extender modelos con campos de auditoría
Los modelos `Categoria`, `Ingrediente` y `Producto` necesitan los campos `creado_en`, `actualizado_en` y `eliminado_en` para ser compatibles con `BaseRepository`. Se agregarán estos campos y se hará que hereden de `BaseModel`.

**Alternativa considerada**: No usar `BaseRepository` y crear repositorios independientes. Se descarta porque rompe la consistencia con el resto del proyecto.

### 2. Arquitectura feature-first (misma que auth)
Cada módulo tendrá su propia carpeta:
- `features/categorias/`: schemas, service, router
- `features/ingredientes/`: schemas, service, router  
- `features/productos/`: schemas, service, router

Los repositorios ya existen en `features/repositories/` y se reutilizarán.

### 3. Catálogo público vs administración
- Endpoints públicos (GET listado, GET detalle) → no requieren autenticación
- Endpoints de administración (POST, PUT, DELETE, PATCH stock) → requieren rol `STOCK` o `ADMIN` mediante `require_role`
- Los roles en BD son `admin`, `cliente`, `repartidor`, `cocinero` — se usará `require_role("admin", "cocinero")` para gestores de stock

### 4. Listado jerárquico de categorías
Se implementará con un endpoint que devuelva la estructura anidada en el backend. La query obtiene todas las categorías activas y las organiza en árbol desde el service, agrupando por `padre_id`.

### 5. Precio como float con validación
Aunque la BD almacena NUMERIC, SQLModel mapea a float de Python. Se validará en el schema Pydantic que el precio tenga máximo 2 decimales y sea > 0.

### 6. Catálogo público con paginación y filtros
Endpoint `GET /api/v1/productos/public` con query params:
- `categoria_id`: filtrar por categoría
- `busqueda`: búsqueda por nombre (ILIKE)
- `excluir_alergenos`: IDs de ingredientes a excluir (separados por coma)
- `page` y `limit`: paginación (default page=1, limit=20)

### 7. Frontend con Feature-Sliced Design
- `pages/CategoriasPage/`: gestión de categorías (admin)
- `pages/IngredientesPage/`: gestión de ingredientes (admin)
- `pages/ProductosPage/`: gestión de productos (admin)
- `pages/CatalogoPage/`: catálogo público
- `pages/ProductoDetallePage/`: detalle de producto
- `widgets/ProductCard/`: componente de tarjeta de producto
- Los formularios reutilizarán `shared/ui/Button`, `shared/ui/Input`, `shared/ui/Card`

## Risks / Trade-offs

- **[Riesgo] Modelos sin campos de auditoría**: Si no se agregan `creado_en`/`actualizado_en`/`eliminado_en` antes de implementar, `BaseRepository.update()` y `soft_delete()` fallarán en runtime → **Mitigación**: Migrar modelos a heredar de `BaseModel` como primer paso de implementación
- **[Riesgo] Tablas existentes sin migración Alembic**: Las tablas ya existen en MySQL pero no hay migración que refleje los campos de auditoría → **Mitigación**: Ejecutar ALTER TABLE manualmente o crear migración inicial
- **[Trade-off] Precio como float en Python**: Aunque la BD usa NUMERIC, el mapeo a float de SQLModel puede perder precisión en cálculos muy grandes. Aceptable para un e-commerce de alimentos con precios en rango típico
- **[Riesgo] Categoría padre eliminada**: Si se soft-deletea una categoría padre, las hijas quedarían huérfanas → **Mitigación**: Validar que no haya subcategorías activas antes de eliminar, y reasignarlas si es necesario
