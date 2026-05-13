from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from dependencies import get_db_session
from features.auth.dependencies import get_current_user
from features.auth.requires import require_role
from features.auth.models import Usuario
from features.repositories.unit_of_work import UnitOfWork
from features.admin.service import AdminService
from features.admin.schemas import (
    UserUpdateRequest, UserEstadoUpdateRequest,
    PaginatedUsersResponse, UserListResponse,
    MetricasResumen, VentasPorPeriodoResponse,
    TopProductoResponse, PedidosPorEstadoResponse,
    ConfigItem, ConfigUpdateRequest,
)

router = APIRouter(tags=["admin"])


def _get_admin_service(session: Session = Depends(get_db_session)) -> AdminService:
    uow = UnitOfWork(session)
    return AdminService(uow, session)


# ─── USUARIOS ───────────────────────────────────


@router.get(
    "/api/admin/usuarios",
    response_model=PaginatedUsersResponse,
    dependencies=[Depends(require_role("admin"))],
)
def list_usuarios(
    q: Optional[str] = Query(None, description="Búsqueda por nombre o email"),
    rol: Optional[str] = Query(None, description="Filtrar por rol"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    service: AdminService = Depends(_get_admin_service),
):
    """Listar usuarios del sistema (solo ADMIN)."""
    return service.list_users(q=q, rol=rol, skip=skip, limit=limit)


@router.put(
    "/api/admin/usuarios/{user_id}",
    response_model=UserListResponse,
    dependencies=[Depends(require_role("admin"))],
)
def update_usuario(
    user_id: int,
    data: UserUpdateRequest,
    session: Session = Depends(get_db_session),
    service: AdminService = Depends(_get_admin_service),
):
    """Editar datos y roles de un usuario (solo ADMIN)."""
    return service.update_user(user_id, data)


@router.patch(
    "/api/admin/usuarios/{user_id}/estado",
    response_model=UserListResponse,
    dependencies=[Depends(require_role("admin"))],
)
def toggle_usuario_estado(
    user_id: int,
    data: UserEstadoUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    service: AdminService = Depends(_get_admin_service),
):
    """Activar/desactivar un usuario (solo ADMIN)."""
    return service.toggle_user_status(user_id, data, current_user.id)


# ─── MÉTRICAS ────────────────────────────────────


@router.get(
    "/api/admin/metricas/resumen",
    response_model=MetricasResumen,
    dependencies=[Depends(require_role("admin"))],
)
def metricas_resumen(
    desde: date = Query(default=None, description="Fecha inicio (YYYY-MM-DD)"),
    hasta: date = Query(default=None, description="Fecha fin (YYYY-MM-DD)"),
    service: AdminService = Depends(_get_admin_service),
):
    """Dashboard: cards de resumen con métricas generales."""
    if desde is None:
        desde = date.today().replace(day=1)
    if hasta is None:
        hasta = date.today()
    return service.get_resumen(desde, hasta)


@router.get(
    "/api/admin/metricas/ventas",
    response_model=VentasPorPeriodoResponse,
    dependencies=[Depends(require_role("admin"))],
)
def metricas_ventas(
    desde: date = Query(default=None, description="Fecha inicio (YYYY-MM-DD)"),
    hasta: date = Query(default=None, description="Fecha fin (YYYY-MM-DD)"),
    granularidad: str = Query("dia", description="Agrupación: dia, semana, mes"),
    service: AdminService = Depends(_get_admin_service),
):
    """Evolución de ventas por período."""
    if desde is None:
        desde = date.today().replace(day=1)
    if hasta is None:
        hasta = date.today()
    return service.get_ventas(desde, hasta, granularidad)


@router.get(
    "/api/admin/metricas/productos-top",
    response_model=TopProductoResponse,
    dependencies=[Depends(require_role("admin"))],
)
def metricas_top_productos(
    top: int = Query(10, ge=1, le=100, description="Cantidad de productos a retornar"),
    desde: date = Query(default=None, description="Fecha inicio (YYYY-MM-DD)"),
    hasta: date = Query(default=None, description="Fecha fin (YYYY-MM-DD)"),
    service: AdminService = Depends(_get_admin_service),
):
    """Top productos más vendidos."""
    return service.get_top_productos(top, desde, hasta)


@router.get(
    "/api/admin/metricas/pedidos-por-estado",
    response_model=PedidosPorEstadoResponse,
    dependencies=[Depends(require_role("admin"))],
)
def metricas_pedidos_por_estado(
    desde: date = Query(default=None, description="Fecha inicio (YYYY-MM-DD)"),
    hasta: date = Query(default=None, description="Fecha fin (YYYY-MM-DD)"),
    service: AdminService = Depends(_get_admin_service),
):
    """Distribución de pedidos por estado."""
    return service.get_pedidos_por_estado(desde, hasta)


# ─── CONFIGURACIÓN ────────────────────────────────


@router.get(
    "/api/admin/configuracion",
    response_model=list[ConfigItem],
    dependencies=[Depends(require_role("admin"))],
)
def get_configuracion(
    service: AdminService = Depends(_get_admin_service),
):
    """Obtener todas las configuraciones del sistema."""
    return service.get_config()


@router.put(
    "/api/admin/configuracion",
    response_model=list[ConfigItem],
    dependencies=[Depends(require_role("admin"))],
)
def update_configuracion(
    data: ConfigUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    service: AdminService = Depends(_get_admin_service),
):
    """Actualizar configuraciones del sistema."""
    return service.update_config(data.configs, current_user.id)
