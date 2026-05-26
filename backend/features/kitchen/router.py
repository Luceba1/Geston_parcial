"""
Router del Kitchen Display System (KDS).

Endpoints:
- GET /api/v1/cocina/pedidos: carga inicial + fallback polling (REST)
- WS /api/v1/cocina/ws: WebSocket para tiempo real
"""
import asyncio
import logging

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlmodel import Session

from dependencies import get_db_session
from core.security import decode_token
from features.auth.models import Usuario
from features.auth.requires import require_role
from features.kitchen.event_manager import event_manager
from features.kitchen.schemas import (
    PedidoCocinaListResponse,
    ProductoDisponibilidad,
    DisponibilidadUpdate,
)
from features.kitchen.service import KitchenService

logger = logging.getLogger(__name__)

router = APIRouter()


def get_kitchen_service(db: Session = Depends(get_db_session)) -> KitchenService:
    return KitchenService(db)


@router.get("/pedidos", response_model=PedidoCocinaListResponse)
async def list_pedidos_cocina(
    service: KitchenService = Depends(get_kitchen_service),
    _: Usuario = Depends(require_role("cocinero", "admin", "pedidos")),
):
    """Lista pedidos activos en cocina (CONFIRMADO + EN_PREPARACION).

    Usado para carga inicial del KDS y como fallback por polling
    cuando el WebSocket está desconectado.
    """
    items, total = service.list_pedidos_cocina()
    return PedidoCocinaListResponse(items=items, total=total)


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    db: Session = Depends(get_db_session),
):
    """WebSocket para eventos de cocina en tiempo real.

    El cliente se conecta y recibe mensajes JSON:
    ```json
    {"event": "PEDIDO_CONFIRMADO", "data": {"pedido_id": 1}}
    {"event": "PEDIDO_EN_PREPARACION", "data": {"pedido_id": 1}}
    {"event": "PEDIDO_EN_CAMINO", "data": {"pedido_id": 1}}
    {"event": "PEDIDO_CANCELADO", "data": {"pedido_id": 1}}
    {"event": "ping", "data": {}}  // keepalive cada 30s
    ```
    """
    # ---- Autenticación vía JWT en query param ----
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id = payload.get("sub")
    if user_id is None:
        await websocket.close(code=4001)
        return

    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not usuario or not usuario.activo:
        await websocket.close(code=4001)
        return

    # Verificar rol
    role_names = [ur.rol.nombre for ur in usuario.roles]
    if not any(r in role_names for r in ["cocinero", "admin", "pedidos"]):
        await websocket.close(code=4003)
        return

    # ---- Conexión aceptada ----
    await websocket.accept()
    logger.info("WS client connected: user=%s roles=%s", usuario.email, role_names)

    queue = await event_manager.subscribe()
    try:
        while True:
            try:
                data = await asyncio.wait_for(queue.get(), timeout=30.0)
                await websocket.send_json(data)
            except asyncio.TimeoutError:
                # Heartbeat para mantener la conexión viva
                try:
                    await websocket.send_json({"event": "ping", "data": {}})
                except Exception:
                    break
    except WebSocketDisconnect:
        logger.info("WS client disconnected: user=%s", usuario.email)
    except Exception as exc:
        logger.warning("WS error for user=%s: %s", usuario.email, exc)
    finally:
        await event_manager.unsubscribe(queue)
        try:
            await db.close()
        except Exception:
            pass


# --- US-COCINA-07: Marcar producto no disponible ---

@router.get("/productos", response_model=list[ProductoDisponibilidad])
async def list_productos_cocina(
    service: KitchenService = Depends(get_kitchen_service),
    _: Usuario = Depends(require_role("cocinero", "admin")),
):
    """Lista productos activos con su estado de disponibilidad para la cocina."""
    return service.list_productos_cocina()


@router.patch("/productos/{producto_id}/disponibilidad", response_model=ProductoDisponibilidad)
async def toggle_disponibilidad(
    producto_id: int,
    data: DisponibilidadUpdate,
    service: KitchenService = Depends(get_kitchen_service),
    _: Usuario = Depends(require_role("cocinero", "admin")),
):
    """La cocina puede apagar/encender la disponibilidad de un producto (RN-CO08)."""
    return service.toggle_disponibilidad(producto_id, data.disponible)
