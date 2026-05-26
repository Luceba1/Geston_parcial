from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class DetalleCocinaResponse(BaseModel):
    nombre_snapshot: str
    cantidad: int
    subtotal: float
    personalizacion_snapshot: Optional[str] = None
    excluded_ingredient_ids: Optional[str] = None


class PedidoCocinaResponse(BaseModel):
    """Pedido listo para mostrar en el KDS."""

    id: int
    estado_nombre: str
    items: list[DetalleCocinaResponse]
    notas: Optional[str] = None
    direccion_snapshot: Optional[str] = None
    entrada_cocina_en: datetime  # timestamp de cuando entró al estado actual

    class Config:
        from_attributes = True


class PedidoCocinaListResponse(BaseModel):
    items: list[PedidoCocinaResponse]
    total: int


# --- US-COCINA-07: Marcar producto no disponible ---

class ProductoDisponibilidad(BaseModel):
    """Producto con su estado de disponibilidad para el KDS."""

    id: int
    nombre: str
    disponible: bool

    class Config:
        from_attributes = True


class DisponibilidadUpdate(BaseModel):
    """Body para togglear la disponibilidad de un producto."""

    disponible: bool
