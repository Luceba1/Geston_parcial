## ADDED Requirements

### Requirement: usuario_id en HistorialEstadoPedido
El modelo `HistorialEstadoPedido` SHALL incluir un campo `usuario_id` como FK nullable a `usuarios.id`. Este campo SHALL almacenar el ID del usuario que ejecutó el cambio de estado.

#### Scenario: Transición registra usuario_id
- **WHEN** un usuario ejecuta una transición de estado vía `update_estado`
- **THEN** el registro en `HistorialEstadoPedido` SHALL incluir el `usuario_id` del usuario que la ejecutó

#### Scenario: Registros históricos existentes preservados
- **WHEN** se consultan registros de `HistorialEstadoPedido` creados antes de la migración
- **THEN** el campo `usuario_id` SHALL ser `NULL` para esos registros (la columna es nullable)

#### Scenario: Migración Alembic agrega la columna
- **WHEN** se ejecuta `alembic upgrade head`
- **THEN** la tabla `historial_estado_pedido` SHALL tener la columna `usuario_id` como FK nullable a `usuarios.id`

### Requirement: usuario_id incluido en el schema response
El schema `HistorialEstadoResponse` SHALL incluir el campo `usuario_id` en la respuesta de la API, para que el frontend pueda mostrar quién ejecutó cada cambio.

#### Scenario: GET pedido incluye historial con usuario_id
- **WHEN** se consulta el detalle de un pedido
- **THEN** cada registro del historial SHALL incluir `usuario_id` (o `null` para registros previos a la migración)

### Requirement: Auditoría append-only
El `HistorialEstadoPedido` SHALL ser estrictamente append-only: solo INSERT, nunca UPDATE ni DELETE (RN-FS07, RN-CO04).

#### Scenario: No se permite modificar historial existente
- **WHEN** se intenta hacer UPDATE o DELETE sobre `HistorialEstadoPedido`
- **THEN** la operación SHALL ser rechazada (no hay endpoints que expongan estas operaciones)
