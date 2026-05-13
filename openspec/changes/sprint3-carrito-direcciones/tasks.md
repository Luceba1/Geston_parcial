# Tasks: sprint3-carrito-direcciones

## 1. Backend - Direcciones de Entrega (CRUD)

- [x] 1.1 Crear `backend/features/addresses/schemas.py`: DireccionCreate, DireccionUpdate, DireccionResponse
- [x] 1.2 Crear `backend/features/addresses/service.py`: AddressService con create, list_mine, get_by_id, update, soft_delete, set_default
- [x] 1.3 Crear `backend/features/addresses/router.py`: endpoints GET /, POST, PUT /{id}, DELETE /{id}, PUT /{id}/default — todos protegidos con get_current_user, ownership por userId
- [x] 1.4 Registrar router en `backend/main.py` con prefijo `/api/v1/direcciones`

## 2. Backend - Perfil de Usuario

- [x] 2.1 Agregar endpoint PUT /me en `backend/features/auth/router.py`: actualizar nombre y teléfono
- [x] 2.2 Agregar método `update_profile` en `backend/features/auth/service.py`

## 3. Frontend - Carrito Store (mejoras)

- [x] 3.1 Ampliar `CartItem` en cartStore para incluir `excludedIngredientIds: number[]` y `personalizacion: string`
- [x] 3.2 Agregar acción `updatePersonalization(productoId, excludedIngredientIds)`
- [ ] 3.3 Verificar que el carrito persiste correctamente con los nuevos campos

## 4. Frontend - Página de Carrito

- [x] 4.1 Crear `src/pages/CartPage.tsx`: lista de items con imagen, nombre, precio, cantidad (+/-), subtotal, botón eliminar
- [x] 4.2 Mostrar resumen del carrito: subtotal, cantidad total de items, total
- [x] 4.3 Botón "Vaciar carrito" con confirmación
- [x] 4.4 Mensaje de carrito vacío con link al catálogo
- [x] 4.5 Conectar los botones + y - para modificar cantidad
- [x] 4.6 Mostrar personalización (ingredientes excluidos) en cada item

## 5. Frontend - Agregar al Carrito desde Catálogo

- [x] 5.1 Actualizar `ProductCard` para que el botón "Ver detalle" lleve al detalle (ya funciona)
- [x] 5.2 Actualizar `ProductoDetallePage.tsx`: agregar selector de cantidad y botón "Agregar al carrito"
- [x] 5.3 En detalle, mostrar ingredientes con checkbox para excluir (personalización)
- [x] 5.4 Al agregar, mostrar toast de confirmación

## 6. Frontend - Badge de Carrito en Navegación

- [x] 6.1 Crear componente `src/widgets/CartBadge.tsx`: muestra icono + cantidad de items, link a /cart
- [x] 6.2 Integrar CartBadge en el Header del Layout
- [x] 6.3 Actualizar cantidad en tiempo real (suscribirse al cartStore)

## 7. Frontend - Página de Direcciones

- [x] 7.1 Crear `src/pages/DireccionesPage.tsx`: listado de direcciones del usuario
- [x] 7.2 Formulario modal: calle, número, ciudad, provincia, código postal, referencias
- [x] 7.3 Indicador de dirección predeterminada y botón "Establecer como default"
- [x] 7.4 Botones editar/eliminar por dirección
- [x] 7.5 Conexión con API: GET /direcciones, POST, PUT, DELETE

## 8. Frontend - Página de Perfil

- [x] 8.1 Crear `src/pages/PerfilPage.tsx`: mostrar datos del usuario (nombre, email, teléfono, fecha registro, roles)
- [x] 8.2 Formulario de edición: nombre y teléfono
- [x] 8.3 Guardar cambios vía PUT /api/v1/auth/me

## 9. Frontend - Rutas y Navegación

- [x] 9.1 Agregar rutas /cart (autenticado), /direcciones (autenticado), /perfil (autenticado)
- [x] 9.2 Agregar items en sidebar: Carrito, Mis Direcciones, Mi Perfil (visibles según rol)
- [ ] 9.3 Actualizar App.tsx si es necesario

## 10. Verificación

- [ ] 10.1 Verificar CRUD de direcciones desde Swagger
- [ ] 10.2 Verificar que cada cliente solo ve sus propias direcciones
- [ ] 10.3 Verificar dirección predeterminada funciona
- [ ] 10.4 Verificar que PUT /me actualiza nombre y teléfono
- [ ] 10.5 Verificar agregar producto al carrito desde catálogo
- [ ] 10.6 Verificar modificar cantidades en carrito
- [ ] 10.7 Verificar personalización (excluir ingredientes)
- [ ] 10.8 Verificar badge de carrito se actualiza en tiempo real
- [ ] 10.9 Verificar página de perfil muestra datos correctos
- [ ] 10.10 Verificar rutas protegidas redirigen a login
