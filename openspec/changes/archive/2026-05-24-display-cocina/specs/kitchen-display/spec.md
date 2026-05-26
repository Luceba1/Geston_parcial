## ADDED Requirements

### Requirement: KDS muestra pedidos a preparar en dos columnas
El sistema SHALL mostrar una pantalla de cocina (KDS) en la ruta `/cocina` con dos columnas: "Por preparar" (pedidos en estado `confirmado`) y "En preparación" (pedidos en estado `en_preparacion`).

#### Scenario: Cocinero ve dos columnas al entrar a /cocina
- **WHEN** un cocinero autenticado navega a `/cocina`
- **THEN** ve dos columnas tituladas "Por preparar" y "En preparación"

#### Scenario: Cada tarjeta muestra datos del pedido
- **WHEN** un pedido aparece en el KDS
- **THEN** la tarjeta MUST mostrar: número de pedido, items con `nombre_snapshot` y `cantidad`, exclusiones de `personalizacion`, notas del cliente, y timer de urgencia

#### Scenario: Pedidos ordenados por antigüedad ascendente
- **WHEN** el KDS lista los pedidos
- **THEN** los pedidos SHALL ordenarse por antigüedad ascendente usando el timestamp de entrada al estado actual (RN-CO02)

#### Scenario: Pedido en PENDIENTE no aparece en KDS
- **WHEN** un pedido está en estado `pendiente`
- **THEN** NO SHALL aparecer en el KDS (RN-CO01)

### Requirement: Timer de urgencia con umbrales visuales
El KDS SHALL mostrar un timer por cada tarjeta indicando el tiempo transcurrido desde la entrada del pedido a cocina, con umbrales visuales: normal (< 10 min), advertencia (10-20 min, naranja), urgente (> 20 min, rojo).

#### Scenario: Timer se actualiza cada 15 segundos
- **WHEN** el KDS está abierto
- **THEN** el timer SHALL recalcularse cada 15s mediante `setInterval` en el cliente

#### Scenario: Menos de 10 minutos muestra estilo normal
- **WHEN** un pedido lleva menos de 10 min en cocina
- **THEN** la tarjeta SHALL mostrar estilo visual normal, sin resaltado

#### Scenario: Entre 10 y 20 minutos muestra advertencia
- **WHEN** un pedido lleva entre 10 y 20 min en cocina
- **THEN** la tarjeta SHALL mostrar un borde/fondo naranja de advertencia

#### Scenario: Más de 20 minutos muestra urgente
- **WHEN** un pedido lleva más de 20 min en cocina
- **THEN** la tarjeta SHALL mostrar un borde/fondo rojo de urgencia

### Requirement: Alerta visual y sonora al llegar nuevo pedido
El KDS SHALL reproducir un beep (Web Audio API) y mostrar un flash visual breve al recibir un evento `PEDIDO_CONFIRMADO`. Debe incluir un toggle ON/OFF de sonido que persista en `localStorage`.

#### Scenario: Beep y flash al recibir pedido nuevo
- **WHEN** el KDS recibe un evento `PEDIDO_CONFIRMADO`
- **THEN** reproduce un beep con Web Audio API y muestra un flash visual breve en la pantalla

#### Scenario: Toggle de sonido persiste entre sesiones
- **WHEN** el cocinero desactiva el sonido
- **THEN** la preferencia SHALL persistir en `localStorage` y respetarse en futuras sesiones
