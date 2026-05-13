## ADDED Requirements

### Requirement: Create product
The system SHALL allow users with role STOCK or ADMIN to create products.

#### Scenario: Successful creation
- **WHEN** an authenticated user with role STOCK or ADMIN sends a POST request to `/api/v1/productos` with valid `nombre`, `descripcion`, `precio` (>0, max 2 decimals), `stock` (>=0), optional `imagen_url`, and optional `tiempo_preparacion_minutos`
- **THEN** the system SHALL create the product and return HTTP 201 with the created product data

#### Scenario: Unauthenticated request
- **WHEN** an unauthenticated user sends a POST request
- **THEN** the system SHALL return HTTP 401 Unauthorized

#### Scenario: Forbidden role
- **WHEN** a user with role CLIENT sends a POST request
- **THEN** the system SHALL return HTTP 403 Forbidden

#### Scenario: Invalid price
- **WHEN** a user sends a POST request with `precio` <= 0 or with more than 2 decimal places
- **THEN** the system SHALL return HTTP 422 Unprocessable Content

#### Scenario: Negative stock
- **WHEN** a user sends a POST request with `stock` < 0
- **THEN** the system SHALL return HTTP 422 Unprocessable Content

### Requirement: List products (admin)
The system SHALL allow users with role STOCK or ADMIN to list all products including inactive ones.

#### Scenario: Admin listing
- **WHEN** an authenticated user with role STOCK or ADMIN sends a GET request to `/api/v1/productos` with optional `page` and `limit`
- **THEN** the system SHALL return HTTP 200 with a paginated list of all products (including inactive and soft-deleted)

### Requirement: Update product
The system SHALL allow users with role STOCK or ADMIN to update products.

#### Scenario: Successful update
- **WHEN** an authenticated user with role STOCK or ADMIN sends a PUT request to `/api/v1/productos/{id}` with valid fields
- **THEN** the system SHALL update the product and return HTTP 200 with the updated data

#### Scenario: Product not found
- **WHEN** a user sends a PUT request with a non-existent `id`
- **THEN** the system SHALL return HTTP 404 Not Found

### Requirement: Assign categories to product
The system SHALL allow assigning multiple categories to a product.

#### Scenario: Assign categories
- **WHEN** an authenticated user with role STOCK or ADMIN sends a PUT request to `/api/v1/productos/{id}/categorias` with an array of `categoria_ids`
- **THEN** the system SHALL replace the product's category associations and return HTTP 200

#### Scenario: Category does not exist
- **WHEN** a user sends a request with a non-existent `categoria_id`
- **THEN** the system SHALL return HTTP 404 Not Found

### Requirement: Assign ingredients to product
The system SHALL allow assigning ingredients with quantities to a product.

#### Scenario: Assign ingredients
- **WHEN** an authenticated user with role STOCK or ADMIN sends a PUT request to `/api/v1/productos/{id}/ingredientes` with an array of `{ingrediente_id, cantidad}` objects
- **THEN** the system SHALL replace the product's ingredient associations and return HTTP 200

#### Scenario: Ingredient does not exist
- **WHEN** a user sends a request with a non-existent `ingrediente_id`
- **THEN** the system SHALL return HTTP 404 Not Found

### Requirement: Delete product (soft delete)
The system SHALL allow soft deletion of products.

#### Scenario: Successful deletion
- **WHEN** an authenticated user with role STOCK or ADMIN sends a DELETE request to `/api/v1/productos/{id}`
- **THEN** the system SHALL mark the product as inactive (`activo=false`) and return HTTP 204 No Content
