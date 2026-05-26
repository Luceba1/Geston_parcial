# Design: sprint0-infraestructura

## Context

### Background
Food Store es un sistema e-commerce de comida con:
- **Backend**: FastAPI + PostgreSQL + SQLModel + Alembic
- **Frontend**: React + TypeScript + Vite + Zustand + TanStack Query
- **Pagos**: MercadoPago SDK

Este es el **Sprint 0** - la infraestructura base que sustenta los 12 changes posteriores.

### Current State
- Proyecto nuevo con documentación en docs/
- No existe código implementado
- Change anterior `infrastructure-setup` tiene los artefactos creados pero no implementado

### Constraints
- PostgreSQL como base de datos
- FastAPI requiere SQLModel (no SQLAlchemy directo)
- Frontend: Vite (no CRA/Webpack)
- 4 roles: ADMIN, STOCK, PEDIDOS, CLIENT
- Arquitectura feature-first backend
- FSD en frontend

### Stakeholders
- Equipo backend (FastAPI)
- Equipo frontend (React)
- DevOps

---

## Goals / Non-Goals

### Goals
1. **Monorepo funcional** con backend/frontend
2. **Backend corriendo** con /health y /docs
3. **DB conectada** con modelos y migraciones
4. **Patrones implementados**: BaseRepository, Unit of Work, get_current_user, require_role
5. **Frontend corriendo** con HMR
6. **4 stores Zustand** con persistencia
7. **API layer** con Axios + interceptors

### Non-Goals
- Funcionalidad de negocio (auth, productos, pedidos)
- Integración con MercadoPago
- Panel admin
- Tests unitarios
- CI/CD
- Producción

---

## Decisions

### D1: Feature-first en backend
**Decisión**: Cada feature tiene su propia carpeta con model.py, schemas.py, repository.py, service.py, router.py.

**Rationale**: Según docs/Descripcion.txt sección 3 - facilita el SDD, cada change es una feature.

### D2: SQLModel sobre SQLAlchemy
**Decisión**: Usar SQLModel (Pydantic + ORM).

**Rationale**: docs/Descripcion.txt sección 2 - validación automática, menos código.

### D3: FSD en frontend
**Decisión**: Capas: app → pages → widgets → features → entities → shared.

**Rationale**: docs/Descripcion.txt sección 3 - separación estricto cliente/servidor.

### D4: Zustand + TanStack Query
**Decisión**: Zustand solo para estado cliente, TanStack Query solo para servidor.

**Rationale**: docs/Descripcion.txt sección 3 - evita duplicación y desincronización.

### D5: Unit of Work pattern
**Decisión**: Un UoW por request, expuesta vía dependencia FastAPI.

**Rationale**: docs/Descripcion.txt sección 3 - operaciones atómicas para pedidos.

---

## Risks / Trade-offs

### R1: Migraciones Alembic
**Riesgo**: Conflictos en desarrollo paralelo.

**Mitigación**: Code review riguroso, --autogenerate.

### R2: Zustand persist stale
**Riesgo**: Precios viejos en carrito tras reload.

**Mitigación**: Validar precios en checkout (change posterior).

---

## Migration Plan

### Backend
```bash
cd backend
python -m venv venv
pip install -r requirements.txt
alembic init migrations
# Crear modelos en features/*/model.py
alembic revision --autogenerate
alembic upgrade head
python -m seeds
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install zustand @tanstack/react-query axios react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm run dev
```

---

## Open Questions

1. **¿Docker desde el inicio?** → Recomendado para PostgreSQL
2. **¿Cuántos entornos?** → Mínimo: dev, test, prod
3. **¿API versioning?** → Empezar sin (/api/v1/ más adelante)