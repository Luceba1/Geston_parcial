## Why

El sistema necesita un sistema completo de autenticación y autorización para que los usuarios puedan registrarse, iniciar sesión y acceder a las funcionalidades según su rol. Sin esto, no es posible operar la plataforma — no hay clientes, no hay gestión de pedidos, no hay administración. También se requiere el layout base del frontend con navegación adaptada al rol y manejo de errores global, para que la experiencia de usuario sea consistente y profesional.

## What Changes

### Backend
- **POST /api/v1/auth/register** — Registro de nuevo cliente con asignación automática de rol CLIENT
- **POST /api/v1/auth/login** — Login con email/contraseña, devuelve access token (30 min) + refresh token (7 días)
- **POST /api/v1/auth/refresh** — Renovación de tokens con rotación (el anterior se revoca)
- **POST /api/v1/auth/logout** — Invalida el refresh token actual
- **GET /api/v1/auth/me** — Devuelve los datos del usuario autenticado
- **Rate limiting** con slowapi: máximo 5 intentos de login por IP en 15 minutos
- **RBAC funcional**: Protección de endpoints por rol (ADMIN, STOCK, PEDIDOS, CLIENT) mediante `require_role()`
- **Schemas Pydantic**: LoginRequest, RegisterRequest, TokenResponse, UserResponse

### Frontend
- **AuthStore** completado: login/logout/refresh desde el store a la API real
- **Formularios**: LoginPage y RegisterPage conectados al backend
- **Protección de rutas**: Route guards por autenticación y rol
- **Navegación por rol**: Sidebar/Navbar adaptada al rol del usuario
- **Interceptor Axios**: Manejo automático de token expirado (refresh + retry queue)
- **Manejo de errores global**: Toasts/notificaciones para errores HTTP (400, 401, 403, 404, 429, 500)
- **Layout base**: Header, Sidebar, Footer con diseño responsive

## Capabilities

### New Capabilities
- `user-auth`: Registro, login, refresh, logout y perfil de usuario con JWT
- `role-based-access`: RBAC con 4 roles (ADMIN, STOCK, PEDIDOS, CLIENT), protección de rutas backend y frontend
- `rate-limiting`: Rate limiting en endpoint de login con slowapi (5 intentos / 15 min)
- `navigation-layout`: Layout base del frontend con navegación adaptada al rol, header, sidebar y footer
- `error-handling-frontend`: Manejo global de errores HTTP con notificaciones al usuario

### Modified Capabilities
- *(ninguna — es el primer sprint funcional)*

## Impact

### Backend
- **Nuevos archivos**: `backend/features/auth/router.py`, `backend/features/auth/service.py`, `backend/features/auth/schemas.py`, `backend/features/auth/repository.py`
- **Modificaciones**: `backend/main.py` (registrar router auth), `backend/config.py` (rate limit settings)
- **Dependencias**: slowapi ya incluida en requirements.txt
- **Base de datos**: Las tablas Usuario, Rol, UsuarioRol, RefreshToken ya existen (Sprint 0)

### Frontend
- **Nuevos archivos**: `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`, `src/features/auth/`, `src/shared/ui/` (componentes adicionales), `src/app/providers/AuthProvider.tsx`
- **Modificaciones**: `src/app/App.tsx` (layout + routing), `src/app/routes.tsx` (protección), `src/lib/api.ts` (interceptor refresh)
- **Dependencias**: Ya instaladas (zustand, axios, react-router-dom, @tanstack/react-query)
