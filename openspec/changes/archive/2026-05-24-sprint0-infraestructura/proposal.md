# Proposal: sprint0-infraestructura

## Change ID
`sprint0-infraestructura`

## Sprint 0 - Infraestructura Base

### ¿Qué?
Implementar la infraestructura fundacional del proyecto Food Store según las historias de usuario US-000 a US-000e, US-068 y US-074.

Este sprint establece la base técnica sobre la cual se construirán los 12 changes restantes del sistema.

### ¿Por qué?
Sin infraestructura no hay proyecto. Este sprint configura:
- Monorepo con backend/frontend separados
- Base de datos PostgreSQL con modelos y migraciones
- Patrones arquitectónicos (BaseRepository, Unit of Work)
- Estado del frontend (Zustand + TanStack Query)
- Manejo de errores estandarizado

### Scope

#### Backend
- Estructura feature-first según docs/Descripcion.txt sección 3
- FastAPI con SQLModel + Alembic
- Capas: Router → Service → Unit of Work → Repository → Model
- Modelos: Usuario, Rol, UsuarioRol, RefreshToken, Categoria, Ingrediente, Producto, DireccionEntrega, Pedido, EstadoPedido, HistorialEstadoPedido, FormaPago
- BaseRepository[T] genérico
- Unit of Work pattern
- Dependencias: get_current_user, require_role
- Manejo de errores RFC 7807
- Validación de inputs

#### Frontend
- FSD (Feature-Sliced Design) según docs/Descripcion.txt sección 3
- React + Vite + TypeScript
- Tailwind CSS
- 4 stores Zustand: authStore, cartStore, paymentStore, uiStore
- TanStack Query para estado servidor
- Axios con interceptores

#### Base de Datos
- PostgreSQL con Alembic
- Migraciones iniciales
- Seed data: 4 roles, 6 estados de pedido, formas de pago

### Historias de usuario asociadas

| US | Historia | Prioridad |
|----|----------|----------|
| US-000 | Inicialización del repositorio y estructura del proyecto | Alta |
| US-000a | Configuración del entorno backend (FastAPI + dependencias) | Alta |
| US-000b | Configuración de PostgreSQL, migraciones y seed data | Alta |
| US-000c | Configuración del entorno frontend (React + Vite + dependencias) | Alta |
| US-000d | Implementación de patrones base (BaseRepository, Unit of Work, dependencias FastAPI) | Alta |
| US-000e | Configuración de los stores de Zustand (authStore, cartStore, paymentStore, uiStore) | Alta |
| US-068 | Manejo de errores estandarizado en backend | Alta |
| US-074 | Validación y sanitización de inputs | Alta |

### Dependencias
> **Depende de**: Ninguno (es el change fundacional / Sprint 0)

### Criterios de aceptación
1. ✅ Monorepo con carpetas `backend/` y `frontend/`
2. ✅ Backend FastAPI inicia en puerto 8000
3. ✅ Endpoint `/health` responde 200 OK
4. ✅ Documentación OpenAPI en `/docs`
5. ✅ PostgreSQL conectado con migraciones aplicadas
6. ✅ Seed data insertado (roles, estados, formas de pago)
7. ✅ Frontend React inicia en puerto 5173
8. ✅ BaseRepository y Unit of Work funcionando
9. ✅ 4 stores Zustand configurados con persistencia
10. ✅ Manejo de errores RFC 7807 implementado