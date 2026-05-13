# Tasks: sprint4-pedidos

## 1. Backend - DetallePedido Model

- [ ] 1.1 Agregar modelo DetallePedido a `features/orders/models.py`: producto_id, nombre_snapshot, precio_snapshot, cantidad, excluded_ingredient_ids, personalizacion_snapshot
- [ ] 1.2 Agregar relación `detalles` en Pedido

## 2. Backend - Schemas

- [ ] 2.1 Crear `features/orders/schemas.py`: PedidoCreateRequest, PedidoResponse, DetallePedidoResponse, HistorialEstadoResponse, EstadoUpdateRequest, PedidoListResponse

## 3. Backend - OrderService

- [ ] 3.1 Crear `features/orders/service.py`: OrderService con create (atómico con UoW), list_mine, get_by_id, list_all (admin), update_estado (FSM con validación de transiciones)
- [ ] 3.2 Implementar FSM: estados válidos y transiciones permitidas

## 4. Backend - Router

- [ ] 4.1 Crear `features/orders/router.py`: POST /pedidos, GET /pedidos, GET /pedidos/{id}, PUT /pedidos/{id}/estado, GET /pedidos/admin
- [ ] 4.2 Registrar router en main.py

## 5. Frontend - Checkout

- [ ] 5.1 Conectar botón "Iniciar Pedido" en CartPage a POST /api/v1/pedidos
- [ ] 5.2 Al crear pedido, limpiar carrito y redirigir a detalle del pedido

## 6. Frontend - Página de Pedidos (cliente)

- [ ] 6.1 Crear `src/pages/OrdersPage.tsx`: listado de pedidos del usuario
- [ ] 6.2 Crear `src/pages/OrderDetailPage.tsx`: detalle con items, historial estados, timeline visual

## 7. Frontend - Panel de Pedidos (admin/gestor)

- [ ] 7.1 Agregar panel en admin: listar todos los pedidos, avanzar/cancelar estados

## 8. Frontend - Rutas

- [ ] 8.1 Agregar /orders, /orders/{id}, /admin/pedidos en routes.tsx

## 9. Verificación

- [ ] 9.1 Probar crear pedido desde carrito
- [ ] 9.2 Probar FSM (avanzar estados)
- [ ] 9.3 Probar cancelación
