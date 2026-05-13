## ADDED Requirements

### Requirement: Create ingredient
The system SHALL allow users with role STOCK or ADMIN to create ingredients.

#### Scenario: Successful creation
- **WHEN** an authenticated user with role STOCK or ADMIN sends a POST request to `/api/v1/ingredientes` with valid `nombre`, `unidad_medida`, and optional `alergenos`
- **THEN** the system SHALL create the ingredient and return HTTP 201 with the created ingredient data

#### Scenario: Unauthenticated request
- **WHEN** an unauthenticated user sends a POST request
- **THEN** the system SHALL return HTTP 401 Unauthorized

#### Scenario: Forbidden role
- **WHEN** a user with role CLIENT sends a POST request
- **THEN** the system SHALL return HTTP 403 Forbidden

### Requirement: List ingredients
The system SHALL return all ingredients with optional filtering.

#### Scenario: List all ingredients
- **WHEN** any user (authenticated or not) sends a GET request to `/api/v1/ingredientes`
- **THEN** the system SHALL return HTTP 200 with a list of all active ingredients (`disponible=true`)

#### Scenario: Paginated results
- **WHEN** a user sends a GET request with `page` and `limit` query parameters
- **THEN** the system SHALL return a paginated response with `items`, `total`, `page`, and `limit`

### Requirement: Update ingredient
The system SHALL allow users with role STOCK or ADMIN to update ingredients.

#### Scenario: Successful update
- **WHEN** an authenticated user with role STOCK or ADMIN sends a PUT request to `/api/v1/ingredientes/{id}` with valid fields
- **THEN** the system SHALL update the ingredient and return HTTP 200 with the updated data

#### Scenario: Ingredient not found
- **WHEN** a user sends a PUT request with a non-existent `id`
- **THEN** the system SHALL return HTTP 404 Not Found

### Requirement: Delete ingredient (soft delete)
The system SHALL allow soft deletion of ingredients.

#### Scenario: Successful deletion
- **WHEN** an authenticated user with role STOCK or ADMIN sends a DELETE request to `/api/v1/ingredientes/{id}`
- **THEN** the system SHALL mark the ingredient as not disponible (`disponible=false`) and return HTTP 204 No Content

#### Scenario: Ingredient associated with products
- **WHEN** a user sends a DELETE request for an ingredient that is associated with active products
- **THEN** the system SHALL return HTTP 409 Conflict indicating the ingredient is in use
