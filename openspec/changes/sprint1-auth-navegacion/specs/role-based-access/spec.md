# Role-Based Access Control (RBAC)

## ADDED Requirements

### Requirement: Role verification middleware
The system SHALL protect endpoints based on required roles using a `require_role()` dependency. If the user lacks the required role, the system SHALL return HTTP 403 Forbidden.

#### Scenario: Access with sufficient role
- **WHEN** an authenticated user with role ADMIN accesses an endpoint requiring ADMIN
- **THEN** the system allows access and returns the expected response

#### Scenario: Access with insufficient role
- **WHEN** an authenticated user with role CLIENT accesses an endpoint requiring ADMIN
- **THEN** the system returns HTTP 403 Forbidden with error message

#### Scenario: Access without authentication
- **WHEN** a request without Bearer token accesses a protected endpoint
- **THEN** the system returns HTTP 401 Unauthorized

### Requirement: Public endpoints
The system SHALL allow unauthenticated access to public endpoints (catalog, login, register).

#### Scenario: Public endpoint access
- **WHEN** an unauthenticated request hits a public endpoint (e.g., GET /api/v1/productos)
- **THEN** the system returns the expected response without requiring authentication

### Requirement: Role-based endpoint permissions
The system SHALL enforce the following permission matrix:

| Rol | Permisos |
|-----|----------|
| ADMIN | Full access: users, catalog, orders, metrics, config |
| STOCK | Catalog only: products, categories, ingredients, stock management |
| PEDIDOS | Orders only: view all orders, advance states, cancel (PENDIENTE/CONFIRMADO) |
| CLIENT | Own data only: view catalog, manage cart, create orders, view own orders |

#### Scenario: ADMIN access to user management
- **WHEN** an ADMIN accesses GET /api/v1/admin/usuarios
- **THEN** the system returns the user list

#### Scenario: STOCK access to orders
- **WHEN** a user with role STOCK attempts to access order management
- **THEN** the system returns HTTP 403 Forbidden

#### Scenario: CLIENT access to other user orders
- **WHEN** a CLIENT attempts to view another user's order
- **THEN** the system returns HTTP 403 Forbidden

### Requirement: JWT contains role information
The access token SHALL contain the user's roles in its payload so that role verification can happen without querying the database on every request.

#### Scenario: Token includes roles
- **WHEN** a user logs in
- **THEN** the access token payload SHALL include: sub (user_id), email, roles (list of role codes), exp, iat
