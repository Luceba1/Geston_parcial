## Why

El sistema tiene páginas de administración para catálogo (categorías, ingredientes, productos) y pedidos, pero carece de un **dashboard central con métricas** y de **gestión de usuarios**. Sin un panel de administración completo, el Admin no puede tomar decisiones informadas sobre el negocio ni gestionar el acceso al sistema. El dashboard con métricas (ventas, pedidos por estado, top productos) y la administración de usuarios son funcionalidades esenciales para que la plataforma sea operativamente viable.

## What Changes

### Backend — Nuevo feature `admin/`
- **GET /api/admin/usuarios**: Listar usuarios con paginación, búsqueda (nombre/email) y filtro por rol
- **PUT /api/admin/usuarios/{id}**: Editar datos y roles de un usuario (con protección: no degradar al último admin)
- **PATCH /api/admin/usuarios/{id}/estado**: Activar/desactivar usuario (invalida tokens si se desactiva)
- **GET /api/admin/metricas/resumen**: Dashboard general — total ventas, pedidos por estado, usuarios registrados, productos más vendidos del período
- **GET /api/admin/metricas/ventas**: Evolución de ventas por día/semana/mes (granularidad variable)
- **GET /api/admin/metricas/productos-top**: Ranking de productos más vendidos (top N configurable)
- **GET /api/admin/metricas/pedidos-por-estado**: Distribución de pedidos por estado (para gráfico de torta/barras)
- **GET/PUT /api/admin/configuracion**: Gestión de configuraciones del sistema (horarios, zonas de entrega, etc.)

### Frontend — Nuevas páginas admin
- **DashboardPage** (`/admin`): Cards con métricas generales + gráficos (Recharts: LineChart de ventas, BarChart de top productos, PieChart de pedidos por estado) + selector de rango de fechas
- **UsuariosPage** (`/admin/usuarios`): Tabla con búsqueda, filtro por rol, edición inline/modal, toggle activo/inactivo
- **ConfigPage** (`/admin/config`): Formulario de configuraciones del sistema (baja prioridad)

### Modificaciones a rutas existentes
- Reemplazar `PlaceholderPage` en `/admin` con el DashboardPage real
- Las rutas `/admin/usuarios` y `/admin/config` ya existen en el Layout como nav items, solo apuntan a Placeholder — reemplazar con las páginas reales

## Capabilities

### New Capabilities
- `admin-metrics`: Endpoints de métricas y dashboard (resumen, ventas por periodo, top productos, pedidos por estado)
- `admin-users`: CRUD de usuarios del sistema (listar, editar rol, activar/desactivar) con endpoints protegidos para ADMIN
- `admin-config`: Gestión de configuración del sistema (key-value, parámetros operativos)
- `admin-dashboard-ui`: Frontend del dashboard con gráficos Recharts, filtros de fecha, cards de resumen

### Modified Capabilities
<!-- No existing specs to modify — openspec/specs/ está vacío. -->

## Impact

**Backend:**
- Nuevo directorio `backend/features/admin/` con schemas, service y router
- Nuevos endpoints bajo `/api/admin/` (prefijo independiente de `/api/v1/`)
- Queries de agregación sobre tablas existentes (pedidos, usuarios, detalle_pedido, historial_estado)
- Dependencia nueva: `recharts` en frontend (ya listada en package.json)

**Frontend:**
- Nuevo `src/pages/admin/DashboardPage.tsx` con gráficos Recharts
- Nuevo `src/pages/admin/UsuariosPage.tsx` con tabla de usuarios
- Nuevo `src/pages/admin/ConfigPage.tsx` con formulario de configuración
- Actualizar `src/pages/admin/index.ts` con exports
- Actualizar `src/app/routes.tsx` reemplazando PlaceholderPages

**Modelo existente:**
- El modelo `Usuario` puede requerir campo `activo` (booleano) si no existe ya
- Nueva tabla `Configuracion` (clave-valor con auditoría)
