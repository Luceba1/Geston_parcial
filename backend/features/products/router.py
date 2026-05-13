from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from dependencies import get_db_session
from features.auth.dependencies import get_current_user
from features.auth.requires import require_role
from features.auth.models import Usuario
from features.products.schemas import (
    ProductoCreate, ProductoUpdate, ProductoResponse,
    ProductoCategoriaAssign, ProductoIngredienteAssign, StockUpdate,
)
from features.products.service import ProductoService

router = APIRouter()


def get_producto_service(db: Session = Depends(get_db_session)) -> ProductoService:
    return ProductoService(db)


@router.get("/", response_model=dict)
async def list_productos_admin(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=500),
    service: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_role("admin")),
):
    """Lista todos los productos (incluyendo inactivos). Requiere ADMIN."""
    skip = (page - 1) * limit
    items, total = service.list_admin(skip=skip, limit=limit)
    return {
        "items": [service._build_response(p) for p in items],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/{producto_id}", response_model=ProductoResponse)
async def get_producto_admin(
    producto_id: int,
    service: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_role("admin")),
):
    """Obtiene un producto por ID. Requiere ADMIN."""
    producto = service.get_by_id(producto_id)
    return service._build_response(producto)


@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
async def create_producto(
    data: ProductoCreate,
    service: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_role("admin")),
):
    """Crea un nuevo producto. Requiere ADMIN."""
    producto = service.create(data)
    return service._build_response(producto)


@router.put("/{producto_id}", response_model=ProductoResponse)
async def update_producto(
    producto_id: int,
    data: ProductoUpdate,
    service: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_role("admin")),
):
    """Actualiza un producto. Requiere ADMIN."""
    producto = service.update(producto_id, data)
    return service._build_response(producto)


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_producto(
    producto_id: int,
    service: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_role("admin")),
):
    """Elimina (soft delete) un producto. Requiere ADMIN."""
    service.soft_delete(producto_id)


@router.put("/{producto_id}/categorias", response_model=ProductoResponse)
async def assign_categorias(
    producto_id: int,
    data: ProductoCategoriaAssign,
    service: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_role("admin")),
):
    """Asigna categorías a un producto. Requiere ADMIN."""
    producto = service.assign_categories(producto_id, data)
    return service._build_response(producto)


@router.put("/{producto_id}/ingredientes", response_model=ProductoResponse)
async def assign_ingredientes(
    producto_id: int,
    data: ProductoIngredienteAssign,
    service: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_role("admin")),
):
    """Asigna ingredientes a un producto. Requiere ADMIN."""
    producto = service.assign_ingredients(producto_id, data)
    return service._build_response(producto)


@router.patch("/{producto_id}/stock", response_model=ProductoResponse)
async def update_stock(
    producto_id: int,
    data: StockUpdate,
    service: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_role("admin")),
):
    """Actualiza el stock de un producto (set | incrementar | decrementar). Requiere ADMIN."""
    producto = service.update_stock(producto_id, data.cantidad, data.operacion)
    return service._build_response(producto)
