from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class DireccionEntrega(SQLModel, table=True):
    __tablename__ = "direcciones_entrega"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id")
    nombre: str = Field(max_length=100)
    calle: str = Field(max_length=255)
    numero: str = Field(max_length=20)
    ciudad: str = Field(max_length=100)
    provincia: Optional[str] = Field(default=None, max_length=100)
    codigo_postal: str = Field(max_length=10)
    referencias: Optional[str] = Field(default=None, max_length=500)
    es_default: bool = Field(default=False)
    creado_en: Optional[datetime] = Field(default=None)
    actualizado_en: Optional[datetime] = Field(default=None)
    eliminado_en: Optional[datetime] = Field(default=None)