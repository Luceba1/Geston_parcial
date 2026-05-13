## ADDED Requirements

### Requirement: Obtener configuraciones del sistema
The system SHALL allow ADMIN users to retrieve all system configuration parameters.

#### Scenario: Get all config
- **WHEN** an authenticated ADMIN calls GET `/api/admin/configuracion`
- **THEN** the response SHALL include an object with key-value pairs of all system configurations
- **AND** each config SHALL include: clave (string), valor (string/JSON), updated_by (user nombre), updated_at (datetime)

#### Scenario: Unauthorized access
- **WHEN** a non-ADMIN user calls GET `/api/admin/configuracion`
- **THEN** the system SHALL return HTTP 403 Forbidden

---

### Requirement: Actualizar configuraciones del sistema
The system SHALL allow ADMIN users to update system configuration parameters.

#### Scenario: Update config values
- **WHEN** an authenticated ADMIN calls PUT `/api/admin/configuracion` with body { horarios_atencion: "Lun-Vie 9:00-18:00", zona_entrega: "Zona Norte" }
- **THEN** the system SHALL update each provided key's value in the configuracion table
- **AND** the system SHALL record the user_id of the admin who made the change
- **AND** the system SHALL update the updated_at timestamp
- **AND** the response SHALL include all configs after update
