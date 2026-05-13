## Context

El Sprint 2 dejó el catálogo completo: categorías jerárquicas, ingredientes con alérgenos, productos con stock, y catálogo público con filtros. El carrito de compras existe como store de Zustand (creado en Sprint 0) pero sin UI. La tabla `direcciones_entrega` existe en BD pero no tiene endpoints ni páginas. El perfil del usuario solo tiene GET /me.

Este sprint implementa la capa de carrito (frontend), el CRUD de direcciones (backend + frontend) y la página de perfil.

## Goals / Non-Goals

**Goals:**
- Carrito de compras funcional: agregar/quitar productos, modificar cantidades, personalizar (excluir ingredientes)
- CRUD completo de direcciones de entrega con dirección predeterminada
- Página de perfil del cliente con edición de datos
- Badge de carrito en navegación
- Botón "Agregar al carrito" en catálogo y detalle de producto

**Non-Goals:**
- Proceso de checkout (Sprint 4)
- Integración con MercadoPago (Sprint 5+)
- Pedidos (Sprint 4)
- Panel de administración de usuarios (Sprint 6+)

## Decisions

### 1. Carrito 100% client-side (Zustand + localStorage)
- **Decisión**: El carrito vive enteramente en el frontend, sin endpoints backend.
- **Por qué**: La regla de negocio RN-CR01 lo especifica. Evita complejidad de sincronización, sesiones anónimas, etc.
- **Implementación**: cartStore existente se amplía con soporte para personalización (excluir ingredientes por ID).

### 2. Personalización como array de IDs de ingredientes a excluir
- **Decisión**: Cada item del carrito tiene un campo `excludedIngredientIds: number[]`.
- **Por qué**: Es el approach más simple. El detalle del pedido futuro almacenará estos IDs como snapshot.
- **Implementación**: Al agregar desde ProductoDetalle, el usuario puede desmarcar ingredientes. Se guardan los IDs de los excluidos.

### 3. CRUD de direcciones con FastAPI estándar
- **Decisión**: Endpoints REST tradicionales con `get_current_user` para ownership.
- **Por qué**: Es el patrón ya establecido en auth y catálogo. Consistente con el resto del proyecto.
- **Implementación**: `DireccionRepository` existe, solo crear schemas, service, router.

### 4. Dirección predeterminada con lógica en service
- **Decisión**: Al crear la primera dirección, se marca como default. Al crear/editar, si se marca como default, se desmarca la anterior.
- **Por qué**: Simple y evita race conditions en el frontend.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| **Carrito no sincronizado entre dispositivos** | Aceptado por diseño (RN-CR01). En futura versión se podría agregar sync server-side. |
| **Personalización perdida si cambian ingredientes** | Se tomará snapshot al crear el pedido (Sprint 4). |
| **Dirección eliminada usada en pedido histórico** | Soft delete: la dirección se marca como eliminada pero no se borra. Los pedidos existentes mantienen su snapshot de dirección. |
