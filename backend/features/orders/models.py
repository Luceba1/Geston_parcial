from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime


class EstadoPedido(SQLModel, table=True):
    __tablename__ = "estados_pedido"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50, unique=True)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    orden: int = Field(default=0)
    
    historial: List["HistorialEstadoPedido"] = Relationship(back_populates="estado")


class DetallePedido(SQLModel, table=True):
    __tablename__ = "detalles_pedido"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedidos.id")
    producto_id: int = Field(foreign_key="productos.id")
    nombre_snapshot: str = Field(max_length=200)
    precio_snapshot: float = Field(ge=0)
    cantidad: int = Field(default=1, ge=1)
    excluded_ingredient_ids: Optional[str] = Field(default=None, max_length=500)
    personalizacion_snapshot: Optional[str] = Field(default=None, max_length=1000)
    
    pedido: "Pedido" = Relationship(back_populates="detalles")


class Pedido(SQLModel, table=True):
    __tablename__ = "pedidos"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id")
    direccion_entrega_id: int = Field(foreign_key="direcciones_entrega.id")
    estado_id: int = Field(foreign_key="estados_pedido.id")
    forma_pago_id: Optional[int] = Field(default=None, foreign_key="formas_pago.id")
    subtotal: float = Field(ge=0)
    costo_envio: float = Field(ge=0, default=0)
    total: float = Field(ge=0)
    notas: Optional[str] = None
    direccion_snapshot: Optional[str] = Field(default=None, max_length=2000)
    fecha_pedido: datetime = Field(default_factory=datetime.utcnow)
    fecha_entrega_estimada: Optional[datetime] = None
    
    detalles: List["DetallePedido"] = Relationship(back_populates="pedido")
    historial_estados: List["HistorialEstadoPedido"] = Relationship(back_populates="pedido")


class HistorialEstadoPedido(SQLModel, table=True):
    __tablename__ = "historial_estado_pedido"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedidos.id")
    estado_id: int = Field(foreign_key="estados_pedido.id")
    usuario_id: Optional[int] = Field(default=None, foreign_key="usuarios.id", nullable=True)
    fecha_cambio: datetime = Field(default_factory=datetime.utcnow)
    notas: Optional[str] = Field(default=None, max_length=1000)
    
    pedido: "Pedido" = Relationship(back_populates="historial_estados")
    estado: "EstadoPedido" = Relationship(back_populates="historial")