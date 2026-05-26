# 🍔 FoodStore

Sistema de e-commerce de productos alimenticios — Trabajo Práctico Integrador.

**Frontend:** React 19 + TypeScript + Vite  
**Backend:** FastAPI + SQLModel + MySQL  
**Metodología:** OPSX (Spec-Driven Development)

---

## 📦 Repositorio

```
https://github.com/Gianfranco05/FoodStore_SDD_Canciani
```

---

## 👥 Integrantes

| Nombre | Comisión |
|--------|----------|
| Gianfranco Canciani | 1 |
| Lucas Pujada | 1 |
| Julio Leiva | 1 |
| Bruno Rivera | 1 |

---

## 🧱 Stack tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Backend** | FastAPI · SQLModel · MySQL 8+ · Alembic · python-jose (JWT) · bcrypt · slowapi · MercadoPago SDK |
| **Frontend** | React 19 · TypeScript · Vite 6 · TanStack Query · Zustand 5 · React Router 7 · Axios · Tailwind CSS v4 · Recharts |
| **Infraestructura** | XAMPP (MySQL) · Node.js 18+ · Python 3.11+ |

> ⚠️ **Nota:** El sistema usa **MySQL** (no PostgreSQL como mencionan los documentos originales en `docs/`). La migración se realizó porque el entorno de desarrollo cuenta con XAMPP.

---

## 🚀 Guía rápida de instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Gianfranco05/FoodStore_SDD_Canciani.git foodstore
cd foodstore
```

### 2. Base de datos

Asegurate de tener **MySQL 8+** corriendo (ej: con XAMPP). Después:

```bash
cd backend
python create_db.py
```

Esto crea la base `foodstore` si no existe. También podés hacerlo manualmente:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS foodstore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 3. Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar (Windows)
.\venv\Scripts\activate
# Activar (Linux/Mac)
# source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# IMPORTANTE: editá .env con tus credenciales reales
# La SECRET_KEY debe tener al menos 32 caracteres
# Las claves de MP deben ser de SANDBOX (TEST-...) no de producción

# Ejecutar migraciones
alembic upgrade head

# Sembrar datos de prueba
python run_seeds.py

# (Opcional) Seeds adicionales
python seed_allergens.py    # Alérgenos e ingredientes maestros
python seed_config.py       # Configuraciones del sistema (horarios, etc.)

# Iniciar servidor (opción 1 — desde la carpeta backend)
uvicorn main:app --reload --port 8000

# Iniciar servidor (opción 2 — desde la raíz del proyecto)
uvicorn backend.main:app --reload --port 8000
```

La API queda en `http://localhost:8000`  
Documentación Swagger: `http://localhost:8000/docs`

### 4. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

La app queda en `http://localhost:5173`

---

## 🔐 Usuarios de prueba

