from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from dependencies import get_db_session
from features.auth.dependencies import get_current_user
from features.auth.requires import require_role
from features.auth.models import Usuario
from features.allergens.schemas import AlergenoCreate, AlergenoUpdate, AlergenoResponse
from features.allergens.service import AllergenService

router = APIRouter()


def get_allergen_service(db: Session = Depends(get_db_session)) -> AllergenService:
    return AllergenService(db)


@router.get("/", response_model=list[AlergenoResponse])
async def list_alergenos(
    solo_activos: bool = Query(default=True),
    service: AllergenService = Depends(get_allergen_service),
):
    """Lista alérgenos. Público (lo necesita el catálogo)."""
    return service.list(solo_activos=solo_activos)


@router.get("/{alergeno_id}", response_model=AlergenoResponse)
async def get_alergeno(
    alergeno_id: int,
    service: AllergenService = Depends(get_allergen_service),
):
    """Obtiene un alérgeno por ID."""
    return service.get_by_id(alergeno_id)


@router.post("/", response_model=AlergenoResponse, status_code=status.HTTP_201_CREATED)
async def create_alergeno(
    data: AlergenoCreate,
    service: AllergenService = Depends(get_allergen_service),
    _: Usuario = Depends(require_role("admin")),
):
    """Crea un nuevo alérgeno. Requiere rol ADMIN."""
    return service.create(data)


@router.put("/{alergeno_id}", response_model=AlergenoResponse)
async def update_alergeno(
    alergeno_id: int,
    data: AlergenoUpdate,
    service: AllergenService = Depends(get_allergen_service),
    _: Usuario = Depends(require_role("admin")),
):
    """Actualiza un alérgeno. Requiere rol ADMIN."""
    return service.update(alergeno_id, data)


@router.delete("/{alergeno_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alergeno(
    alergeno_id: int,
    service: AllergenService = Depends(get_allergen_service),
    _: Usuario = Depends(require_role("admin")),
):
    """Desactiva (soft delete) un alérgeno. Requiere rol ADMIN."""
    service.soft_delete(alergeno_id)
