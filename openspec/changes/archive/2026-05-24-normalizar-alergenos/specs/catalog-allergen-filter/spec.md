## ADDED Requirements

### Requirement: Filtro de catálogo excluye por tipo de alérgeno

El sistema SHALL permitir excluir productos del catálogo según el tipo de alérgeno que contengan, no por ingrediente individual.

#### Scenario: Excluir productos con Gluten

- **WHEN** un usuario selecciona "Gluten" en el filtro de exclusión del catálogo
- **THEN** el sistema NO muestra productos que contengan ingredientes asociados al alérgeno "Gluten" (ej. Pizza Margherita con Harina)

#### Scenario: Excluir múltiples alérgenos

- **WHEN** un usuario selecciona "Gluten" y "Lácteos" en el filtro de exclusión
- **THEN** el sistema oculta productos que contengan Gluten O Lácteos (cualquiera de los dos)

#### Scenario: Producto sin alérgenos no se oculta

- **WHEN** un producto usa solo ingredientes sin alérgenos asociados y el usuario activa filtros de exclusión
- **THEN** el producto se muestra siempre

#### Scenario: Sin filtro activo

- **WHEN** no hay alérgenos seleccionados en el filtro
- **THEN** el sistema muestra todos los productos activos sin exclusión por alérgenos

### Requirement: Catálogo muestra alérgenos reales por producto

El sistema SHALL devolver la lista de tipos de alérgenos que contiene cada producto en la respuesta del endpoint público.

#### Scenario: Producto con ingredientes que tienen alérgenos

- **WHEN** el endpoint GET `/api/v1/productos/public` devuelve un producto
- **THEN** cada ingrediente incluye su lista de alérgenos (ej. `[{id:1, nombre:"Gluten", icono:null}]`)

#### Scenario: Producto sin alérgenos

- **WHEN** un producto usa solo ingredientes sin alérgenos
- **THEN** la lista de alérgenos de cada ingrediente es vacía (`[]`)

### Requirement: Detalle de producto muestra alérgenos

El sistema SHALL mostrar en la página de detalle del producto los alérgenos reales que contiene, no solo un booleano.

#### Scenario: Ver alérgenos en detalle

- **WHEN** un usuario ve el detalle de un producto con ingredientes que tienen alérgenos
- **THEN** el sistema muestra "Contiene: Gluten, Lácteos"

#### Scenario: Producto sin alérgenos en detalle

- **WHEN** un usuario ve el detalle de un producto sin alérgenos
- **THEN** el sistema NO muestra la sección de información de alérgenos
