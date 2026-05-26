# Tasks: sprint0-infraestructura

## 1. Estructura del Proyecto

- [x] 1.1 Crear carpetas raíz `backend/` y `frontend/`
- [x] 1.2 Crear `.gitignore` raíz (Python, Node, IDEs)
- [x] 1.3 Crear `README.md` con instrucciones de setup

## 2. Backend - Configuración Inicial

- [x] 2.1 Crear entorno virtual Python y `requirements.txt` (fastapi, uvicorn, sqlmodel, alembic, mysql-connector-python, python-jose[cryptography], passlib[bcrypt], python-multipart, pydantic-settings, slowapi)
- [x] 2.2 Crear `backend/main.py` con FastAPI y endpoint /health
- [x] 2.3 Crear `backend/app.py` como aplicación principal
- [x] 2.4 Configurar Alembic: `alembic init backend/migrations` y configurar `alembic.ini`
- [x] 2.5 Crear `backend/config.py` con Settings (DB, JWT, App)

## 3. Backend - Modelos de Base de Datos

- [x] 3.1 Crear `backend/features/__init__.py`
- [x] 3.2 Crear `backend/features/base.py` con modelo base (id, creado_en, actualizado_en, eliminado_en)
- [x] 3.3 Crear `backend/features/auth/models.py`: Usuario, Rol, UsuarioRol, RefreshToken
- [x] 3.4 Crear `backend/features/categories/models.py`: Categoria (con padre_id autoreferencial)
- [x] 3.5 Crear `backend/features/ingredients/models.py`: Ingrediente
- [x] 3.6 Crear `backend/features/products/models.py`: Producto, ProductoCategoria, ProductoIngrediente
- [x] 3.7 Crear `backend/features/addresses/models.py`: DireccionEntrega
- [x] 3.8 Crear `backend/features/orders/models.py`: Pedido, EstadoPedido, HistorialEstadoPedido
- [x] 3.9 Crear `backend/features/payments/models.py`: FormaPago
- [x] 3.10 Crear `backend/database.py` con engine y sessionmaker

## 4. Backend - Repositorios y Unit of Work

- [x] 4.1 Crear `backend/features/repositories/base_repository.py`: BaseRepository[T] genérico con create, get_by_id, get_all, update, soft_delete
- [x] 4.2 Crear `backend/features/repositories/unit_of_work.py`: UnitOfWork con commit, rollback
- [x] 4.3 Crear `backend/dependencies.py`: get_db_session, get_uow

## 5. Backend - Autenticación y Autorización

- [x] 5.1 Crear `backend/core/security.py`: create_access_token, verify_password, get_password_hash
- [x] 5.2 Crear `backend/features/auth/dependencies.py`: get_current_user
- [x] 5.3 Crear `backend/features/auth/requires.py`: require_role
- [x] 5.4 Configurar dependencies en `main.py`

## 6. Backend - Manejo de Errores

- [x] 6.1 Crear `backend/exceptions.py`: HTTPException personalizada, errores de dominio
- [x] 6.2 Crear `backend/middleware.py`: exception handlers RFC 7807
- [x] 6.3 Registrar handlers en `main.py`

## 7. Backend - Migraciones y Seeds

- [x] 7.1 Ejecutar `alembic revision --autogenerate -m "initial"`
- [x] 7.2 Ejecutar `alembic upgrade head`
- [x] 7.3 Crear `backend/seeds/__init__.py`: seed_roles(), seed_estados_pedido(), seed_formas_pago()
- [x] 7.4 Ejecutar seeds

## 8. Frontend - Configuración Inicial

- [x] 8.1 Crear proyecto Vite: `npm create vite@latest frontend -- --template react-ts`
- [x] 8.2 Instalar dependencias: zustand, @tanstack/react-query, axios, react-router-dom, react-hook-form
- [x] 8.3 Instalar Tailwind: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
- [x] 8.4 Configurar `tailwind.config.js` y `index.css`

## 9. Frontend - Estructura FSD

- [x] 9.1 Crear carpetas: `src/app/`, `src/shared/`, `src/features/`, `src/entities/`, `src/widgets/`, `src/pages/`
- [x] 9.2 Crear `src/app/App.tsx` con Router
- [x] 9.3 Crear `src/app/providers.tsx` con QueryClientProvider, RouterProvider

## 10. Frontend - Stores Zustand

- [x] 10.1 Crear `src/stores/authStore.ts`: user, token, login, logout, persist
- [x] 10.2 Crear `src/stores/cartStore.ts`: items, addItem, removeItem, updateQuantity, clearCart, persist
- [x] 10.3 Crear `src/stores/paymentStore.ts`: paymentStatus, preferenceId, setPaymentStatus
- [x] 10.4 Crear `src/stores/uiStore.ts`: sidebarOpen, theme, setSidebarOpen, setTheme
- [x] 10.5 Crear `src/stores/index.ts` como barrel export

## 11. Frontend - Capa de API

- [x] 11.1 Crear `src/lib/api.ts`: axios instance con interceptors (attach token, handle 401)
- [x] 11.2 Crear `src/lib/queryClient.ts`: TanStack Query client config
- [x] 11.3 Crear `src/lib/format.ts`: formateo de monedas, fechas

## 12. Frontend - Rutas y Componentes Base

- [x] 12.1 Crear `src/app/routes.tsx`: rutas principales (Home, Login, Register, Cart, Orders)
- [x] 12.2 Crear `src/shared/ui/Button.tsx`
- [x] 12.3 Crear `src/shared/ui/Input.tsx`
- [x] 12.4 Crear `src/shared/ui/Card.tsx`
- [x] 12.5 Crear página raíz `src/pages/HomePage.tsx`

## 13. Verificación Final

- [x] 13.1 Verificar `uvicorn backend.main:app --reload` inicia en puerto 8000
- [x] 13.2 Verificar GET /health retorna 200
- [x] 13.3 Verificar /docs muestra Swagger
- [x] 13.4 Verificar `npm run dev` en frontend inicia en puerto 5173
- [x] 13.5 Verificar stores persisten en localStorage
- [x] 13.6 Probar una query desde frontend y verificar respuesta ✅ COMPLETADA