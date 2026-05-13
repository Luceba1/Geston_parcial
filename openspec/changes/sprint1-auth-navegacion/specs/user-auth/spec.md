# User Authentication

## ADDED Requirements

### Requirement: User registration
The system SHALL allow new users to register with name, email, and password. On success, the user SHALL be created with role CLIENT assigned automatically and SHALL receive a pair of tokens (access + refresh).

#### Scenario: Successful registration
- **WHEN** a new user submits valid registration data (nombre, email, password with 8+ chars)
- **THEN** the system creates the user, assigns role CLIENT, and returns HTTP 201 with TokenResponse

#### Scenario: Duplicate email
- **WHEN** a user submits an email that already exists
- **THEN** the system returns HTTP 409 Conflict with error "El email ya está registrado"

#### Scenario: Weak password
- **WHEN** a user submits a password with less than 8 characters
- **THEN** the system returns HTTP 422 with validation error

#### Scenario: Password hashing
- **WHEN** a user registers successfully
- **THEN** the password SHALL be stored hashed with bcrypt (cost factor >= 10), never in plain text

### Requirement: User login
The system SHALL authenticate users by email and password, returning an access token (30 min) and a refresh token (7 days).

#### Scenario: Successful login
- **WHEN** a user submits valid credentials (email + password)
- **THEN** the system returns HTTP 200 with TokenResponse (access_token, refresh_token, token_type="Bearer", user data with roles)

#### Scenario: Invalid credentials
- **WHEN** a user submits incorrect email or password
- **THEN** the system returns HTTP 401 with generic error message (MUST NOT differentiate "email not found" from "wrong password")

#### Scenario: Rate limited login
- **WHEN** a user exceeds 5 failed attempts in 15 minutes from the same IP
- **THEN** the system returns HTTP 429 Too Many Requests with Retry-After header

#### Scenario: Disabled user
- **WHEN** a disabled user attempts to login
- **THEN** the system returns HTTP 403 with message "Cuenta desactivada"

### Requirement: Token refresh
The system SHALL rotate tokens when a valid refresh token is presented. The old refresh token SHALL be revoked and a new pair SHALL be issued.

#### Scenario: Successful refresh
- **WHEN** a client presents a valid, non-expired, non-revoked refresh token
- **THEN** the system revokes the old token, issues a new pair (access + refresh), and returns HTTP 200 with TokenResponse

#### Scenario: Expired refresh token
- **WHEN** a client presents an expired refresh token
- **THEN** the system returns HTTP 401 and the user must re-login

#### Scenario: Reused refresh token (replay attack)
- **WHEN** a client presents a refresh token that was already revoked (used before)
- **THEN** the system SHALL revoke ALL refresh tokens for that user and return HTTP 401

### Requirement: User logout
The system SHALL allow authenticated users to logout, revoking their current refresh token.

#### Scenario: Successful logout
- **WHEN** an authenticated user sends their refresh token to the logout endpoint
- **THEN** the system marks the refresh token as revoked and returns HTTP 204 No Content

#### Scenario: Logout without token
- **WHEN** a request without a valid Bearer token hits the logout endpoint
- **THEN** the system returns HTTP 401 Unauthorized

### Requirement: Get current user profile
The system SHALL return the authenticated user's profile data.

#### Scenario: Authenticated user profile
- **WHEN** an authenticated user requests /api/v1/auth/me
- **THEN** the system returns HTTP 200 with UserResponse (id, nombre, email, telefono, roles, creado_en, actualizado_en)

#### Scenario: Unauthenticated profile request
- **WHEN** a request without a valid token requests /api/v1/auth/me
- **THEN** the system returns HTTP 401 Unauthorized
