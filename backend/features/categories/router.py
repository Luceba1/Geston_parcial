from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from dependencies import get_db_session
from features.auth.dependencies import get_current_user
from features.auth.requires import require_role
from features.auth.models import Usuario
from features.categories.schemas import CategoriaCreate, CategoriaUpdate, CategoriaResponse, CategoriaTree
from features.categories.service import CategoryService

router = APIRouter()


def get_category_service(db: Session = Depends(get_db_session)) -> CategoryService:
    return CategoryService(db)


@router.get("/", response_model=list[CategoriaTree])
async def list_categorias(
    service: CategoryService = Depends(get_category_service),
):
    """Devuelve el árbol jerárquico de categorías activas. Público."""
    return service.get_tree()


@router.get("/{categoria_id}", response_model=CategoriaResponse)
async def get_categoria(
    categoria_id: int,
    service: CategoryService = Depends(get_category_service),
):
    """Obtiene una categoría por ID. Requiere autenticación."""
    return service.get_by_id(categoria_id)


@router.post("/", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED)
async def create_categoria(
    data: CategoriaCreate,
    service: CategoryService = Depends(get_category_service),
    _: Usuario = Depends(require_role("admin", "cocinero")),
):
    """Crea una nueva categoría. Requiere rol STOCK o ADMIN."""
    return service.create(data)


@router.put("/{categoria_id}", response_model=CategoriaResponse)
async def update_categoria(
    categoria_id: int,
    data: CategoriaUpdate,
    service: CategoryService = Depends(get_category_service),
    _: Usuario = Depends(require_role("admin", "cocinero")),
):
    """Actualiza una categoría. Requiere rol STOCK o ADMIN."""
    return service.update(categoria_id, data)


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_categoria(
    categoria_id: int,
    service: CategoryService = Depends(get_category_service),
    _: Usuario = Depends(require_role("admin", "cocinero")),
):
    """Elimina (soft delete) una categoría. Requiere rol STOCK o ADMIN."""
    service.soft_delete(categoria_id)
