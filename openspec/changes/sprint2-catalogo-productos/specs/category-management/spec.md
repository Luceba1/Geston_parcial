## ADDED Requirements

### Requirement: Create category
The system SHALL allow users with role STOCK or ADMIN to create product categories.

#### Scenario: Successful creation
- **WHEN** an authenticated user with role STOCK or ADMIN sends a POST request to `/api/v1/categorias` with valid `nombre`, optional `descripcion`, optional `slug`, optional `imagen_url`, and optional `padre_id`
- **THEN** the system SHALL create the category and return HTTP 201 with the created category data

#### Scenario: Duplicate slug
- **WHEN** a user sends a POST request with a `slug` that already exists
- **THEN** the system SHALL return HTTP 409 Conflict

#### Scenario: Unauthenticated request
- **WHEN** an unauthenticated user sends a POST request
- **THEN** the system SHALL return HTTP 401 Unauthorized

#### Scenario: Forbidden role
- **WHEN** a user with role CLIENT sends a POST request
- **THEN** the system SHALL return HTTP 403 Forbidden

#### Scenario: Parent category does not exist
- **WHEN** a user sends a POST request with a `padre_id` that does not exist
- **THEN** the system SHALL return HTTP 404 Not Found

### Requirement: List categories (hierarchical)
The system SHALL return categories in a hierarchical tree structure.

#### Scenario: Public listing
- **WHEN** any user (authenticated or not) sends a GET request to `/api/v1/categorias`
- **THEN** the system SHALL return HTTP 200 with a tree of categories, where root categories (those without `padre_id`) contain their subcategories nested under a `subcategorias` field

#### Scenario: Only active categories
- **WHEN** a user sends a GET request
- **THEN** the system SHALL only include categories where `activo=true`

### Requirement: Update category
The system SHALL allow users with role STOCK or ADMIN to update existing categories.

#### Scenario: Successful update
- **WHEN** an authenticated user with role STOCK or ADMIN sends a PUT request to `/api/v1/categorias/{id}` with valid fields
- **THEN** the system SHALL update the category and return HTTP 200 with the updated data

#### Scenario: Circular parent reference
- **WHEN** a user sends a PUT request that would create a circular reference (a category assigned as parent of itself or of one of its ancestors)
- **THEN** the system SHALL return HTTP 422 Unprocessable Content

#### Scenario: Category not found
- **WHEN** a user sends a PUT request with a non-existent `id`
- **THEN** the system SHALL return HTTP 404 Not Found

### Requirement: Delete category (soft delete)
The system SHALL allow soft deletion of categories.

#### Scenario: Successful deletion
- **WHEN** an authenticated user with role STOCK or ADMIN sends a DELETE request to `/api/v1/categorias/{id}` and the category has no active products or subcategories
- **THEN** the system SHALL mark the category as inactive (`activo=false`) and return HTTP 204 No Content

#### Scenario: Category has active products
- **WHEN** a user sends a DELETE request for a category that has active products associated
- **THEN** the system SHALL return HTTP 409 Conflict with a message indicating the category has associated products

#### Scenario: Category has subcategories
- **WHEN** a user sends a DELETE request for a category that has active subcategories
- **THEN** the system SHALL return HTTP 409 Conflict with a message indicating the category has subcategories
