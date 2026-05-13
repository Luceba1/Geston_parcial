## Context

El sistema ya tiene implementados los features de auth, catálogo, carrito, direcciones y pedidos (Sprints 0-4). Las páginas de administración existentes cubren gestión de catálogo (CategoriasPage, IngredientesPage, ProductosPage) y pedidos (PedidosPage), pero:

1. **No hay dashboard**: La ruta `/admin` es un Placeholder. El Admin no tiene métricas ni visibilidad del negocio.
2. **No hay gestión de usuarios**: No hay forma de listar, editar roles, activar/desactivar usuarios.
3. **No hay configuración**: No hay forma de ajustar parámetros del sistema sin tocar código.

El modelo `Usuario` ya tiene campo `activo: bool` y `es_superadmin`. El repositorio base (`BaseRepository`) está implementado con create, update, soft_delete, count. El Unit of Work ya expone `usuarios` y `roles`.

Se necesita una feature `admin/` independiente con sus propios endpoints bajo prefijo `/api/admin/`, queries de agregación SQL, y frontend con Recharts.

## Goals / Non-Goals

**Goals:**
- Backend: Feature `admin/` con schemas, service y router para usuarios, métricas y configuración
- Backend: Endpoints REST para métricas (resumen, ventas por periodo, top productos, pedidos por estado)
- Backend: Endpoints REST para gestión de usuarios (listar con filtros, editar rol, activar/desactivar)
- Backend: Endpoints REST para configuración del sistema (key-value con auditoría)
- Frontend: DashboardPage con cards de resumen + gráficos Recharts (LineChart, BarChart, PieChart)
- Frontend: UsuariosPage con tabla, búsqueda, filtros, edición de roles y toggle activo/inactivo
- Frontend: ConfigPage con formulario de parámetros del sistema
- Actualizar rutas: reemplazar PlaceholderPages en `/admin`, `/admin/usuarios`, `/admin/config`

**Non-Goals:**
- NO se modifican los features existentes (auth, catálogo, pedidos, etc.) — solo se agrega `admin/`
- NO se implementan pagos con MercadoPago (es otro sprint)
- NO se implementan notificaciones en tiempo real (WebSockets)
- NO se agrega exportación de datos (CSV/Excel)

## Decisions

### 1. Feature `admin/` separado vs endpoints dispersos
**Decisión:** Crear `backend/features/admin/` con schemas, service y router propio.
**Rationale:** Es un dominio transversal que consulta múltiples tablas. Tenerlo como feature separado mantiene la arquitectura feature-first limpia. El prefijo `/api/admin/` lo distingue claramente de los endpoints de negocio (`/api/v1/`).
**Alternativa considerada:** Dispersar endpoints en cada feature (ej. GET /api/v1/usuarios en auth). Descartado porque mezcla responsabilidades y diluye la separación admin vs client-api.

### 2. Queries de métricas: SQLModel vs SQL puro
**Decisión:** Usar SQLModel para queries simples (listar usuarios) y `text()` SQL para agregaciones.
**Rationale:** Las métricas requieren `SUM`, `COUNT`, `GROUP BY`, `DATE_TRUNC` que SQLModel no expresa bien. Usar SQL puro con `text()` es más legible y performante para estas queries.
**Ejemplo:**
```python
# Métricas: total ventas del período
query = text("""
    SELECT COALESCE(SUM(total), 0) as total_ventas,
           COUNT(*) as cantidad_pedidos
    FROM pedidos
    WHERE fecha_pedido BETWEEN :desde AND :hasta
      AND estado_id IN (SELECT id FROM estados_pedido WHERE nombre = 'entregado')
""")
```

### 3. Autenticación: `require_role("admin")` existente
**Decisión:** Todos los endpoints de `/api/admin/` usan `require_role("admin")` del sistema existente. No se crea nueva lógica de auth.
**Rationale:** Ya existe `require_role` en `backend/features/auth/requires.py` que funciona con HTTPBearer. Los roles están en BD: admin, cliente, repartidor, cocinero.

