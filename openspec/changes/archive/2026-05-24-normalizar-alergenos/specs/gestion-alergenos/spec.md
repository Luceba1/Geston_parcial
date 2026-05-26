## ADDED Requirements

### Requirement: Admin CRUD de alérgenos

El sistema SHALL proveer un CRUD completo de tipos de alérgenos en el panel de administración.

#### Scenario: Listar alérgenos

- **WHEN** un admin accede a la página de alérgenos
- **THEN** el sistema muestra una tabla con todos los alérgenos (id, nombre, icono, activo)

#### Scenario: Crear alérgeno

- **WHEN** un admin completa el formulario de nuevo alérgeno con nombre "Gluten"
- **THEN** el sistema crea el alérgeno y lo muestra en la tabla

#### Scenario: Editar alérgeno

- **WHEN** un admin modifica el nombre de "Gluten" a "Gluten (trigo)"
- **THEN** el sistema actualiza el alérgeno y refleja el cambio en la tabla

#### Scenario: Desactivar alérgeno (soft-delete)

- **WHEN** un admin desactiva un alérgeno
- **THEN** el sistema marca el alérgeno como inactivo y deja de mostrarlo en los formularios de ingrediente y en el filtro del catálogo

### Requirement: Asignar alérgenos a ingredientes

El sistema SHALL permitir asociar uno o más alérgenos a cada ingrediente a través de una relación muchos-a-muchos.

#### Scenario: Crear ingrediente con alérgenos

- **WHEN** un admin crea un ingrediente y selecciona "Gluten" y "Lácteos" como alérgenos
- **THEN** el sistema guarda la relación y al consultar el ingrediente devuelve ambos alérgenos

#### Scenario: Actualizar alérgenos de un ingrediente

- **WHEN** un admin edita un ingrediente y cambia sus alérgenos de ["Gluten", "Lácteos"] a solo ["Gluten"]
- **THEN** el sistema actualiza la relación eliminando "Lácteos" y manteniendo "Gluten"

#### Scenario: Ingrediente sin alérgenos

- **WHEN** un admin crea o edita un ingrediente sin seleccionar ningún alérgeno
- **THEN** el sistema guarda el ingrediente con la lista de alérgenos vacía

### Requirement: GET /api/v1/alergenos público

El sistema SHALL exponer un endpoint público que devuelva la lista de alérgenos activos.

#### Scenario: Obtener lista de alérgenos activos

- **WHEN** cualquier usuario (autenticado o no) hace GET a `/api/v1/alergenos`
- **THEN** el sistema devuelve un array JSON con id, nombre, icono de cada alérgeno activo

#### Scenario: Alérgenos inactivos no se muestran

- **WHEN** un alérgeno está marcado como `activo: false`
- **THEN** el endpoint GET `/api/v1/alergenos` NO lo incluye en la respuesta

### Requirement: Migración de datos existentes

El sistema SHALL migrar los datos del campo `alergenos` VARCHAR de ingredientes a la nueva tabla `ingrediente_alergeno`.

#### Scenario: Migración de ingrediente con alérgenos conocidos

- **WHEN** existe un ingrediente con `alergenos = "Gluten, Lácteos"` y existen alérgenos con nombre "Gluten" y "Lácteos"
- **THEN** la migración crea registros en `ingrediente_alergeno` vinculando ese ingrediente con ambos alérgenos

#### Scenario: Migración con alérgeno desconocido

- **WHEN** existe un ingrediente con `alergenos = "Algo Raro"` y no existe ningún alérgeno con ese nombre
- **THEN** la migración loguea una advertencia y omite ese valor (no crea relación)
