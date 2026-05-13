from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from dependencies import get_db_session
from features.auth.dependencies import get_current_user
from features.auth.requires import require_role
from features.auth.models import Usuario
from features.ingredients.schemas import IngredienteCreate, IngredienteUpdate, IngredienteResponse
from features.ingredients.service import IngredienteService

router = APIRouter()


def get_ingrediente_service(db: Session = Depends(get_db_session)) -> IngredienteService:
    return IngredienteService(db)


@router.get("/", response_model=dict)
async def list_ingredientes(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=500),
    solo_disponibles: bool = Query(default=True),
    service: IngredienteService = Depends(get_ingrediente_service),
):
    """Lista ingredientes. Público."""
    skip = (page - 1) * limit
    items, total = service.list(skip=skip, limit=limit, solo_disponibles=solo_disponibles)
    return {
        "items": [IngredienteResponse.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/{ingrediente_id}", response_model=IngredienteResponse)
async def get_ingrediente(
    ingrediente_id: int,
    service: IngredienteService = Depends(get_ingrediente_service),
):
    """Obtiene un ingrediente por ID."""
    return service.get_by_id(ingrediente_id)


@router.post("/", response_model=IngredienteResponse, status_code=status.HTTP_201_CREATED)
async def create_ingrediente(
    data: IngredienteCreate,
    service: IngredienteService = Depends(get_ingrediente_service),
    _: Usuario = Depends(require_role("admin")),
):
    """Crea un nuevo ingrediente. Requiere rol ADMIN."""
    return service.create(data)


@router.put("/{ingrediente_id}", response_model=IngredienteResponse)
async def update_ingrediente(
    ingrediente_id: int,
    data: IngredienteUpdate,
    service: IngredienteService = Depends(get_ingrediente_service),
    _: Usuario = Depends(require_role("admin")),
):
    """Actualiza un ingrediente. Requiere rol ADMIN."""
    return service.update(ingrediente_id, data)


@router.delete("/{ingrediente_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ingrediente(
    ingrediente_id: int,
    service: IngredienteService = Depends(get_ingrediente_service),
    _: Usuario = Depends(require_role("admin")),
):
    """Elimina (soft delete) un ingrediente. Requiere rol ADMIN."""
    service.soft_delete(ingrediente_id)
