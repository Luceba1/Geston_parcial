## ADDED Requirements

### Requirement: Listar usuarios del sistema
The system SHALL allow ADMIN users to list all registered users with pagination, search, and role filtering.

#### Scenario: List all users
- **WHEN** an authenticated ADMIN calls GET `/api/admin/usuarios?skip=0&limit=20`
- **THEN** the response SHALL include: items (array of {id, email, nombre, telefono, activo, roles, creado_en}), total (number), skip (number), limit (number)
- **AND** the results SHALL be paginated with skip/limit

#### Scenario: Search users by name or email
- **WHEN** an authenticated ADMIN calls GET `/api/admin/usuarios?q=juan`
- **THEN** the system SHALL return users whose nombre OR email contains "juan" (case-insensitive ILIKE)

#### Scenario: Filter users by role
- **WHEN** an authenticated ADMIN calls GET `/api/admin/usuarios?rol=cliente`
- **THEN** the system SHALL return only users that have the role "cliente"

#### Scenario: Unauthorized access
- **WHEN** a non-ADMIN user calls GET `/api/admin/usuarios`
- **THEN** the system SHALL return HTTP 403 Forbidden

---

### Requirement: Editar datos y roles de usuario
The system SHALL allow ADMIN users to edit user data and assign/remove roles.

#### Scenario: Update user roles
- **WHEN** an authenticated ADMIN calls PUT `/api/admin/usuarios/{id}` with body { roles: ["admin", "cliente"] }
- **THEN** the system SHALL update the user's roles to match the provided array
- **AND** the system SHALL revoke all refresh tokens for that user via `revoke_all_by_user`
- **AND** the response SHALL include the updated user with new roles

#### Scenario: Prevent removing last admin
- **WHEN** an authenticated ADMIN calls PUT `/api/admin/usuarios/{id}` attempting to remove the ADMIN role from the last admin user
- **THEN** the system SHALL return HTTP 400 with error message "No se puede remover el rol ADMIN al último administrador del sistema"
- **AND** the user's roles SHALL NOT be modified

#### Scenario: Update user profile data
- **WHEN** an authenticated ADMIN calls PUT `/api/admin/usuarios/{id}` with body { nombre: "Nuevo Nombre", telefono: "123456789" }
- **THEN** the system SHALL update the user's nombre and telefono
- **AND** the actualizado_en timestamp SHALL be updated

---

### Requirement: Activar/desactivar usuario
The system SHALL allow ADMIN users to activate or deactivate user accounts.

#### Scenario: Deactivate user
- **WHEN** an authenticated ADMIN calls PATCH `/api/admin/usuarios/{id}/estado` with body { activo: false }
- **THEN** the system SHALL set the user's `activo` field to false
- **AND** the system SHALL revoke all refresh tokens for that user
- **AND** the user SHALL NOT be able to login until reactivated

#### Scenario: Reactivate user
- **WHEN** an authenticated ADMIN calls PATCH `/api/admin/usuarios/{id}/estado` with body { activo: true }
- **THEN** the system SHALL set the user's `activo` field to true
- **AND** the user SHALL be able to login again

#### Scenario: Cannot deactivate self
- **WHEN** an authenticated ADMIN calls PATCH `/api/admin/usuarios/{id}/estado` with body { activo: false } where id is the current user's own id
- **THEN** the system SHALL return HTTP 400 with error message "No puedes desactivarte a ti mismo"
