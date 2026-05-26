## Context

Food Store es un sistema de delivery con backend FastAPI + SQLModel, frontend React 19 + Vite + Zustand + React Query, y comunicación 100% REST. No existe infraestructura de tiempo real. El rol `cocinero` ya existe en el seed de BD pero no tiene pantalla dedicada ni flujo optimizado — opera desde el Panel de Pedidos general.

El FSM de pedidos tiene 7 estados (`pendiente`, `confirmado`, `en_preparacion`, `listo_para_entrega`, `en_camino`, `entregado`, `cancelado`) y las transiciones se definen en `ALLOWED_TRANSITIONS` dentro de `OrderService`. El historial de cambios (`HistorialEstadoPedido`) registra `fecha_cambio` y `notas` pero **no** `usuario_id`.

Este diseño implementa un Kitchen Display System (KDS) según el feature pack `docs/feature-display-cocina/`, adaptado a la realidad del código existente.

## Goals / Non-Goals

**Goals:**
- Pantalla de cocina `/cocina` con dos columnas: "Por preparar" (confirmado) y "En preparación" (en_preparacion)
- Actualización en tiempo real vía SSE (Server-Sent Events) desde el backend
- El cocinero puede tomar pedidos (`confirmado → en_preparacion`) y marcarlos terminados (`en_preparacion → en_camino`)
- Auditoría: todo cambio de estado registra `usuario_id` en el historial
- Timer de urgencia calculado en el cliente (normal < 10 min, advertencia 10-20 min, urgente > 20 min)
- Resiliencia: fallback a polling cada 30s si SSE se desconecta
- El KDS está disponible para roles `cocinero`, `admin` y `pedidos`
- Los eventos SSE cubren: `PEDIDO_CONFIRMADO` (nuevo pedido), `PEDIDO_EN_PREPARACION` (movido a en-preparacion), `PEDIDO_EN_CAMINO` (desaparece del KDS), `PEDIDO_CANCELADO` (desaparece del KDS)

**Non-Goals:**
- No se agrega un estado `LISTO` intermedio (PA-CO-01 postergada)
- No se implementa multi-sucursal ni estaciones de cocina
- No se agrega Redis — el pub/sub es en proceso (single-instance)
- US-COCINA-07 (marcar producto no disponible) queda pendiente para otro change
- No se modifican los endpoints existentes de pedidos, solo se agregan

## Decisions

### D-1: SSE sobre WebSocket para tiempo real

| Criterio | SSE | WebSocket |
|----------|-----|-----------|
| Direccionalidad | Server → Client (unidireccional) | Bidireccional |
| Complejidad backend | Baja (respuesta HTTP con `text/event-stream`) | Media (upgrade de protocolo, gestor de conexiones) |
| Reconexión automática | Nativa (EventSource API) | Manual (código custom) |
| Compatibilidad | Todos los navegadores modernos | Todos los navegadores modernos |
| Caso de uso | KDS solo recibe eventos, no envía | No necesita bidireccionalidad |

**Decisión:** SSE. El KDS es puramente receptor de eventos. SSE es más simple, tiene reconexión nativa, y evita la complejidad de un WebSocket manager. Se implementa con `StreamingResponse` de FastAPI.

### D-2: Pub/Sub en proceso (single-instance)

El backend actual corre en una sola instancia. Se implementa un `EventManager` con un `set[asyncio.Queue]` de conexiones SSE activas. Cuando el FSM commitea una transición, publica el evento a todas las conexiones.

**Límite conocido:** Si en el futuro el backend escala a múltiples instancias, cada instancia tendrá su propio `set` de conexiones y los eventos publicados en la instancia A no llegarán a las conexiones de la instancia B. En ese punto se necesitará Redis Pub/Sub como bus externo.

### D-3: Nueva transición `en_preparacion → en_camino`

Siguiendo el feature pack (decisión D-2 del README), se agrega al FSM la transición directa de `en_preparacion` a `en_camino` para los roles `admin` y `cocinero`. Esto permite al cocinero marcar un pedido como "terminado y en camino" sin pasar por `listo_para_entrega`.

El estado `listo_para_entrega` y su transición `en_preparacion → listo_para_entrega` se conservan para otros flujos (ej. admin que quiere staging antes del reparto).

```python
"en_preparacion": [
    ("listo_para_entrega", ["admin", "cocinero"]),  # existente
    ("en_camino", ["admin", "cocinero"]),             # NUEVA
    ("cancelado", ["admin"]),                         # existente
],
```

### D-4: `usuario_id` en `HistorialEstadoPedido`

Se agrega una columna `usuario_id: int = Field(foreign_key="usuarios.id", nullable=True)` al modelo `HistorialEstadoPedido`. Esto permite trazabilidad completa de quién ejecutó cada transición (RN-CO04).

La migración Alembic se hace con `nullable=True` para no romver registros históricos existentes (que quedarán con `NULL`).

### D-5: Frontend con columna dual + timer cliente-side

El KDS usa un layout de dos columnas:
- **"Por preparar"**: pedidos en estado `confirmado`, ordenados por antigüedad ascendente
- **"En preparación"**: pedidos en estado `en_preparacion`, ordenados por antigüedad ascendente

Cada tarjeta muestra: #pedido, items (nombre × cantidad), exclusiones, notas, y timer de urgencia. El timer se recalcula cada 15s con `setInterval` en el cliente, usando el timestamp de entrada a cocina que envía el backend.

### D-6: Arquitectura de eventos

Los eventos SSE se disparan desde el servicio de órdenes (`OrderService.update_estado`) después de committear la transición. No se usa outbox pattern ni event sourcing.

```
OrderService.update_estado()
  → valida FSM
  → actualiza pedido.estado_id
  → registra historial con usuario_id
  → flush()
  → EventManager.publish(tipo_evento, payload)
    → itera conexiones SSE activas
    → encola mensaje en cada asyncio.Queue
```

## Risks / Trade-offs

- **[Riesgo] Eventos perdidos si no hay conexiones SSE activas**: El pub/sh en proceso es best-effort. Si la pantalla de cocina está desconectada cuando llega un evento, ese evento se pierde. → **Mitigación**: Al reconectar, el frontend hace un fetch completo de `GET /api/v1/cocina/pedidos` que devuelve el estado actual.
- **[Riesgo] Broadcast a todas las conexiones sin filtro por rol**: En single-instance, todas las conexiones SSE reciben todos los eventos. Si en el futuro hay múltiples roles con SSE, habrá que filtrar por rol en el servidor. → **Aceptado** para v1.
- **[Riesgo] `en_preparacion → en_camino` rompe la semántica de `listo_para_entrega`**: El estado `listo_para_entrega` queda semánticamente ambiguo: significa "cocina terminó pero nadie lo marcó como en camino". → **Aceptado** como tradeoff del feature pack D-2.
- **[Tradeoff] Sin estado `LISTO` intermedio**: El feature pack documenta PA-CO-01 como pregunta abierta. Si el negocio necesita separar "comida lista" de "salió a reparto", habrá que agregar el estado en una v2.
