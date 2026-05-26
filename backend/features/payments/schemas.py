from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class PagoCreateRequest(BaseModel):
    """Solicitud para crear un nuevo pago."""
    pedido_id: int = Field(..., description="ID del pedido a pagar")


class PagoReintentarRequest(BaseModel):
    """Solicitud para reintentar un pago rechazado."""
    pedido_id: int = Field(..., description="ID del pedido a reintentar")


class PagoResponse(BaseModel):
    """Respuesta con datos del pago."""
    id: int
    pedido_id: int
    forma_pago_id: int
    monto: float
    estado: str
    mp_preference_id: Optional[str] = None
    mp_init_point: Optional[str] = None
    mp_payment_id: Optional[int] = None
    mp_status: Optional[str] = None
    mp_status_detail: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PagoCrearResponse(BaseModel):
    """Respuesta al crear un pago (incluye datos para el frontend)."""
    pago: PagoResponse
    preference_id: str
    init_point: Optional[str] = None
    public_key: Optional[str] = None


class PagoWebhookRequest(BaseModel):
    """Payload del webhook IPN de MercadoPago."""
    type: Optional[str] = Field(default=None, description="Tipo de notificación (payment, merchant_order, etc.)")
    action: Optional[str] = Field(default=None, alias="action", description="Acción (payment.created, payment.updated, etc.)")
    data_id: Optional[int] = Field(default=None, alias="data.id", description="ID del recurso en MP")
    data: Optional[dict] = Field(default=None, description="Datos adicionales del webhook")

    class Config:
        populate_by_name = True
        extra = "allow"


class ConfirmarPagoRequest(BaseModel):
    """Solicitud para confirmar un pago post-redirect desde MP.
    payment_id es opcional: si no se provee (ej: se perdió en el redirect),
    el backend busca el pago en MP por external_reference (pedido_id).
    """
    pedido_id: int = Field(..., description="ID del pedido")
    payment_id: Optional[int] = Field(default=None, description="ID del pago en MercadoPago (opcional, se busca por pedido si no está)")


class PagoEstadoResponse(BaseModel):
    """Respuesta simple con el estado del pago."""
    estado: Optional[str] = None
    disponible: bool = True
    pago: Optional[PagoResponse] = None
