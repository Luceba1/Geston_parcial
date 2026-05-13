## 1. Backend - Modelos (agregar campos de auditoría)

- [x] 1.1 Actualizar `backend/features/categories/models.py`: hacer que Categoria herede de BaseModel, agregar `creado_en`, `actualizado_en`, `eliminado_en`
- [x] 1.2 Actualizar `backend/features/ingredients/models.py`: hacer que Ingrediente herede de BaseModel, agregar `creado_en`, `actualizado_en`, `eliminado_en`
- [x] 1.3 Actualizar `backend/features/products/models.py`: hacer que Producto herede de BaseModel, agregar `creado_en`, `actualizado_en`, `eliminado_en`
- [x] 1.4 Verificar que `base.py` (BaseModel) tiene los campos correctos y que `base_repository.py` es compatible

## 2. Backend - Schemas Pydantic

- [x] 2.1 Crear `backend/features/categories/schemas.py`: CategoriaCreate, CategoriaUpdate, CategoriaResponse, CategoriaTree (con subcategorías anidadas)
- [x] 2.2 Crear `backend/features/ingredients/schemas.py`: IngredienteCreate, IngredienteUpdate, IngredienteResponse
- [x] 2.3 Crear `backend/features/products/schemas.py`: ProductoCreate, ProductoUpdate, ProductoResponse, ProductoListResponse, ProductoCategoriaAssign, ProductoIngredienteAssign, StockUpdate

## 3. Backend - Services

- [x] 3.1 Crear `backend/features/categories/service.py`: CategoryService con métodos create, get_tree, get_by_id, update, soft_delete (con validación de productos/subcategorías activos y detección de ciclos)
- [x] 3.2 Crear `backend/features/ingredients/service.py`: IngredienteService con create, list, get_by_id, update, soft_delete (con validación de productos asociados)
- [x] 3.3 Crear `backend/features/products/service.py`: ProductoService con create, list_admin, get_by_id, update, assign_categories, assign_ingredients, soft_delete, update_stock
- [x] 3.4 Crear `backend/features/products/public_service.py`: PublicCatalogService con list_public (filtros, paginación, búsqueda) y get_detail

## 4. Backend - Routers

- [x] 4.1 Crear `backend/features/categories/router.py`: endpoints CRUD + tree, registrar en main.py con prefijo /api/v1/categorias
- [x] 4.2 Crear `backend/features/ingredients/router.py`: endpoints CRUD, registrar en main.py con prefijo /api/v1/ingredientes
- [x] 4.3 Crear `backend/features/products/router.py`: endpoints CRUD admin + asignación categorías/ingredientes + stock, registrar en main.py con prefijo /api/v1/productos
- [x] 4.4 Crear `backend/features/products/public_router.py`: endpoints públicos GET /public y GET /public/{id}, registrar en main.py

## 5. Backend - Repositorios (mejoras)

- [x] 5.1 Mejorar `backend/features/repositories/categoria_repository.py`: agregar `get_by_slug`, `get_active_subcategories`, `get_products_count`, `get_tree_data` (todas las categorías para armar árbol)
- [x] 5.2 Mejorar `backend/features/repositories/ingrediente_repository.py`: agregar `get_by_nombre`, `get_products_count`
- [x] 5.3 Mejorar `backend/features/repositories/producto_repository.py`: agregar `search_public` (con filtros, paginación, búsqueda ILIKE), `get_public_detail`, `update_stock_atomic`

## 6. Frontend - Páginas de Administración (Categorías)

- [x] 6.1 Crear `src/pages/admin/CategoriasPage.tsx`: listado de categorías en árbol, botón crear, editar, eliminar
- [x] 6.2 Crear formulario de categoría (modal o página): nombre, descripción, slug, imagen, categoría padre
- [x] 6.3 Conectar con API: GET /categorias, POST, PUT, DELETE

## 7. Frontend - Páginas de Administración (Ingredientes)

- [x] 7.1 Crear `src/pages/admin/IngredientesPage.tsx`: listado de ingredientes con tabla, botón crear, editar, eliminar
- [x] 7.2 Crear formulario de ingrediente: nombre, unidad de medida, alérgenos
- [x] 7.3 Conectar con API: GET /ingredientes, POST, PUT, DELETE

## 8. Frontend - Páginas de Administración (Productos)

- [x] 8.1 Crear `src/pages/admin/ProductosPage.tsx`: listado de productos con tabla, botón crear, editar, eliminar, gestionar stock
- [x] 8.2 Crear formulario de producto: nombre, descripción, precio, stock, imagen, tiempo preparación
- [x] 8.3 Crear sección de asignación de categorías (multiselect)
- [x] 8.4 Crear sección de asignación de ingredientes (con cantidad)
- [x] 8.5 Crear modal/formulario de actualización de stock (setear, incrementar, decrementar)
- [x] 8.6 Conectar con API: GET /productos, POST, PUT, DELETE, PATCH stock, PUT categorías, PUT ingredientes

## 9. Frontend - Catálogo Público

- [x] 9.1 Crear `src/pages/CatalogoPage.tsx`: grilla de productos con paginación
- [x] 9.2 Crear componente `src/widgets/ProductCard/ProductCard.tsx`: tarjeta con nombre, precio, imagen, stock indicator
- [x] 9.3 Agregar filtros: búsqueda por nombre, filtro por categoría (dropdown), exclusión de alérgenos
- [x] 9.4 Crear `src/pages/ProductoDetallePage.tsx`: detalle completo con ingredientes, alérgenos, categorías
- [x] 9.5 Conectar con API: GET /productos/public, GET /productos/public/{id}

## 10. Frontend - Rutas y Navegación

- [x] 10.1 Agregar rutas de administración en `src/app/routes.tsx` protegidas con rol STOCK/ADMIN
- [x] 10.2 Agregar ruta /catalogo y /productos/{id} públicas
- [x] 10.3 Actualizar sidebar del Layout con items de navegación para gestión y catálogo

## 11. Datos de Prueba (Seeds)

- [x] 11.1 Agregar seeds de categorías de ejemplo (Bebidas, Comidas, Postres con subcategorías)
- [x] 11.2 Agregar seeds de ingredientes de ejemplo (con alérgenos: harina, leche, huevo, etc.)
- [x] 11.3 Agregar seeds de productos de ejemplo (con categorías e ingredientes asignados)

## 12. Verificación

- [ ] 12.1 Verificar CRUD de categorías funciona desde Swagger
- [ ] 12.2 Verificar CRUD de ingredientes funciona
- [ ] 12.3 Verificar CRUD de productos funciona
- [ ] 12.4 Verificar asignación de categorías e ingredientes a productos
- [ ] 12.5 Verificar actualización de stock (set, increment, decrement, límite negativo)
- [ ] 12.6 Verificar catálogo público con filtros y paginación
- [ ] 12.7 Verificar detalle de producto público
- [ ] 12.8 Verificar protección de roles (STOCK/ADMIN pueden, CLIENT no)
- [ ] 12.9 Verificar frontend: páginas de admin y catálogo público funcionan
- [ ] 12.10 Verificar flujo completo: crear categoría → crear ingrediente → crear producto → ver en catálogo
  *(Verificación pendiente — se hará al final junto con Sprint 1)*
