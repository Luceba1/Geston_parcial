# Tasks: sprint1-auth-navegacion

## 1. Backend - Auth Schemas y Service

- [x] 1.1 Crear `backend/features/auth/schemas.py`: LoginRequest, RegisterRequest, TokenResponse, UserResponse (Pydantic v2)
- [x] 1.2 Crear `backend/features/auth/service.py`: lógica de register (hashear password, crear usuario, asignar rol CLIENT), login (verificar credenciales, generar tokens), refresh (rotación con revocación), logout (revocar token)
- [x] 1.3 Crear `backend/features/auth/router.py`: endpoints POST /register, POST /login, POST /refresh, POST /logout, GET /me con prefijo `/api/v1/auth`
- [x] 1.4 Registrar router de auth en `backend/main.py`

## 2. Backend - Auth Repository

- [x] 2.1 Crear `backend/features/auth/repository.py`: UsuarioRepository (find_by_email, create) y RefreshTokenRepository (create, find_valid, revoke, revoke_all_by_user)

## 3. Backend - Rate Limiting

- [x] 3.1 Configurar slowapi en `backend/main.py` (Limiter, rate limit exception handler)
- [x] 3.2 Aplicar decorador `@limiter.limit("5/15minutes")` al endpoint POST /login

## 4. Backend - Autenticación y Seguridad

- [x] 4.1 Verificar que `backend/core/security.py` tiene create_access_token, verify_password, get_password_hash funcionando
- [x] 4.2 Verificar que `backend/features/auth/dependencies.py` (get_current_user) funciona con HTTPBearer
- [x] 4.3 Verificar que `backend/features/auth/requires.py` (require_role) funciona como factory de dependencias

## 5. Frontend - Auth Pages

- [x] 5.1 Crear `src/pages/LoginPage.tsx` con formulario (email + password), conexión a API, guardar tokens en authStore
- [x] 5.2 Crear `src/pages/RegisterPage.tsx` con formulario (nombre + email + password + confirmar), conexión a API
- [x] 5.3 Actualizar `src/app/routes.tsx` agregando rutas /login y /register
- [x] 5.4 Actualizar authStore para que login/logout llamen a la API real (no mock)

## 6. Frontend - Route Protection

- [x] 6.1 Crear componente `src/shared/ui/ProtectedRoute.tsx` que verifica authStore y redirige a /login si no autenticado
- [x] 6.2 Crear `src/pages/ForbiddenPage.tsx` para acceso sin rol suficiente
- [x] 6.3 Actualizar `src/app/routes.tsx` envolviendo rutas protegidas con ProtectedRoute + roles requeridos

## 7. Frontend - Layout y Navegación

- [x] 7.1 Crear layout principal con Header (logo, datos usuario, logout), Sidebar (navegación por rol), y Outlet (contenido)
- [x] 7.2 Crear componente de navegación con menú dinámico según roles del usuario (CLIENT, STOCK, PEDIDOS, ADMIN)
- [x] 7.3 Hacer el layout responsive: sidebar colapsable en mobile con menú hamburguesa
- [x] 7.4 Actualizar `src/app/App.tsx` para usar el layout con React Router

## 8. Frontend - Axios Interceptor (Token Refresh)

- [x] 8.1 Actualizar `src/lib/api.ts` con interceptor de request que adjunta access token del authStore
- [x] 8.2 Implementar interceptor de response que detecta 401, ejecuta refresh con cola de requests, y reintenta
- [x] 8.3 Si refresh falla, limpiar authStore y redirigir a /login

## 9. Frontend - Error Handling Global

- [x] 9.1 Crear sistema de toasts/notificaciones en uiStore (addToast, removeToast con auto-dismiss)
- [x] 9.2 Crear componente `src/shared/ui/Toast.tsx` para mostrar notificaciones
- [x] 9.3 Crear `src/app/ErrorBoundary.tsx` para capturar errores no manejados de React
- [x] 9.4 Conectar interceptor de Axios para mostrar errores HTTP como toasts (400, 401, 403, 404, 429, 500)

## 10. Verificación

- [x] 10.1 Verificar que backend inicia sin errores y Swagger muestra los endpoints de auth
- [ ] 10.2 Verificar registro de usuario (POST /register) funciona desde Swagger
- [ ] 10.3 Verificar login y obtención de tokens funciona
- [ ] 10.4 Verificar refresh de token funciona
- [ ] 10.5 Verificar rate limiting (5 intentos → 429)
- [ ] 10.6 Verificar que frontend inicia y muestra login/register
- [ ] 10.7 Verificar flujo completo: register → login → navegar → logout
- [ ] 10.8 Verificar que rutas protegidas redirigen a login si no autenticado
- [ ] 10.9 Verificar que la navegación cambia según el rol
  *(Verificación pendiente — se hará al final junto con Sprint 2)*
