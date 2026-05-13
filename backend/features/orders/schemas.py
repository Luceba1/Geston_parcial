from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class DetallePedidoCreate(BaseModel):
    producto_id: int
    nombre_snapshot: str = Field(max_length=200)
    precio_snapshot: float = Field(gt=0)
    cantidad: int = Field(default=1, ge=1)
    excluded_ingredient_ids: Optional[str] = Field(default=None, max_length=500)
    personalizacion_snapshot: Optional[str] = Field(default=None, max_length=1000)


class PedidoCreateRequest(BaseModel):
    direccion_entrega_id: int
    forma_pago_id: Optional[int] = None
    notas: Optional[str] = Field(default=None, max_length=1000)
    items: List[DetallePedidoCreate] = Field(min_length=1)


class EstadoUpdateRequest(BaseModel):
    estado_nombre: str = Field(max_length=50)
    notas: Optional[str] = Field(default=None, max_length=1000)


class DetallePedidoResponse(BaseModel):
    id: int
    producto_id: int
    nombre_snapshot: str
    precio_snapshot: float
    cantidad: int
    excluded_ingredient_ids: Optional[str] = None
    personalizacion_snapshot: Optional[str] = None
    subtotal: float = 0

    class Config:
        from_attributes = True


class HistorialEstadoResponse(BaseModel):
    id: int
    estado_id: int
    estado_nombre: str = ""
    fecha_cambio: datetime
    notas: Optional[str] = None

    class Config:
        from_attributes = True


class PedidoResponse(BaseModel):
    id: int
    usuario_id: int
    estado_id: int
    estado_nombre: str = ""
    estado_orden: int = 0
    forma_pago_id: Optional[int] = None
    subtotal: float
    costo_envio: float
    total: float
    notas: Optional[str] = None
    direccion_snapshot: Optional[str] = None
    fecha_pedido: datetime
    fecha_entrega_estimada: Optional[datetime] = None
    detalles: List[DetallePedidoResponse] = []
    historial_estados: List[HistorialEstadoResponse] = []

    class Config:
        from_attributes = True


class PedidoListResponse(BaseModel):
    items: List[PedidoResponse]
    total: int
    page: int
    limit: int
