# Navigation and Layout

## ADDED Requirements

### Requirement: Role-based navigation menu
The system SHALL display a navigation menu adapted to the user's role. Unauthenticated users SHALL see minimal navigation (Catalog, Login, Register).

#### Scenario: CLIENT navigation
- **WHEN** a user with role CLIENT is authenticated
- **THEN** the navigation shows: Catálogo, Mi Carrito, Mis Pedidos, Mi Perfil, Mis Direcciones

#### Scenario: STOCK navigation
- **WHEN** a user with role STOCK is authenticated
- **THEN** the navigation shows: Productos, Categorías, Ingredientes, Stock

#### Scenario: PEDIDOS navigation
- **WHEN** a user with role PEDIDOS is authenticated
- **THEN** the navigation shows: Panel de Pedidos

#### Scenario: ADMIN navigation
- **WHEN** a user with role ADMIN is authenticated
- **THEN** the navigation shows: all options from all roles + Usuarios + Métricas + Configuración

#### Scenario: Unauthenticated navigation
- **WHEN** a user is not authenticated
- **THEN** the navigation shows: Catálogo, Iniciar Sesión, Registrarse

### Requirement: Responsive layout
The frontend SHALL provide a responsive layout with Header, Sidebar (collapsible on mobile), and main content area.

#### Scenario: Desktop layout
- **WHEN** the viewport width is >= 1024px
- **THEN** the sidebar is visible by default and navigation items are always accessible

#### Scenario: Mobile layout
- **WHEN** the viewport width is < 1024px
- **THEN** the sidebar is hidden by default and can be toggled via a hamburger menu button

### Requirement: Route protection on frontend
The system SHALL protect frontend routes based on authentication and role, redirecting unauthenticated users to login and showing 403 for insufficient roles.

#### Scenario: Unauthenticated route access
- **WHEN** an unauthenticated user navigates to a protected route (e.g., /mis-pedidos)
- **THEN** the user is redirected to /login

#### Scenario: Insufficient role
- **WHEN** an authenticated user without the required role navigates to a restricted route
- **THEN** the system shows a 403 Forbidden page with message "No tenés permisos para acceder a esta página"

#### Scenario: Public route access
- **WHEN** any user navigates to a public route (/, /catalogo, /login, /registro)
- **THEN** the page loads without authentication checks
