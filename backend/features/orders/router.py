from fastapi import APIRouter, Depends, status, Query
from sqlmodel import Session

from dependencies import get_db_session
from features.auth.dependencies import get_current_user
from features.auth.models import Usuario
from features.auth.requires import require_role
from features.orders.schemas import (
    PedidoCreateRequest, PedidoResponse, PedidoListResponse,
    EstadoUpdateRequest, DetallePedidoResponse,
)
from features.orders.service import OrderService

router = APIRouter()


def get_order_service(db: Session = Depends(get_db_session)) -> OrderService:
    return OrderService(db)


@router.get("/admin", response_model=PedidoListResponse)
async def list_all_pedidos(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: Usuario = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
    _= Depends(require_role("admin", "cocinero", "repartidor")),
):
    """Lista todos los pedidos (solo admin/gestor/cocinero/repartidor)."""

    items, total = service.list_all(page=page, limit=limit)
    responses = [service._build_response(p) for p in items]
    return PedidoListResponse(items=responses, total=total, page=page, limit=limit)


@router.get("", response_model=PedidoListResponse)
async def list_mis_pedidos(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: Usuario = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    """Lista los pedidos del usuario autenticado."""
    items, total = service.list_mine(current_user.id, page=page, limit=limit)
    responses = [service._build_response(p) for p in items]
    return PedidoListResponse(items=responses, total=total, page=page, limit=limit)


@router.get("/{pedido_id}", response_model=PedidoResponse)
async def get_pedido(
    pedido_id: int,
    current_user: Usuario = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    """Obtiene detalle de un pedido. Usuarios normales ven solo los suyos; admins ven cualquiera."""
    user_roles = [ur.rol.nombre.lower() if ur.rol else "" for ur in (current_user.roles or [])]
    is_admin = "admin" in user_roles

    if is_admin:
        pedido = service.get_by_id(pedido_id)
    else:
        pedido = service.get_by_id(pedido_id, usuario_id=current_user.id)

    response_data = service._build_response(pedido)
    return PedidoResponse(**response_data)


@router.post("", response_model=PedidoResponse, status_code=status.HTTP_201_CREATED)
async def create_pedido(
    data: PedidoCreateRequest,
    current_user: Usuario = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    """Crea un nuevo pedido desde el carrito."""
    pedido = service.create(data, current_user.id)
    response_data = service._build_response(pedido)
    return PedidoResponse(**response_data)


@router.put("/{pedido_id}/estado", response_model=PedidoResponse)
async def update_estado_pedido(
    pedido_id: int,
    data: EstadoUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
    _= Depends(require_role("admin", "cocinero", "repartidor", "cliente")),
):
    """Actualiza el estado de un pedido siguiendo la FSM."""
    user_roles = [ur.rol.nombre.lower() if ur.rol else "" for ur in (current_user.roles or [])]
    
    pedido = service.update_estado(pedido_id, data, user_roles, current_user.id)
    response_data = service._build_response(pedido)
    return PedidoResponse(**response_data)
