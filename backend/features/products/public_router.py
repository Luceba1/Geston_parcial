from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from dependencies import get_db_session
from features.products.schemas import ProductoListResponse, ProductoResponse
from features.products.public_service import PublicCatalogService

router = APIRouter()


def get_public_catalog_service(db: Session = Depends(get_db_session)) -> PublicCatalogService:
    return PublicCatalogService(db)


@router.get("/public", response_model=ProductoListResponse)
async def list_catalogo_publico(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    categoria_id: int = Query(default=None),
    busqueda: str = Query(default=None),
    excluir_alergenos: str = Query(default=None),
    service: PublicCatalogService = Depends(get_public_catalog_service),
):
    """Catálogo público de productos. No requiere autenticación.
    
    - `categoria_id`: filtrar por categoría
    - `busqueda`: buscar por nombre (case-insensitive)
    - `excluir_alergenos`: IDs de alérgenos a excluir (separados por coma)
    """
    return service.list_public(
        page=page,
        limit=limit,
        categoria_id=categoria_id,
        busqueda=busqueda,
        excluir_alergenos=excluir_alergenos,
    )


@router.get("/public/{producto_id}", response_model=ProductoResponse)
async def get_producto_detalle(
    producto_id: int,
    service: PublicCatalogService = Depends(get_public_catalog_service),
):
    """Detalle completo de un producto público. No requiere autenticación."""
    return service.get_detail(producto_id)