### 4. Modelo Configuracion: tabla key-value vs archivo
**Decisión:** Nueva tabla `configuracion` con clave-valor + auditoría.
**Rationale:** Permite cambios en caliente sin reiniciar el servidor y mantiene historial de quién modificó qué.
**Campos:** `id`, `clave` (unique), `valor` (text), `updated_by_user_id`, `updated_at`.

### 5. Frontend: Recharts vs Chart.js
**Decisión:** Usar Recharts (ya está en package.json).
**Rationale:** Ya está instalado como dependencia en el proyecto. Es declarativo, se integra bien con React y tiene los tipos de gráficos que necesitamos (LineChart, BarChart, PieChart).

### 6. Dashboard: fetch en mount vs TanStack Query
**Decisión:** Usar TanStack Query con staleTime configurable.
**Rationale:** Ya está en el proyecto. Permite refetch al cambiar filtro de fechas, caché automática, y estados loading/error.
**Estructura:** Un hook `useAdminMetrics` que acepta `{desde, hasta}` como parámetros.

## Arquitectura

```
backend/features/admin/
├── __init__.py
├── schemas.py        → UserResponse, UserUpdateRequest, EstadoUpdateRequest,
│                        MetricasResumen, VentasPorPeriodo, TopProducto,
│                        PedidosPorEstado, ConfigCreate, ConfigResponse
├── service.py        → AdminService: list_users, update_user, toggle_user_status,
│                        get_resumen, get_ventas, get_top_productos,
│                        get_pedidos_por_estado, get_config, update_config
└── router.py         → 8 endpoints bajo /api/admin/

frontend/src/pages/admin/
├── DashboardPage.tsx  → Cards + Recharts (LineChart, BarChart, PieChart)
├── UsuariosPage.tsx   → Tabla + búsqueda + modal edición + toggle activo
├── ConfigPage.tsx     → Formulario de parámetros del sistema
└── index.ts           → Barrel export

frontend/src/app/routes.tsx  → Reemplazar PlaceholderPages
```

### Endpoints

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/usuarios` | Listar usuarios (paginado, búsqueda, filtro rol) | Admin |
| PUT | `/api/admin/usuarios/{id}` | Editar datos/roles de usuario | Admin |
| PATCH | `/api/admin/usuarios/{id}/estado` | Activar/desactivar usuario | Admin |
| GET | `/api/admin/metricas/resumen` | Dashboard: cards de resumen | Admin |
| GET | `/api/admin/metricas/ventas` | Evolución ventas (granularidad) | Admin |
| GET | `/api/admin/metricas/productos-top` | Top productos más vendidos | Admin |
| GET | `/api/admin/metricas/pedidos-por-estado` | Distribución pedidos x estado | Admin |
| GET | `/api/admin/configuracion` | Obtener configuraciones | Admin |
| PUT | `/api/admin/configuracion` | Actualizar configuraciones | Admin |

## Risks / Trade-offs

- **[Riesgo] Rendimiento en métricas**: Las queries de agregación sobre `pedidos` y `detalles_pedido` pueden degradarse con muchos datos.
  → **Mitigación**: Índices en `pedidos.fecha_pedido`, `pedidos.estado_id`. Si escala, se puede agregar una tabla de métricas precalculadas.

- **[Riesgo] Último admin**: Permitir que un admin se quite el rol ADMIN a sí mismo si es el último.
  → **Mitigación**: Validar en backend: antes de remover el rol ADMIN, verificar que quede al menos otro admin activo.

- **[Riesgo] Reactividad de roles**: Cuando un admin cambia el rol de un usuario, ese usuario sigue con su token JWT actual (30 min de validez).
  → **Mitigación**: Invalidar refresh tokens del usuario modificado (ya existe `revoke_all_by_user` en RefreshTokenRepository).

- **[Trade-off] Config en BD vs .env**: Guardar config en BD es más flexible pero puede ser inconsistente si hay múltiples instancias.
  → **Decisión**: Como es un solo servidor, BD es aceptable. Si escala, migrar a Redis o similar.

## Open Questions

- ¿Los horarios de atención y zonas de entrega se definen como JSON en un solo campo `valor`, o como filas separadas por clave? 
  → **Decisión tomada**: Una fila por clave (`horarios_atencion`, `zona_entrega`, `mensaje_sistema`), con `valor` como JSON string. Simple y extensible.
