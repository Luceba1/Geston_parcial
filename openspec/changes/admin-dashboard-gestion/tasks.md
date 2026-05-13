# Tasks: admin-dashboard-gestion

## 1. Backend - Modelo Configuracion

- [x] 1.1 Crear modelo `Configuracion` en `backend/features/admin/models.py`: id, clave (unique), valor (text), updated_by_user_id (FK usuarios), updated_at
- [x] 1.2 Agregar `Configuracion` a `alembic` migration (autogenerate)
- [x] 1.3 Agregar repo de Configuracion al UnitOfWork

## 2. Backend - Admin Schemas

- [x] 2.1 Crear `backend/features/admin/schemas.py`

## 3. Backend - Admin Service (Usuarios)

- [x] 3.1 Implementar `list_users(q, rol, skip, limit)`
- [x] 3.2 Implementar `update_user(user_id, data)`
- [x] 3.3 Implementar `toggle_user_status(user_id, activo, current_user_id)`

## 4. Backend - Admin Service (Métricas)

- [x] 4.1 Implementar `get_resumen(desde, hasta)`
- [x] 4.2 Implementar `get_ventas(desde, hasta, granularidad)`
- [x] 4.3 Implementar `get_top_productos(top, desde, hasta)`
- [x] 4.4 Implementar `get_pedidos_por_estado(desde, hasta)`

## 5. Backend - Admin Service (Config)

- [x] 5.1 Implementar `get_config()`
- [x] 5.2 Implementar `update_config(configs: dict, user_id)`

## 6. Backend - Admin Router

- [x] 6.1 Crear `backend/features/admin/router.py` con GET /api/admin/usuarios, PUT /api/admin/usuarios/{id}, PATCH /api/admin/usuarios/{id}/estado
- [x] 6.2 Agregar GET /api/admin/metricas/resumen, GET /api/admin/metricas/ventas, GET /api/admin/metricas/productos-top, GET /api/admin/metricas/pedidos-por-estado
- [x] 6.3 Agregar GET /api/admin/configuracion y PUT /api/admin/configuracion
- [x] 6.4 Registrar router de admin en `backend/main.py` con prefijo `/api/admin`

## 7. Frontend - DashboardPage

- [ ] 7.1 Crear `src/pages/admin/DashboardPage.tsx` con layout de cards de resumen (Total Ventas, Pedidos, Usuarios, Top Productos)
- [ ] 7.2 Agregar selector de rango de fechas (Desde / Hasta) con date inputs
- [ ] 7.3 Agregar `<LineChart>` de Recharts para evolución de ventas con selector de granularidad (día/semana/mes)
- [ ] 7.4 Agregar `<BarChart>` de Recharts para top productos más vendidos
- [ ] 7.5 Agregar `<PieChart>` de Recharts para distribución de pedidos por estado
- [ ] 7.6 Implementar estados loading (skeleton) y error (mensaje + reintentar)
- [ ] 7.7 Implementar hook useAdminMetrics con TanStack Query (queryKey con rango de fechas)

## 8. Frontend - UsuariosPage

- [ ] 8.1 Crear `src/pages/admin/UsuariosPage.tsx` con tabla de usuarios (nombre, email, teléfono, roles, activo, creado)
- [ ] 8.2 Agregar búsqueda por nombre/email con input y filtro por rol con dropdown
- [ ] 8.3 Agregar botón toggle activo/inactivo por fila con confirmación
- [ ] 8.4 Crear modal de edición de usuario con campos nombre, teléfono y multi-select de roles
- [ ] 8.5 Conectar con API: GET /api/admin/usuarios, PUT, PATCH
- [ ] 8.6 Agregar estados loading, empty, error

## 9. Frontend - ConfigPage

- [ ] 9.1 Crear `src/pages/admin/ConfigPage.tsx` con formulario de configuraciones clave-valor
- [ ] 9.2 Agregar botón "Guardar" que envía PUT /api/admin/configuracion
- [ ] 9.3 Mostrar toast de éxito/error al guardar

## 10. Frontend - Rutas y Navegación

- [ ] 10.1 Agregar export de DashboardPage, UsuariosPage, ConfigPage en `src/pages/admin/index.ts`
- [ ] 10.2 Actualizar `src/app/routes.tsx`: reemplazar PlaceholderPage en /admin con DashboardPage, /admin/usuarios con UsuariosPage, /admin/config con ConfigPage

## 11. Verificación

- [ ] 11.1 Verificar endpoints de usuarios (listar, editar rol, activar/desactivar) desde Swagger
- [ ] 11.2 Verificar que no se puede degradar al último admin
- [ ] 11.3 Verificar que no se puede desactivar el propio usuario
- [ ] 11.4 Verificar endpoints de métricas devuelven datos correctos
- [ ] 11.5 Verificar dashboard frontend carga y muestra gráficos
- [ ] 11.6 Verificar filtros de fecha en dashboard actualizan datos
- [ ] 11.7 Verificar página de usuarios con búsqueda y edición
- [ ] 11.8 Verificar página de configuración guarda cambios
