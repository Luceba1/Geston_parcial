from typing import Optional
from sqlmodel import Field, SQLModel
from features.base import BaseModel


class Ingrediente(BaseModel, SQLModel, table=True):
    __tablename__ = "ingredientes"
    
    nombre: str = Field(max_length=100)
    unidad_medida: str = Field(max_length=20)
    disponible: bool = Field(default=True)
    alergenos: Optional[str] = Field(default=None, max_length=500)