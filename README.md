# FoodStore 🍔

Sistema de e-commerce de productos alimenticios. Backend en FastAPI + MySQL, frontend en React + TypeScript + Vite.

---
## Integrantes
- Gianfranco Canciani
- Lucas Pujada
- Julio Leiva
- Bruno Rivera

  Comisión 1
---

## Stack tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Backend** | FastAPI · SQLModel · MySQL · Alembic · python-jose · bcrypt · slowapi · MercadoPago SDK |
| **Frontend** | React 19 · TypeScript · Vite · TanStack Query · Zustand · React Router · Axios · Tailwind CSS v4 · Recharts |
| **Base de datos** | MySQL 8+ |

---

## Prerrequisitos

- **Python 3.11+**
- **Node.js 18+**
- **MySQL 8+** corriendo en `localhost:3306`
- **npm** o **pnpm**

---

## Guía rápida (primera vez)

### 1. Clonar el repositorio

```bash
git clone <url-del-repo> foodstore
cd foodstore
```

### 2. Base de datos

Asegurate de tener MySQL corriendo. Luego creá la base de datos:

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

# Crear entorno virtual e instalar dependencias
python -m venv venv
.\venv\Scripts\activate          # Windows
# source venv/bin/activate       # Linux / Mac

pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# EDITAR .env con tus credenciales de base de datos y MercadoPago

# Ejecutar migraciones
alembic upgrade head

# Sembrar datos de prueba
python run_seeds.py

# Iniciar servidor
uvicorn backend.main:app --reload --port 8000
```

API disponible en `http://localhost:8000`  
Documentación Swagger en `http://localhost:8000/docs`

### 4. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# EDITAR .env si es necesario (los defaults ya apuntan a localhost:8000)

# Iniciar servidor de desarrollo
npm run dev
```

App disponible en `http://localhost:5173`

---

## Usuario admin por defecto

Después de ejecutar los seeds, podés iniciar sesión con:

- **Email:** `admin@foodstore.com`
- **Contraseña:** `admin123`

---

## Variables de entorno

### Backend (`backend/.env`)

```env
DATABASE_URL=mysql+mysqlconnector://root:password@localhost:3306/foodstore
SECRET_KEY=cambia-esto-por-una-clave-de-64-caracteres-minimo
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

> **Importante:** Las variables de MercadoPago (`MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`) son **opcionales**. Si no se configuran, los endpoints de pago devuelven 501 (no implementado) y el botón de pago muestra "MercadoPago no configurado". El resto del sistema funciona igual.

---

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `cd backend && uvicorn backend.main:app --reload --port 8000` | Iniciar backend |
| `cd backend && alembic upgrade head` | Correr migraciones |
| `cd backend && python run_seeds.py` | Sembrar datos de prueba |
| `python seed_database.py` | Sembrar desde la raíz |
| `cd frontend && npm run dev` | Iniciar frontend |
| `cd frontend && npm run build` | Build de producción |
| `.\start_backend.bat` | Iniciar backend (Windows) |

---

## Documentación del sistema

Los documentos de arquitectura y requerimientos están en `docs/`:

| Archivo | Contenido |
|---------|-----------|
| `docs/Descripcion.txt` | Visión general, actores del sistema y stack tecnológico |
| `docs/Integrador.txt` | Arquitectura en capas, ERD, API REST y patrones de diseño |
| `docs/Historias_de_usuario.txt` | US-000 a US-076 con criterios de aceptación |

---

## Desarrollo con OPSX

Este proyecto usa **OPSX** (OpenSpec) como sistema de especificación y seguimiento de cambios. Los cambios activos se listan con:

```bash
openspec list
```

Y cada cambio sigue el ciclo: `explore → propose → apply → archive`.
