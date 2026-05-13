from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# --- Usuarios ---

class UserListResponse(BaseModel):
    id: int
    email: str
    nombre: str
    telefono: Optional[str] = None
    activo: bool
    roles: list[str]
    creado_en: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    roles: Optional[list[str]] = None


class UserEstadoUpdateRequest(BaseModel):
    activo: bool


class PaginatedUsersResponse(BaseModel):
    items: list[UserListResponse]
    total: int
    skip: int
    limit: int


# --- Métricas ---

class ProductoMasVendido(BaseModel):
    producto_id: int
    nombre_snapshot: str
    cantidad_total_vendida: int
    ingreso_total_generado: float


class PedidosPorEstado(BaseModel):
    estado_id: int
    estado_nombre: str
    cantidad: int


class MetricasResumen(BaseModel):
    total_ventas: float
    cantidad_pedidos: int
    cantidad_usuarios: int
    productos_mas_vendidos: list[ProductoMasVendido]
    pedidos_por_estado: list[PedidosPorEstado]


class VentaPeriodo(BaseModel):
    fecha: str
    monto_total: float
    cantidad_pedidos: int


class VentasPorPeriodoResponse(BaseModel):
    items: list[VentaPeriodo]
    desde: str
    hasta: str
    granularidad: str


class TopProductoResponse(BaseModel):
    items: list[ProductoMasVendido]
    top: int
    desde: str
    hasta: str


class PedidosPorEstadoResponse(BaseModel):
    items: list[PedidosPorEstado]
    desde: str
    hasta: str


# --- Configuración ---

class ConfigItem(BaseModel):
    clave: str
    valor: str
    updated_by: Optional[str] = None
    updated_at: Optional[datetime] = None


class ConfigUpdateRequest(BaseModel):
    configs: dict[str, str]
