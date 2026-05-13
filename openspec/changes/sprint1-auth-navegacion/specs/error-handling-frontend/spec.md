# Frontend Error Handling

## ADDED Requirements

### Requirement: Global HTTP error interceptor
The Axios interceptor SHALL intercept HTTP errors and display user-friendly messages via a toast/notification system.

#### Scenario: 400 Validation error
- **WHEN** the backend returns HTTP 400 with field-level validation errors
- **THEN** the system displays specific error messages next to the corresponding form fields

#### Scenario: 401 Unauthorized
- **WHEN** the backend returns HTTP 401 (unauthorized, not refresh scenario)
- **THEN** the system displays "Sesión expirada" and redirects to login

#### Scenario: 403 Forbidden
- **WHEN** the backend returns HTTP 403
- **THEN** the system displays "No tenés permisos para realizar esta acción"

#### Scenario: 404 Not Found
- **WHEN** the backend returns HTTP 404
- **THEN** the system displays "Recurso no encontrado"

#### Scenario: 429 Too Many Requests
- **WHEN** the backend returns HTTP 429
- **THEN** the system displays "Demasiadas solicitudes. Esperá un momento e intentá de nuevo"

#### Scenario: 500 Internal Server Error
- **WHEN** the backend returns HTTP 500
- **THEN** the system displays "Error interno del servidor. Intentá de nuevo más tarde"

### Requirement: Token refresh interceptor
The Axios interceptor SHALL automatically attempt token refresh on 401 responses and retry the original request transparently.

#### Scenario: Successful auto-refresh
- **WHEN** a request fails with 401 due to expired access token
- **THEN** the interceptor calls refresh endpoint, updates authStore with new tokens, retries the original request, and the user sees no interruption

#### Scenario: Failed auto-refresh
- **WHEN** a request fails with 401 and the refresh token is also expired/invalid
- **THEN** the interceptor clears authStore (logout) and redirects to login page

#### Scenario: Concurrent 401 requests
- **WHEN** multiple requests fail with 401 simultaneously
- **THEN** only one refresh request is made and all queued requests are resolved with the new token

### Requirement: Error boundary
The React app SHALL have a global ErrorBoundary that catches unhandled React errors and displays a fallback UI.

#### Scenario: Unhandled React error
- **WHEN** a React component throws an unhandled error
- **THEN** the ErrorBoundary displays a fallback message "Algo salió mal. Recargá la página o intentá de nuevo" with a reload button

### Requirement: Toast notification system
The system SHALL provide a toast notification component for transient messages (success, error, warning, info) with auto-dismiss.

#### Scenario: Success notification
- **WHEN** an operation completes successfully (e.g., login, order created)
- **THEN** a green toast notification appears with the success message and auto-dismisses after 4 seconds

#### Scenario: Error notification
- **WHEN** an operation fails
- **THEN** a red toast notification appears with the error message and auto-dismisses after 6 seconds
