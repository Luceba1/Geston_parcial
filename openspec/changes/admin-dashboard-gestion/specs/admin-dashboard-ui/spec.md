## ADDED Requirements

### Requirement: Dashboard page with metrics cards
The system SHALL provide a dashboard page at `/admin` with summary cards for key metrics.

#### Scenario: Dashboard displays summary cards
- **WHEN** an authenticated ADMIN navigates to `/admin`
- **THEN** the page SHALL display cards showing: Total Ventas (with $ format), Cantidad de Pedidos, Usuarios Registrados, Productos Más Vendidos (top 5)
- **AND** each card SHALL show the current value and a label

#### Scenario: Date range filter
- **WHEN** an ADMIN selects a date range on the dashboard
- **THEN** the metrics cards SHALL update to reflect the selected period
- **AND** the date picker SHALL show "Desde" and "Hasta" inputs

#### Scenario: Loading state
- **WHEN** the dashboard is fetching data
- **THEN** the page SHALL show loading skeletons or spinners in each card

#### Scenario: Error state
- **WHEN** the API call fails
- **THEN** the page SHALL show an error message with a "Reintentar" button

---

### Requirement: Sales evolution chart
The system SHALL display a line chart showing sales evolution over time.

#### Scenario: Line chart shows sales data
- **WHEN** an ADMIN views the dashboard
- **THEN** the page SHALL display a `<LineChart>` from Recharts showing monto_total (line) and cantidad_pedidos (bar, secondary axis) over time
- **AND** the granularity selector SHALL allow switching between día/semana/mes

#### Scenario: Chart updates on granularity change
- **WHEN** an ADMIN changes granularity from "día" to "mes"
- **THEN** the chart SHALL re-fetch and display data grouped by month

---

### Requirement: Top products bar chart
The system SHALL display a horizontal bar chart with the top-selling products.

#### Scenario: Bar chart shows top products
- **WHEN** an ADMIN views the dashboard
- **THEN** the page SHALL display a `<BarChart>` from Recharts with product names on Y-axis and cantidad_total_vendida on X-axis
- **AND** each bar SHALL display the cantidad_total_vendida as a label

---

### Requirement: Orders by state pie chart
The system SHALL display a pie chart showing the distribution of orders by state.

#### Scenario: Pie chart shows order distribution
- **WHEN** an ADMIN views the dashboard
- **THEN** the page SHALL display a `<PieChart>` from Recharts with each estado as a slice
- **AND** each slice SHALL show the estado_nombre and cantidad
- **AND** the chart SHALL use distinct colors per estado

---

### Requirement: Users management page
The system SHALL provide a user management page at `/admin/usuarios`.

#### Scenario: Users table with search and filters
- **WHEN** an ADMIN navigates to `/admin/usuarios`
- **THEN** the page SHALL display a table with columns: Nombre, Email, Teléfono, Roles, Activo, Creado, Acciones
- **AND** a search input SHALL filter by nombre or email
- **AND** a role filter dropdown SHALL filter by role

#### Scenario: Toggle user active status
- **WHEN** an ADMIN clicks the toggle button for a user's active status
- **THEN** the system SHALL call PATCH `/api/admin/usuarios/{id}/estado` and update the toggle
- **AND** the table SHALL update without full page reload

#### Scenario: Edit user roles
- **WHEN** an ADMIN clicks "Editar" on a user row
- **THEN** a modal SHALL open with the user's current data and a multi-select for roles
- **AND** the ADMIN can change roles and submit
- **AND** the table SHALL reflect the changes after save

#### Scenario: Prevent self-deactivation
- **WHEN** an ADMIN tries to deactivate their own account
- **THEN** the system SHALL show an error toast "No puedes desactivarte a ti mismo"

---

### Requirement: Configuration page
The system SHALL provide a configuration page at `/admin/config`.

#### Scenario: View and edit config
- **WHEN** an ADMIN navigates to `/admin/config`
- **THEN** the page SHALL display each configuration key with its current value in an editable field
- **AND** a "Guardar" button SHALL persist changes via PUT `/api/admin/configuracion`

#### Scenario: Save confirmation
- **WHEN** an ADMIN clicks "Guardar" after editing config values
- **THEN** the system SHALL show a success toast "Configuración actualizada"
- **AND** the fields SHALL show the updated values
