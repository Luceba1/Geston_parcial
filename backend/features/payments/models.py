from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import BigInteger


class FormaPago(SQLModel, table=True):
    __tablename__ = "formas_pago"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    icono: Optional[str] = Field(default=None, max_length=255)
    activo: bool = Field(default=True)

    pagos: list["Pago"] = Relationship(back_populates="forma_pago")


class Pago(SQLModel, table=True):
    __tablename__ = "pagos"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedidos.id", index=True)
    forma_pago_id: int = Field(foreign_key="formas_pago.id")
    monto: float = Field(ge=0)
    estado: str = Field(max_length=20)  # pendiente | aprobado | rechazado

    # MercadoPago tracking
    mp_preference_id: Optional[str] = Field(default=None, max_length=255)
    mp_init_point: Optional[str] = Field(default=None, max_length=500)
    mp_payment_id: Optional[int] = Field(default=None, sa_type=BigInteger)
    mp_merchant_order_id: Optional[int] = Field(default=None, sa_type=BigInteger)
    mp_status: Optional[str] = Field(default=None, max_length=50)
    mp_status_detail: Optional[str] = Field(default=None, max_length=100)

    # Idempotencia
    idempotency_key: str = Field(max_length=36, unique=True)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

    forma_pago: FormaPago = Relationship(back_populates="pagos")