Después de ejecutar los seeds, estos son los usuarios disponibles:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@foodstore.com` | `admin123` | Administrador |
| `cocina@foodstore.com` | `cocina123` | Cocinero |

> Para probar otros roles (cliente, repartidor), registrate desde el frontend o crealos vía Swagger.

---

## ⚙️ Variables de entorno

### Backend (`backend/.env`)

```env
DATABASE_URL=mysql+mysqlconnector://root:password@localhost:3306/foodstore
SECRET_KEY=cambia-esto-por-una-clave-de-32-caracteres-minimo
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
MP_ACCESS_TOKEN=TEST-tu-access-token-de-mercadopago
MP_PUBLIC_KEY=TEST-tu-public-key-de-mercadopago
CORS_ORIGINS=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
VITE_MP_PUBLIC_KEY=TEST-tu-public-key-de-mercadopago
```

> ⚠️ **Seguridad:** Las claves de MercadoPago en `.env` son de **SANDBOX** (prefijo `TEST-`) para desarrollo. No uses claves de producción (`APP_USR-...`) en entornos de prueba.  
> El archivo `.env` está en `.gitignore` — **nunca se sube al repositorio**.

> ℹ️ **Sin MercadoPago:** Si no configurás las claves de MP, los endpoints de pago devuelven 501 (no implementado) y el botón de pago muestra "MercadoPago no configurado". El resto del sistema funciona igual.

---

## 📋 Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `cd backend && uvicorn main:app --reload --port 8000` | Iniciar backend |
| `cd backend && alembic upgrade head` | Correr migraciones |
| `cd backend && python run_seeds.py` | Sembrar datos base (roles, estados, categorías, productos) |
| `cd backend && python seed_simple.py` | Seed alternativo (SQL directo) |
| `cd backend && python seed_allergens.py` | Sembrar alérgenos e ingredientes maestros |
| `cd backend && python seed_config.py` | Sembrar configuraciones (horarios del local) |
| `cd backend && python create_db.py` | Crear base de datos `foodstore` si no existe |
| `cd frontend && npm run dev` | Iniciar frontend (desarrollo) |
| `cd frontend && npm run build` | Build de producción |
| `.\start_backend.bat` | Iniciar backend (Windows, con entorno virtual) |

---

## 🧪 MercadoPago — Tarjetas de prueba (Sandbox)

Para probar pagos en modo sandbox, usá estas tarjetas:

| Número | Marca | Resultado | CVV | Vencimiento |
|--------|-------|-----------|-----|-------------|
| `4509 9535 6623 3704` | Visa | Aprobado | `123` | `11/25` |
| `3714 496353 98431` | American Express | Aprobado | `1234` | `11/25` |
| `4000 0000 0000 0002` | Visa | Rechazado | `123` | `11/25` |

> Las credenciales de sandbox se obtienen en [MercadoPago Developers](https://www.mercadopago.com.ar/developers).  
> Las variables `MP_ACCESS_TOKEN` y `MP_PUBLIC_KEY` deben tener prefijo `TEST-`.

---

## 📁 Documentación del sistema

Los documentos de arquitectura y requerimientos están en `docs/`:

| Archivo | Contenido |
|---------|-----------|
| `docs/Descripcion.txt` | Visión general, actores del sistema y stack tecnológico |
| `docs/Integrador.txt` | Arquitectura en capas, ERD v5, API REST y patrones de diseño — **rúbrica de 200 pts** |
| `docs/Historias_de_usuario.txt` | US-000 a US-076 con criterios de aceptación |
| `docs/feature-display-cocina/` | Especificación del módulo de cocina (KDS) |
| `docs/CHANGES.md` | Registro de cambios por sprint |

---

## ✅ Checklist de entrega (TPI)

Basado en la rúbrica del `Integrador.txt`:

- [ ] CE-01 Repositorio GitHub público — **[listo](https://github.com/Gianfranco05/FoodStore_SDD_Canciani)**
- [ ] CE-02 README.md con instrucciones de setup funcionando
- [ ] CE-03 `.env.example` completo con variables documentadas
- [ ] CE-04 `alembic upgrade head` sin errores
- [ ] CE-05 Seeds ejecutan correctamente
- [ ] CE-06 `npm install` + `npm run dev` sin errores
- [ ] CE-07 `pip install` + `uvicorn` sin errores
- [ ] CE-08 Swagger UI (`/docs`) accesible
- [ ] CE-09 Pago sandbox MercadoPago funciona end-to-end
- [ ] CE-10 Unit of Work correctamente implementado
- [ ] CE-11 4 stores de Zustand implementados y tipados
- [ ] CE-12 Screenshots de al menos 10 pantallas
- [ ] CE-13 Video demostración (5-10 min) — link en README
- [ ] CE-14 Repositorio público verificado con sesión cerrada

### Bonus

- [ ] Bonus +10 pts: Tests unitarios con pytest, cobertura > 60%
- [ ] Bonus +10 pts: Deploy funcional en Railway/Render/Fly.io

> ⚠️ **Penalización -30%** si el proyecto no corre localmente siguiendo el README.

---

## 🧠 Desarrollo con OPSX

Este proyecto usa **OPSX** (OpenSpec) para el seguimiento de cambios. Cada cambio sigue el ciclo:

```
/opsx:explore  →  /opsx:propose  →  /opsx:apply  →  /opsx:archive
```

Para ver el estado de los cambios activos:

```bash
openspec list
```

### Cambios completados

| Change | Tareas | Estado |
|--------|--------|--------|
| `sprint0-infraestructura` | 58/58 | ✅ Archivado |
| `normalizar-alergenos` | 41/41 | ✅ Archivado |
| `display-cocina` | 23/23 | ✅ Archivado |

### Cambios con código listo (pendientes de verificación)

| Change | Tareas | Pendientes |
|--------|--------|------------|
| `sprint1-auth-navegacion` | 29/37 | 8 verificación |
| `sprint2-catalogo-productos` | 41/51 | 10 verificación |
| `sprint3-carrito-direcciones` | 32/43 | 11 verificación |
| `sprint4-pedidos` | 13/16 | 3 verificación |
| `admin-dashboard-gestion` | 35/43 | 8 verificación |
| `pagos-mercadopago` | 31/37 | 6 verificación |
| `refactor-dashboard-crud` | 23/28 | 5 verificación |
| `tailwind-design-system` | 13/15 | 2 verificación |

---

## 🐛 Troubleshooting

### `ModuleNotFoundError: No module named 'backend'`

Asegurate de estar en la carpeta `backend/` o tener el PYTHONPATH bien configurado:

```bash
# Desde la raíz del proyecto
set PYTHONPATH=%CD%
uvicorn backend.main:app --reload --port 8000
```

### Error de conexión MySQL

1. Verificá que MySQL esté corriendo (XAMPP → MySQL Start)
2. Revisá usuario/contraseña en `backend/.env`
3. Si tu root no tiene password, usá: `mysql+mysqlconnector://root@localhost:3306/foodstore`

### `alembic upgrade head` falla por columna existente

Podés resetear las migraciones:

```bash
# Dropear la base de datos y recrearla
python create_db.py  # ya hace CREATE IF NOT EXISTS

# O manualmente:
mysql -u root -p -e "DROP DATABASE IF EXISTS foodstore; CREATE DATABASE foodstore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
alembic upgrade head
python run_seeds.py
```

### El frontend tira error de TypeScript

```bash
cd frontend
npx tsc --noEmit
```

Para corregir errores automáticamente:

```bash
npm run build  # muestra los errores específicos
```

---

## 📊 Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│  Pages → Features → Hooks/Stores → API → Types              │
│  Zustand: auth, cart, payment, ui                           │
│  TanStack Query: server state (productos, pedidos, etc.)    │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP (Axios + JWT)
┌───────────────────────▼─────────────────────────────────────┐
│                    BACKEND (FastAPI)                         │
│  Router → Service → Unit of Work → Repository → Model       │
│  Auth JWT · RBAC 4 roles · Rate limiting · FSM · UoW        │
└───────────────────────┬─────────────────────────────────────┘
                        │ SQLModel / MySQL Connector
┌───────────────────────▼─────────────────────────────────────┐
│                    DATABASE (MySQL 8+)                       │
│  3 dominios: Identidad/Access · Catálogo · Ventas/Pagos     │
│  Soft delete · Snapshots · Audit trail append-only          │
└─────────────────────────────────────────────────────────────┘
```
