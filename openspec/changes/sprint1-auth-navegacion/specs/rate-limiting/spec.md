# Rate Limiting

## ADDED Requirements

### Requirement: Login rate limiting
The system SHALL limit login attempts to 5 per IP address in a 15-minute sliding window using slowapi.

#### Scenario: Under limit
- **WHEN** a client makes fewer than 5 login attempts from the same IP in 15 minutes
- **THEN** all requests are processed normally

#### Scenario: Exceeds limit
- **WHEN** a client exceeds 5 login attempts from the same IP in 15 minutes
- **THEN** the system returns HTTP 429 Too Many Requests with Retry-After header indicating seconds to wait

#### Scenario: Different IPs unaffected
- **WHEN** one IP address is rate limited
- **THEN** other IP addresses can still log in normally

### Requirement: Rate limit configuration
The rate limit SHALL be configurable via environment variable or settings.

#### Scenario: Configurable limit
- **WHEN** the system starts
- **THEN** it reads rate limit configuration from Settings (default: 5 requests per 15 minutes for login)
