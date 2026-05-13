## ADDED Requirements

### Requirement: List public catalog
The system SHALL return a paginated list of available products for the public catalog.

#### Scenario: Public catalog listing
- **WHEN** any user (authenticated or not) sends a GET request to `/api/v1/productos/public`
- **THEN** the system SHALL return HTTP 200 with a paginated list of products where `activo=true`

#### Scenario: Pagination
- **WHEN** a user sends a GET request with `page` (default 1) and `limit` (default 20) query parameters
- **THEN** the system SHALL return `items`, `total`, `page`, and `limit` in the response

#### Scenario: Filter by category
- **WHEN** a user sends a GET request with `categoria_id` query parameter
- **THEN** the system SHALL filter products to only those assigned to the specified category

#### Scenario: Search by name
- **WHEN** a user sends a GET request with `busqueda` query parameter
- **THEN** the system SHALL return products whose `nombre` contains the search string (case-insensitive)

#### Scenario: Exclude allergens
- **WHEN** a user sends a GET request with `excluir_alergenos` query parameter (comma-separated ingredient IDs)
- **THEN** the system SHALL exclude products that contain any of the specified ingredients

#### Scenario: Combined filters
- **WHEN** a user sends a GET request with multiple filter parameters (`categoria_id`, `busqueda`, `excluir_alergenos`)
- **THEN** the system SHALL apply all filters together (AND logic)

### Requirement: Get product detail
The system SHALL return the full detail of a public product.

#### Scenario: Successful detail
- **WHEN** any user sends a GET request to `/api/v1/productos/public/{id}` and the product exists and is active
- **THEN** the system SHALL return HTTP 200 with the product's full data including its categories and ingredients with allergen flags

#### Scenario: Product not found
- **WHEN** a user sends a GET request with a non-existent or inactive `id`
- **THEN** the system SHALL return HTTP 404 Not Found
