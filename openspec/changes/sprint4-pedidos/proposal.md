## Why

El sistema necesita el flujo completo de pedidos para que los clientes puedan convertir su carrito en un pedido real, y los gestores de pedidos puedan gestionar el ciclo de vida (FSM). Sin esto, la plataforma no cumple su función principal de e-commerce.

## What Changes

### Backend
- **Modelo DetallePedido**: snapshot de producto, precio, cantidad, personalización
- **POST /api/v1/pedidos**: Crear pedido desde carrito (validación de stock, snapshots, Unit of Work)
- **GET /api/v1/pedidos**: Listar pedidos del usuario autenticado (con paginación)
- **GET /api/v1/pedidos/{id}**: Detalle del pedido con historial de estados
- **PUT /api/v1/pedidos/{id}/estado**: Avanzar estado del pedido (FSM)
- **GET /api/v1/pedidos/admin**: Listar todos los pedidos (solo gestor/admin)
- **Máquina de estados**: PENDIENTE → CONFIRMADO → EN_PREPARACIÓN → LISTO_PARA_ENTREGA → EN_CAMINO → ENTREGADO (+ CANCELADO desde ciertos estados)
- **Snapshot de precio y dirección** al crear el pedido

### Frontend
- **Checkout**: Botón "Iniciar Pedido" en carrito → crear pedido vía API
- **Página de pedidos** (/orders): listado de pedidos del usuario
- **Detalle de pedido** (/orders/{id}): detalle con items, historial, botón cancelar
- **Panel de pedidos** (admin): listar y gestionar estados de todos los pedidos
