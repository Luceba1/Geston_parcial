## Why

El sistema necesita un catálogo de productos funcional para que los clientes puedan navegar, buscar y ver detalles de los productos disponibles. Actualmente no existen endpoints ni páginas para gestionar categorías, ingredientes ni productos — solo está la infraestructura base de la plataforma.

Este sprint implementa la gestión completa del catálogo: desde la creación de categorías jerárquicas e ingredientes con alérgenos, hasta el CRUD de productos con stock, y un catálogo público con filtros. Sin esto no es posible avanzar a carrito, pedidos ni pagos.

## What Changes

- **Categorías**: CRUD completo con jerarquía padre-hijo (auto-referencial), validación de ciclos, soft delete y listado jerárquico público
- **Ingredientes**: CRUD completo con flag de alérgeno, soft delete, y asociación a productos
- **Productos**: CRUD completo con precio (precisión fija), stock, imágenes, disponibilidad, categorías, ingredientes, y soft delete
- **Catálogo público**: Listado paginado con filtros por categoría, búsqueda por nombre, exclusión de alérgenos, y detalle de producto
- **Roles**: Endpoints protegidos por rol (Gestor de Stock para admin, catálogo público sin autenticación)

## Capabilities

### New Capabilities

- `category-management`: CRUD de categorías con jerarquía padre-hijo, validación de ciclos, soft delete, y listado jerárquico público
- `ingredient-management`: CRUD de ingredientes con flag de alérgeno y soft delete
- `product-management`: CRUD de productos con precio (NUMERIC), stock, imágenes, categorías asociadas, ingredientes asociados, y soft delete
- `public-catalog`: Listado público de productos con paginación, filtro por categoría, búsqueda por nombre, exclusión de alérgenos, y detalle de producto
- `stock-management`: Actualización de stock con operaciones atómicas (incremento y seteo absoluto)

### Modified Capabilities

- *(ninguna — primera versión de estas capacidades)*

## Impact

- **Backend**: Nuevos módulos `features/categorias/`, `features/ingredientes/`, `features/productos/` con modelos, schemas, repositorios, servicios y routers
- **Frontend**: Nuevas páginas en `pages/` para gestión de categorías, ingredientes y productos (panel admin), más páginas de catálogo público
- **Base de datos**: Las tablas ya existen del Sprint 0 (`categorias`, `ingredientes`, `productos`, `producto_categorias`, `producto_ingredientes`) — solo se necesitan los seeds de datos de prueba
- **API**: Nuevos endpoints bajo `/api/v1/categorias`, `/api/v1/ingredientes`, `/api/v1/productos`
- **Dependencias**: No se requieren nuevas dependencias externas
