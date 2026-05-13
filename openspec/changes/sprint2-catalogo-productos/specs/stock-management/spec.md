## ADDED Requirements

### Requirement: Update product stock
The system SHALL allow users with role STOCK or ADMIN to update the stock of a product.

#### Scenario: Set absolute stock
- **WHEN** an authenticated user with role STOCK or ADMIN sends a PATCH request to `/api/v1/productos/{id}/stock` with `{ "cantidad": 50 }`
- **THEN** the system SHALL set the product's stock to exactly 50 and return HTTP 200 with the updated product

#### Scenario: Increment stock
- **WHEN** a user sends a PATCH request with `{ "cantidad": 10, "operacion": "incrementar" }`
- **THEN** the system SHALL add 10 to the current stock

#### Scenario: Decrement stock
- **WHEN** a user sends a PATCH request with `{ "cantidad": 5, "operacion": "decrementar" }`
- **THEN** the system SHALL subtract 5 from the current stock

#### Scenario: Negative stock prevented
- **WHEN** a user attempts to decrement stock below 0
- **THEN** the system SHALL return HTTP 422 Unprocessable Content

#### Scenario: Product not found
- **WHEN** a user sends a PATCH request with a non-existent `id`
- **THEN** the system SHALL return HTTP 404 Not Found
