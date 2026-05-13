from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime


class Configuracion(SQLModel, table=True):
    __tablename__ = "configuracion"

    id: Optional[int] = Field(default=None, primary_key=True)
    clave: str = Field(max_length=100, unique=True, index=True)
    valor: str = Field(max_length=5000)
    updated_by_user_id: Optional[int] = Field(default=None, foreign_key="usuarios.id")
    updated_at: datetime = Field(default_factory=datetime.utcnow)
