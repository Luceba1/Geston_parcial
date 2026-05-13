## Why

El sistema necesita que los clientes puedan gestionar su carrito de compras y sus direcciones de entrega para poder avanzar al flujo de pedidos. Actualmente:
- El carrito existe como store de Zustand (Sprint 0) pero no tiene UI ni integración con el catálogo
- No existen páginas para ver/editar el carrito ni personalizar productos (excluir ingredientes)
- No existen endpoints ni páginas para gestionar direcciones de entrega
- El perfil del cliente solo tiene el endpoint GET /me del Sprint 1, sin página de perfil

Sin carrito y direcciones, no es posible crear pedidos (Sprint 4+).

## What Changes

### Backend - Direcciones de Entrega
- **CRUD de direcciones**: GET /api/v1/direcciones, POST, PUT, DELETE con ownership por userId del JWT
- **Dirección predeterminada**: La primera dirección se marca como default automáticamente; solo una puede ser default por usuario
- **Protección**: Cada cliente solo ve/edita/elimina sus propias direcciones

### Frontend - Carrito de Compras
- **Página de carrito** (/cart): lista de items con cantidad, precio unitario, subtotal, total
- **Modificar cantidad**: incrementar/decrementar desde la página del carrito
- **Eliminar items**: botón de eliminar por producto
- **Personalización**: desde el detalle del producto, opción de excluir ingredientes (para productos que los tengan)
- **Integración con catálogo**: botón "Agregar al carrito" funcional en ProductCard y ProductoDetalle
- **Badge de carrito**: en el Header/Sidebar mostrando cantidad de items

### Frontend - Direcciones de Entrega
- **Página de direcciones** (/direcciones): listado de direcciones del usuario
- **Crear/editar dirección**: formulario con calle, número, ciudad, provincia, código postal, referencias
- **Dirección predeterminada**: indicador visual y acción para establecer como default

### Frontend - Perfil del Cliente
- **Página de perfil** (/perfil): mostrar datos del usuario (nombre, email, teléfono, fecha registro)
- **Editar perfil**: formulario para modificar nombre y teléfono
- **Endpoint PUT /api/v1/auth/me**: actualizar datos del perfil

## Capabilities

### New Capabilities
- `shopping-cart`: Carrito de compras con persistencia localStorage, modificación de cantidades, personalización (excluir ingredientes)
- `delivery-addresses`: CRUD de direcciones de entrega con dirección predeterminada y ownership por usuario
- `customer-profile`: Visualización y edición del perfil del cliente

### Modified Capabilities
- `public-catalog`: Botón "Agregar al carrito" en tarjetas y detalle de producto
- `navigation-layout`: Badge de carrito en Header/Sidebar con cantidad de items
- `user-auth`: Nuevo endpoint PUT /api/v1/auth/me para actualizar perfil

## Impact

### Backend
- **Nuevos archivos**: `backend/features/addresses/router.py`, `backend/features/addresses/service.py`, `backend/features/addresses/schemas.py`
- **Modificaciones**: `backend/features/auth/router.py` (PUT /me), `backend/main.py` (registrar router direcciones)
- **Base de datos**: Tabla `direcciones_entrega` ya existe del Sprint 0
- **Dependencias**: Ninguna nueva

### Frontend
- **Nuevos archivos**: `src/pages/CartPage.tsx`, `src/pages/DireccionesPage.tsx`, `src/pages/PerfilPage.tsx`, `src/widgets/CartBadge.tsx`
- **Modificaciones**: `src/app/routes.tsx`, `src/widgets/Layout.tsx`, `src/pages/CatalogoPage.tsx`, `src/pages/ProductoDetallePage.tsx`, `src/stores/cartStore.ts`
