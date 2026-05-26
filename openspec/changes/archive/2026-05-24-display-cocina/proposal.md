## Why

Food Store no tiene un display de cocina (KDS) ni un flujo dedicado para que el personal de cocina reciba y gestione pedidos en tiempo real. Hoy toda la operación de cocina está absorbida por el Panel de Pedidos (rol admin/cocinero), sin una pantalla específica, sin notificaciones push, y sin trazabilidad de quién preparó cada pedido. Esto genera demoras, falta de visibilidad y nula auditoría sobre la fase de producción.

## What Changes

- **Nuevo rol COCINA**: Se agrega el rol `cocinero` a la navegación del frontend con ruta `/cocina` dedicada al KDS. El rol ya existe en el seed de BD, pero no tiene pantalla propia ni flujo optimizado.
- **Pantalla KDS (Kitchen Display System)**: Nueva página `/cocina` con dos columnas — "Por preparar" (pedidos `confirmado`) y "En preparación" (pedidos `en_preparacion`) — actualizada en tiempo real.
- **Infraestructura de tiempo real**: Se agrega SSE (Server-Sent Events) para push unidireccional servidor → pantalla de cocina. Endpoint `GET /api/v1/cocina/events` (SSE) más endpoint REST de carga inicial `GET /api/v1/cocina/pedidos`.
- **Delta en el FSM**: Se agrega la transición `en_preparacion → en_camino` para los roles `admin` y `cocinero`, permitiendo que cocina marque un pedido como terminado directamente (por decisión de diseño D-2 del feature pack).
- **Auditoría**: Se agrega `usuario_id` al `HistorialEstadoPedido` para trazabilidad de quién ejecutó cada transición (RN-CO04).
- **Indicador de urgencia**: Las tarjetas del KDS muestran tiempo transcurrido desde que el pedido entró a cocina, con umbrales visuales (normal < 10 min, advertencia 10-20 min, urgente > 20 min).
- **Resiliencia**: Si el SSE se desconecta, el KDS hace fallback a polling cada 30s con indicador visual de "sin conexión en vivo".
- **Alerta sonora/visual** (opcional, US-COCINA-05): Beep con Web Audio API + flash visual al llegar un pedido nuevo, con toggle persistente en localStorage.

## Capabilities

### New Capabilities
- `kitchen-display`: Pantalla de cocina en tiempo real con lista de pedidos a preparar, columnas por estado, tarjetas con detalles del pedido, timer de urgencia, y actualización vía SSE.
- `realtime-events`: Infraestructura SSE para push de eventos del FSM a la pantalla de cocina. Eventos: `PEDIDO_CONFIRMADO`, `PEDIDO_EN_PREPARACION`, `PEDIDO_EN_CAMINO`, `PEDIDO_CANCELADO`.
- `fsm-cocina`: Delta del FSM: nueva transición `en_preparacion → en_camino` para roles `admin`/`cocinero`, más validación de transiciones por rol cocinero.
- `auditoria-cocina`: Agregar `usuario_id` al `HistorialEstadoPedido` para trazabilidad de cambios de estado ejecutados por cocina.

### Modified Capabilities
<!-- No existing specs to modify. -->

## Impact

- **Backend**: 
  - `features/orders/service.py`: agregar transición al FSM + evento SSE post-transición
  - `features/orders/models.py`: agregar `usuario_id` a `HistorialEstadoPedido`
  - `features/orders/schemas.py`: actualizar schemas de historial
  - Nuevo: `features/kitchen/` con router, service, SSE manager
  - Migración Alembic: columna `usuario_id` en `historial_estado_pedido`
- **Frontend**:
  - Nueva página `pages/CocinaPage.tsx` (ruta `/cocina`)
  - Nuevo hook `useSSE` para conexión SSE con reconexión automática
  - Nuevo componente `CocinaCard` para tarjetas de pedido
  - Actualizar `routes.tsx` y `Layout.tsx` para incluir ruta y navegación
- **Seed**: El rol `cocinero` ya existe en el seed, no requiere cambios.
