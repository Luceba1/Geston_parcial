from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from dependencies import get_db_session
from features.auth.dependencies import get_current_user
from features.auth.models import Usuario
from features.addresses.schemas import DireccionCreate, DireccionUpdate, DireccionResponse
from features.addresses.service import AddressService

router = APIRouter()


def get_address_service(db: Session = Depends(get_db_session)) -> AddressService:
    return AddressService(db)


@router.get("/", response_model=list[DireccionResponse])
async def list_direcciones(
    current_user: Usuario = Depends(get_current_user),
    service: AddressService = Depends(get_address_service),
):
    """Lista las direcciones del usuario autenticado."""
    return service.list_by_user(current_user.id)


@router.get("/{direccion_id}", response_model=DireccionResponse)
async def get_direccion(
    direccion_id: int,
    current_user: Usuario = Depends(get_current_user),
    service: AddressService = Depends(get_address_service),
):
    """Obtiene una dirección por ID (solo del usuario autenticado)."""
    return service.get_by_id(direccion_id, current_user.id)


@router.post("/", response_model=DireccionResponse, status_code=status.HTTP_201_CREATED)
async def create_direccion(
    data: DireccionCreate,
    current_user: Usuario = Depends(get_current_user),
    service: AddressService = Depends(get_address_service),
):
    """Crea una nueva dirección para el usuario autenticado."""
    return service.create(data, current_user.id)


@router.put("/{direccion_id}", response_model=DireccionResponse)
async def update_direccion(
    direccion_id: int,
    data: DireccionUpdate,
    current_user: Usuario = Depends(get_current_user),
    service: AddressService = Depends(get_address_service),
):
    """Actualiza una dirección existente."""
    return service.update(direccion_id, data, current_user.id)


@router.delete("/{direccion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_direccion(
    direccion_id: int,
    current_user: Usuario = Depends(get_current_user),
    service: AddressService = Depends(get_address_service),
):
    """Elimina (soft delete) una dirección."""
    service.soft_delete(direccion_id, current_user.id)


@router.put("/{direccion_id}/default", response_model=DireccionResponse)
async def set_default_direccion(
    direccion_id: int,
    current_user: Usuario = Depends(get_current_user),
    service: AddressService = Depends(get_address_service),
):
    """Establece una dirección como predeterminada."""
    return service.set_default(direccion_id, current_user.id)
