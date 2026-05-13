## ADDED Requirements

### Requirement: Dashboard general — resumen de métricas
The system SHALL provide a summary endpoint with key business metrics for the admin dashboard.

#### Scenario: Get metrics summary
- **WHEN** an authenticated ADMIN calls GET `/api/admin/metricas/resumen?desde=2026-01-01&hasta=2026-12-31`
- **THEN** the response SHALL include: total_ventas (number), cantidad_pedidos (number), cantidad_usuarios (number), productos_mas_vendidos (array of {nombre, cantidad, ingreso_total}), pedidos_por_estado (array of {estado, cantidad})
- **AND** all metrics SHALL be scoped to the date range provided
- **AND** total_ventas SHALL be the SUM of `total` from completed/entregado pedidos

#### Scenario: Default date range
- **WHEN** an authenticated ADMIN calls GET `/api/admin/metricas/resumen` without date parameters
- **THEN** the system SHALL default to the current month (from first day of month to current date)

#### Scenario: Unauthorized access
- **WHEN** a non-ADMIN user calls GET `/api/admin/metricas/resumen`
- **THEN** the system SHALL return HTTP 403 Forbidden

---

### Requirement: Evolución de ventas por período
The system SHALL provide sales evolution data aggregated by configurable granularity (day, week, month).

#### Scenario: Get sales by day
- **WHEN** an authenticated ADMIN calls GET `/api/admin/metricas/ventas?desde=2026-01-01&hasta=2026-01-31&granularidad=dia`
- **THEN** the response SHALL include an array of {fecha, monto_total, cantidad_pedidos}
- **AND** data SHALL be grouped by calendar day using DATE_TRUNC

#### Scenario: Get sales by month
- **WHEN** an authenticated ADMIN calls GET `/api/admin/metricas/ventas?desde=2026-01-01&hasta=2026-12-31&granularidad=mes`
- **THEN** the response SHALL be grouped by calendar month

#### Scenario: Invalid granularity
- **WHEN** an authenticated ADMIN calls GET `/api/admin/metricas/ventas?granularidad=invalid`
- **THEN** the system SHALL default to granularity=dia and NOT return an error

---

### Requirement: Top productos más vendidos
The system SHALL provide a ranking of most-sold products within a date range.

#### Scenario: Get top 10 products
- **WHEN** an authenticated ADMIN calls GET `/api/admin/metricas/productos-top?top=10&desde=2026-01-01&hasta=2026-12-31`
- **THEN** the response SHALL include an ordered array of {producto_id, nombre_snapshot, cantidad_total_vendida, ingreso_total_generado}
- **AND** the array SHALL be ordered by cantidad_total_vendida descending
- **AND** the system SHALL aggregate from `detalles_pedido` joined with `pedidos` in entregado state

#### Scenario: Default top parameter
- **WHEN** an authenticated ADMIN calls GET `/api/admin/metricas/productos-top` without `top` parameter
- **THEN** the system SHALL default to top=10

---

### Requirement: Distribución de pedidos por estado
The system SHALL provide the distribution of orders across all states.

#### Scenario: Get orders by state
- **WHEN** an authenticated ADMIN calls GET `/api/admin/metricas/pedidos-por-estado?desde=2026-01-01&hasta=2026-12-31`
- **THEN** the response SHALL include an array of {estado_id, estado_nombre, cantidad}
- **AND** each estado SHALL include its current count of pedidos in that state
- **AND** states with zero pedidos SHALL be included with cantidad=0
