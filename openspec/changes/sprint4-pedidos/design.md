## Context

El Sprint 3 dejó el carrito de compras funcional con personalización y las direcciones de entrega operativas. Los modelos `Pedido`, `EstadoPedido`, e `HistorialEstadoPedido` ya existen en `features/orders/models.py`, junto con sus seeds en la BD (7 estados: pendiente→entregado + cancelado). No existe `DetallePedido` ni lógica de negocio de pedidos.

## Decisions

### 1. DetallePedido con snapshots
Cada item del pedido guarda snapshot del nombre, precio, cantidad e ingredientes excluidos. El precio NO se consulta del producto actual sino del snapshot para preservar el valor histórico.

### 2. Creación de pedido con Unit of Work
La creación es atómica:
1. Validar stock de cada producto (SELECT FOR UPDATE)
2. Crear Pedido + DetallesPedido
3. Decrementar stock
4. Registrar historial de estado (PENDIENTE)
5. Si algo falla → rollback total

### 3. FSM con estados secuenciales
PENDIENTE(1) → CONFIRMADO(2) → EN_PREPARACION(3) → LISTO_PARA_ENTREGA(4) → EN_CAMINO(5) → ENTREGADO(6)
CANCELADO(7) puede ocurrir desde: PENDIENTE, CONFIRMADO, EN_PREPARACION
Transiciones validades por orden (solo adelante, no saltos)
