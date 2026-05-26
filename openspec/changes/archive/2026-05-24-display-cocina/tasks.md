## 1. Backend — Modelos y Migración

- [x] 1.1 Agregar `usuario_id` como FK nullable a `HistorialEstadoPedido` en `features/orders/models.py`
- [x] 1.2 Actualizar `HistorialEstadoResponse` en `features/orders/schemas.py` para incluir `usuario_id`
- [x] 1.3 Crear migración Alembic para agregar columna `usuario_id` a `historial_estado_pedido`

## 2. Backend — FSM (transición cocina)

- [x] 2.1 Agregar transición `("en_camino", ["admin", "cocinero"])` a `ALLOWED_TRANSITIONS["en_preparacion"]` en `features/orders/service.py`
- [x] 2.2 Refactorizar `update_estado` para recibir y registrar `usuario_id` en el `HistorialEstadoPedido`
- [x] 2.3 Agregar validación de que rol `cocinero` solo pueda ejecutar `confirmado→en_preparacion` y `en_preparacion→en_camino` (RN-CO03)

## 3. Backend — Event Manager SSE

- [x] 3.1 Crear `features/kitchen/event_manager.py` con clase `EventManager`: `set[asyncio.Queue]`, métodos `subscribe()`, `unsubscribe()`, `publish()`
- [x] 3.2 Crear singleton del `EventManager` en `features/kitchen/__init__.py`
- [x] 3.3 Integrar `EventManager.publish()` en `OrderService.update_estado()` después del flush, publicando el tipo de evento según la transición

## 4. Backend — Kitchen Router y Service

- [x] 4.1 Crear `features/kitchen/router.py` con:
  - `GET /api/v1/cocina/pedidos`: devuelve pedidos `confirmado` y `en_preparacion` ordenados por antigüedad
  - `GET /api/v1/cocina/events`: endpoint SSE con `StreamingResponse`, valida JWT y rol, se suscribe al `EventManager`
- [x] 4.2 Crear `features/kitchen/service.py` con lógica para listar pedidos de cocina (filtro por estados + ordenamiento)
- [x] 4.3 Crear `features/kitchen/schemas.py` con schemas de respuesta para pedidos de cocina
- [x] 4.4 Registrar el router de kitchen en la aplicación (`main.py`)
- [x] 4.5 Agregar protección de rutas: `require_role("cocinero", "admin", "pedidos")` en ambos endpoints

## 5. Backend — Seed y Dependencias

- [x] 5.1 Verificar que el rol `cocinero` está correctamente seedeado en `backend/seeds/__init__.py` (ya existe ✅)
- [x] 5.2 Agregar dependencia `require_role` al endpoint `PUT /pedidos/{id}/estado`

## 6. Frontend — Hook useSSE

- [x] 6.1 Crear `shared/hooks/useSSE.ts` con:
  - Conexión `EventSource` a SSE con token JWT en query param
  - Reconexión automática con backoff exponencial
  - Callbacks por tipo de evento
  - Estado de conexión (conectado/desconectado)

## 7. Frontend — CocinaPage y CocinaCard

- [x] 7.1 Crear `pages/CocinaPage.tsx`:
  - Fetch inicial + SSE para tiempo real
  - Layout de dos columnas: "Por preparar" y "En preparación"
  - Manejo de eventos SSE para refrescar sin recargar
  - Timer de urgencia con `setInterval` cada 15s
  - Fallback a polling cada 30s si SSE desconectado
  - Alerta visual/sonora (Web Audio API) al recibir `PEDIDO_CONFIRMADO`
  - Toggle de sonido persistente en `localStorage`
- [x] 7.2 Crear `widgets/cocina/CocinaCard.tsx`:
  - Muestra: #pedido, items, exclusiones, notas, timer
  - Botón "Iniciar preparación" (confirmado)
  - Botón "Listo / En Camino" (en_preparacion)
  - Timer con umbrales visuales (normal/naranja/rojo)

## 8. Frontend — Routing y Navegación

- [x] 8.1 Agregar ruta `/cocina` en `app/routes.tsx` con ProtectedRoute y roles `['cocinero', 'admin', 'pedidos']`
- [x] 8.2 Agregar item "Cocina" en la navegación (`Layout.tsx`) con icono y roles `['cocinero', 'admin', 'pedidos']`

## 9. Frontend — PedidosPage (delta FSM)

- [x] 9.1 Agregar transición `en_camino` al `ALLOWED_TRANSITIONS` de `PedidosPage.tsx`
- [x] 9.2 Reemplazar el `userRoles` hardcodeado `['admin']` por la lectura real del authStore
