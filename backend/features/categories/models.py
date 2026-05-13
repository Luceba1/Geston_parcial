from typing import Optional, List
from sqlmodel import Field, Relationship, SQLModel
from features.base import BaseModel


class Categoria(BaseModel, SQLModel, table=True):
    __tablename__ = "categorias"
    
    nombre: str = Field(max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    slug: str = Field(max_length=100, unique=True, index=True)
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    activo: bool = Field(default=True)
    padre_id: Optional[int] = Field(default=None, foreign_key="categorias.id")