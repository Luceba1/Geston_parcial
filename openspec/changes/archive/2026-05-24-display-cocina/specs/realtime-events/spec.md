## ADDED Requirements

### Requirement: Endpoint SSE para eventos de cocina
El backend SHALL exponer un endpoint `GET /api/v1/cocina/events` que emita un stream SSE (Server-Sent Events) con eventos de cambio de estado relevantes para la cocina. La conexión SHALL requerir autenticación JWT con rol `cocinero`, `admin` o `pedidos`.

#### Scenario: Conexión SSE exitosa
- **WHEN** un usuario con rol `cocinero`/`admin`/`pedidos` se conecta a `GET /api/v1/cocina/events`
- **THEN** recibe un stream `text/event-stream` con eventos en formato SSE estándar

#### Scenario: Conexión SSE rechazada sin token
- **WHEN** un usuario no autenticado intenta conectar a `GET /api/v1/cocina/events`
- **THEN** recibe **401** y la conexión se cierra

#### Scenario: Conexión SSE rechazada sin rol válido
- **WHEN** un usuario autenticado sin rol `cocinero`/`admin`/`pedidos` intenta conectar
- **THEN** recibe **403** y la conexión se cierra

### Requirement: Eventos publicados por el FSM al cambiar estado
El backend SHALL publicar eventos SSE desde `OrderService.update_estado` después de committear cada transición de estado. Los eventos SHALL ser best-effort: si no hay conexiones activas, el evento se descarta sin error.

#### Scenario: Evento PEDIDO_CONFIRMADO al aprobar pago
- **WHEN** un pedido pasa de `pendiente` a `confirmado`
- **THEN** el backend SHALL publicar un evento `PEDIDO_CONFIRMADO` con `pedido_id` y datos del pedido

#### Scenario: Evento PEDIDO_EN_PREPARACION al iniciar cocina
- **WHEN** un pedido pasa de `confirmado` a `en_preparacion`
- **THEN** el backend SHALL publicar un evento `PEDIDO_EN_PREPARACION`

#### Scenario: Evento PEDIDO_EN_CAMINO al terminar cocina
- **WHEN** un pedido pasa de `en_preparacion` a `en_camino`
- **THEN** el backend SHALL publicar un evento `PEDIDO_EN_CAMINO`

#### Scenario: Evento PEDIDO_CANCELADO en fase de cocina
- **WHEN** un pedido es cancelado desde `confirmado` o `en_preparacion`
- **THEN** el backend SHALL publicar un evento `PEDIDO_CANCELADO`

### Requirement: Endpoint REST de carga inicial
El backend SHALL exponer `GET /api/v1/cocina/pedidos` que devuelva los pedidos en estado `confirmado` y `en_preparacion`, ordenados por antigüedad ascendente (RN-CO02). Este endpoint SHALL usarse para la carga inicial del KDS y como fallback de polling.

#### Scenario: GET /cocina/pedidos devuelve lista inicial
- **WHEN** el KDS se monta por primera vez
- **THEN** hace `GET /api/v1/cocina/pedidos` con token JWT y recibe la lista de pedidos activos en cocina

#### Scenario: Solo devuelve CONFIRMADO y EN_PREPARACION
- **WHEN** se consulta `GET /api/v1/cocina/pedidos`
- **THEN** la respuesta SOLO incluye pedidos en estado `confirmado` y `en_preparacion`

### Requirement: Gestor de conexiones SSE en proceso
El backend SHALL implementar un `EventManager` con un `set[asyncio.Queue]` de conexiones activas. Cada conexión SSE tiene su propia cola. Al publicar un evento, se itera sobre todas las colas y se encola el mensaje.

#### Scenario: Single-instance pub/sub funcional
- **WHEN** se publica un evento desde `OrderService`
- **THEN** todas las conexiones SSE activas reciben el evento en ≤ 100ms

#### Scenario: Sin conexiones activas no hay error
- **WHEN** se publica un evento y no hay conexiones SSE activas
- **THEN** el evento se descarta sin lanzar error ni log de warning

### Requirement: Reconexión SSE con refresh completo
El frontend SHALL implementar reconexión automática al SSE. Al reconectar, SHALL hacer un fetch completo de `GET /api/v1/cocina/pedidos` para sincronizar el estado actual. Mientras está desconectado, SHALL hacer polling cada 30s con indicador visual de "sin conexión en vivo".

#### Scenario: Polling de fallback al desconectarse
- **WHEN** el SSE se desconecta
- **THEN** el KDS MUST mostrar un indicador visual "sin conexión en vivo" y activar polling de `GET /api/v1/cocina/pedidos` cada 30s

#### Scenario: Reconexión con refresh completo
- **WHEN** el SSE reconecta después de una desconexión
- **THEN** el KDS SHALL hacer fetch completo de `GET /api/v1/cocina/pedidos` para sincronizar estado y volver al modo push
