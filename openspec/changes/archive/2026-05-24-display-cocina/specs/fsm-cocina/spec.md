## ADDED Requirements

### Requirement: Transición directa en_preparacion → en_camino
El FSM SHALL permitir la transición `en_preparacion → en_camino` para los roles `admin` y `cocinero`. Esta transición SE SUMA a la existente `en_preparacion → listo_para_entrega`, no la reemplaza.

#### Scenario: Cocinero marca pedido como terminado
- **WHEN** un cocinero solicita la transición `en_preparacion → en_camino` para un pedido
- **THEN** el pedido SHALL pasar a estado `en_camino`

#### Scenario: Admin puede usar ambas transiciones desde en_preparacion
- **WHEN** un admin solicita la transición `en_preparacion → en_camino`
- **THEN** la transición SHALL ser permitida
- **WHEN** un admin solicita la transición `en_preparacion → listo_para_entrega`
- **THEN** la transición SHALL seguir siendo permitida

#### Scenario: Transición inválida desde otro estado
- **WHEN** se intenta `en_preparacion → en_camino` desde un estado distinto a `en_preparacion`
- **THEN** el sistema SHALL rechazar con error de transición inválida (RN-FS01)

### Requirement: Validación de transiciones por rol cocinero
El servicio del FSM (`OrderService.update_estado`) SHALL validar que el rol `cocinero` solo pueda ejecutar las transiciones `confirmado → en_preparacion` y `en_preparacion → en_camino`. Cualquier otra transición intentada por un cocinero SHALL retornar **403**.

#### Scenario: Cocinero no puede despachar
- **WHEN** un cocinero intenta la transición `en_camino → entregado`
- **THEN** el sistema SHALL rechazar con **403 Forbidden**

#### Scenario: Cocinero no puede cancelar
- **WHEN** un cocinero intenta la transición `en_preparacion → cancelado`
- **THEN** el sistema SHALL rechazar con **403 Forbidden** (RN-CO03)

#### Scenario: Cocinero puede tomar pedido
- **WHEN** un cocinero solicita la transición `confirmado → en_preparacion`
- **THEN** la transición SHALL ser permitida

### Requirement: Registro en ALLOWED_TRANSITIONS
La nueva transición SHALL reflejarse en `ALLOWED_TRANSITIONS` del backend y en el mapa equivalente del frontend (`PedidosPage.tsx`).

#### Scenario: Backend ALLOWED_TRANSITIONS actualizado
- **WHEN** se inspecciona `OrderService.ALLOWED_TRANSITIONS["en_preparacion"]`
- **THEN** MUST incluir `("en_camino", ["admin", "cocinero"])`

#### Scenario: Frontend PedidosPage refleja la transición
- **WHEN** un admin ve la tabla de pedidos en Panel de Pedidos
- **THEN** un pedido en `en_preparacion` SHALL mostrar el botón "Listo / En Camino" además del existente "Listo para Entrega"
