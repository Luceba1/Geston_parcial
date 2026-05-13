## Context

El Sprint 0 dejó la infraestructura base funcionando: FastAPI con MySQL, modelos SQLModel, BaseRepository[T] genérico, Unit of Work, stores Zustand, y estructura FSD en frontend. Las tablas de usuarios, roles, usuario_roles y refresh_tokens ya existen con sus migraciones y seeds (4 roles: ADMIN, STOCK, PEDIDOS, CLIENT). Sin embargo, no hay ningún endpoint funcional de auth, ni formularios de login/registro, ni protección de rutas.

Este sprint implementa la capa completa de autenticación y autorización, más el layout base del frontend con navegación adaptada al rol.

## Goals / Non-Goals

**Goals:**
- Backend: endpoints REST de register, login, refresh, logout, me con JWT
- Backend: rate limiting en login con slowapi (5 intentos / 15 min por IP)
- Backend: RBAC funcional con require_role() protegiendo endpoints
- Frontend: formularios de login y registro conectados al backend real
- Frontend: interceptor Axios con refresh automático de token + cola de requests
- Frontend: protección de rutas por autenticación y rol (ProtectedRoute)
- Frontend: navegación (sidebar/header) adaptada al rol del usuario
- Frontend: manejo global de errores HTTP con toasts/notificaciones

**Non-Goals:**
- CRUD de productos, categorías, ingredientes (Sprint 2+)
- Carrito de compras (Sprint 4+)
- Integración con MercadoPago (Sprint 6+)
- Panel de administración con métricas (Sprint 8+)
- Cambio de contraseña (US-063, Epic 06 — Sprint 3+)

## Decisions

### 1. Esquema de doble token JWT (access + refresh)
- **Decisión**: Access token de 30 min (HS256) + refresh token UUID v4 de 7 días almacenado en BD
- **Por qué**: El refresh token en BD permite invalidación explícita (logout, cambio de rol, detección de replay). El access token corto minimiza la ventana de exposición si es robado.
- **Alternativa considerada**: Access token largo (24h) sin refresh — rechazado por seguridad. Refresh token JWT sin BD — rechazado porque no se puede invalidar sin estado.
- **Implementación**: `create_access_token()` genera JWT con sub=user_id, email, roles. Refresh token se crea con `uuid4()` y se almacena hasheado (SHA-256) en RefreshToken.

### 2. Rate limiting con slowapi (in-memory)
- **Decisión**: slowapi con almacenamiento in-memory, límite 5 requests / 15 minutos en POST /auth/login
- **Por qué**: slowapi se integra nativamente con FastAPI vía decorador. No requiere Redis para desarrollo.
- **Alternativa considerada**: Middleware propio — innecesario cuando slowapi ya está en requirements.txt.
- **Advertencia**: En producción con múltiples instancias, migrar a Redis backend.

### 3. Protección de rutas backend con dependencias FastAPI
- **Decisión**: `get_current_user` como dependencia que extrae y valida JWT. `require_role(["ADMIN"])` como factory que retorna una dependencia.
- **Por qué**: Es el patrón nativo de FastAPI (Depends()). Es declarativo, testeable y aparece en Swagger automáticamente.
- **Implementación**: `get_current_user` usa `OAuth2PasswordBearer` (tokenUrl="/api/v1/auth/login"). `require_role` es un callable que verifica intersección entre roles del token y roles requeridos.

### 4. Protección de rutas frontend con componente ProtectedRoute
- **Decisión**: Componente `<ProtectedRoute roles={["ADMIN"]} />` que envuelve rutas en React Router
- **Por qué**: Es el patrón estándar en React Router v6. Es declarativo, reutilizable y se combina con Outlet.
- **Implementación**: ProtectedRoute lee el authStore, si no autenticado → redirect a /login. Si no tiene rol → muestra 403. Si ok → renderiza `<Outlet />`.

### 5. Interceptor Axios con cola de requests para refresh
- **Decisión**: Interceptor de response que detecta 401, pone en cola requests concurrentes, ejecuta un solo refresh, y resuelve toda la cola
- **Por qué**: Si múltiples requests fallan con 401 al mismo tiempo, solo se hace un refresh en lugar de N.
- **Implementación**: Variable `isRefreshing` + array `failedQueue`. Al recibir 401, si no está refrescando, inicia refresh y pone en cola. Cuando termina, resuelve la cola con el nuevo token.

### 6. Manejo de errores global con sistema de toasts
- **Decisión**: Interceptor Axios + ErrorBoundary + store de uiStore para toasts
- **Por qué**: Centraliza el mapeo de códigos HTTP a mensajes amigables. Evita try/catch en cada componente.
- **Mapeo**: 400 → errores de validación por campo, 401 → "Sesión expirada", 403 → "No tenés permisos", 404 → "Recurso no encontrado", 429 → "Demasiados intentos, esperá un momento", 500 → "Error interno, intentá de nuevo más tarde".

### 7. Navegación por rol con menú dinámico
- **Decisión**: Un componente `<Navigation>` que recibe los roles del usuario desde authStore y renderiza las opciones correspondientes
- **Por qué**: Un solo componente de navegación con lógica condicional es más simple que N componentes separados. Los items de menú se definen en una configuración central con `requiredRole`.
- **Implementación**: Array de rutas con `{ label, path, icon, roles: ["ADMIN","STOCK"] }`. Se filtran según los roles del usuario actual.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| **Token expuesto en localStorage** (XSS) | El access token es de corta duración (30 min). El refresh token está hasheado en BD. En una mejora futura se puede migrar a httpOnly cookies. |
| **Rate limiting in-memory no escala** | Aceptable para desarrollo. Documentar que en producción se debe usar Redis como backend de slowapi. |
| **Race condition en refresh de token** | La cola de requests (failedQueue) asegura que solo un refresh se ejecute a la vez, incluso con requests concurrentes. |
| **Rol cambiado después de emitir token** | El token mantiene los roles antiguos hasta expirar (máx 30 min). Aceptable para este sprint. Mejora futura: verificar roles en BD en cada request sensible. |
| **403 en frontend sin ruta dedicada** | Se crea una página ForbiddenPage y ProtectedRoute redirige allí con mensaje claro. |
