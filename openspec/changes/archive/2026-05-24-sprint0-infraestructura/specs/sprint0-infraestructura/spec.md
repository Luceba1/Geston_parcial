# Spec: sprint0-infraestructura

## Overview
Sprint 0 - Infraestructura base del proyecto Food Store. Configuración del monorepo, backend FastAPI, frontend React, patrones arquitectónicos y stores de estado.

---

## ADDED Requirements

### Requirement: Backend FastAPI debe iniciar y responder a health checks
El servidor debe iniciar correctamente y proporcionar endpoints de verificación.

#### Scenario: Health check retorna 200 OK
- **WHEN** se hace GET a `/health`
- **THEN** responde HTTP 200 con JSON `{"status": "ok"}`

#### Scenario: Documentación Swagger disponible
- **WHEN** se accede a `/docs`
- **THEN** muestra la UI de Swagger con todos los endpoints

---

### Requirement: Modelos SQLModel deben mapear correctamente a PostgreSQL
Los modelos deben crear las tablas definidas en el ERD.

#### Scenario: Tabla usuarios creada
- **WHEN** se aplican las migraciones
- **THEN** existe la tabla `usuarios` con campos: id, nombre, email, hash_password, telefono, creado_en, actualizado_en, eliminado_en

#### Scenario: Tabla roles creada
- **WHEN** se aplican las migraciones
- **THEN** existe la tabla `roles` con campos: id, nombre, descripcion

#### Scenario: Relaciones many-to-many
- **WHEN** se aplican las migraciones
- **THEN** existen tablas: usuario_roles, producto_categorias, producto_ingredientes

---

### Requirement: Seed data debe cargar datos iniciales
Al iniciar el sistema, debe insertarse data de catálogo.

#### Scenario: 4 Roles insertados
- **WHEN** se ejecuta el seed
- **THEN** existen: ADMIN, STOCK, PEDIDOS, CLIENT

#### Scenario: 6 Estados de pedido insertados
- **WHEN** se ejecuta el seed
- **THEN** existen: PENDIENTE, CONFIRMADO, EN_PREPARACION, EN_CAMINO, ENTREGADO, CANCELADO

#### Scenario: Formas de pago insertadas
- **WHEN** se ejecuta el seed
- **THEN** existen: EFECTIVO, MERCADO_PAGO

---

### Requirement: BaseRepository debe implementar operaciones CRUD
Repositorio genérico con operaciones básicas.

#### Scenario: Create - Insertar registro
- **WHEN** se llama `repository.create(data)`
- **THEN** retorna el registro con ID generado

#### Scenario: Read by ID - Obtener por identificador
- **WHEN** se llama `repository.get_by_id(id)`
- **THEN** retorna el registro o None si no existe

#### Scenario: Get all - Listar todos
- **WHEN** se llama `repository.get_all()`
- **THEN** retorna lista de registros

#### Scenario: Update - Actualizar registro
- **WHEN** se llama `repository.update(id, data)`
- **THEN** retorna el registro actualizado

#### Scenario: Soft delete - Eliminación lógica
- **WHEN** se llama `repository.soft_delete(id)`
- **THEN** marca el registro como eliminado (no lo borra físicamente)

---

### Requirement: Unit of Work debe manejar transacciones atómicas
UoW coordina múltiples repositorios en una transacción.

#### Scenario: Commit - Confirmar cambios
- **WHEN** se llama `uow.commit()`
- **THEN** todos los cambios se guardan en la DB

#### Scenario: Rollback - Revertir cambios
- **WHEN** ocurre excepción y se llama `uow.rollback()`
- **THEN** todos los cambios se revierten

---

### Requirement: Dependencias FastAPI para autenticación
Protección de rutas mediante JWT.

#### Scenario: get_current_user con token válido
- **WHEN** request con JWT válido en Authorization header
- **THEN** retorna el usuario autenticado

#### Scenario: get_current_user con token inválido
- **WHEN** request con JWT expirado o inválido
- **THEN** retorna 401 Unauthorized

#### Scenario: require_role con rol suficiente
- **WHEN** usuario con rol ADMIN accede a endpoint protegido
- **THEN** permite el acceso

#### Scenario: require_role con rol insuficiente
- **WHEN** usuario con rol CLIENT accede a endpoint admin
- **THEN** retorna 403 Forbidden

---

### Requirement: Manejo de errores RFC 7807
Errores en formato Problem Details.

#### Scenario: Error de validación
- **WHEN** se envía datos inválidos
- **THEN** retorna 422 con Content-Type: application/problem+json

#### Scenario: Error de recurso no encontrado
- **WHEN** se solicita recurso inexistente
- **THEN** retorna 404 con formato RFC 7807

---

### Requirement: Frontend Vite debe iniciar y hacer HMR
Servidor de desarrollo funcional.

#### Scenario: Servidor inicia en puerto 5173
- **WHEN** se ejecuta `npm run dev`
- **THEN** la app está disponible en http://localhost:5173

#### Scenario: Hot Module Replacement
- **WHEN** se modifica un archivo .tsx
- **THEN** el navegador se actualiza sin recargar

---

### Requirement: Stores Zustand deben persistir en localStorage
Estado compartido entre sesiones del navegador.

#### Scenario: authStore persiste token JWT
- **WHEN** usuario hace login
- **THEN** el token se guarda en localStorage

#### Scenario: cartStore persiste items
- **WHEN** se agregan items al carrito
- **THEN** al recargar la página, los items siguen disponibles

---

### Requirement: Axios con interceptores configurado
Peticiones HTTP con token automático.

#### Scenario: Request interceptor adjunta token
- **WHEN** se hace petición HTTP
- **THEN** el token JWT se adjunta en Authorization header

#### Scenario: Response interceptor maneja 401
- **WHEN** la API retorna 401
- **THEN** se redirige al login o se intenta refresh