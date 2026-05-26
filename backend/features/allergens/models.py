from typing import Optional, List
from sqlmodel import Field, Relationship, SQLModel
from features.base import BaseModel


class Alergeno(BaseModel, SQLModel, table=True):
    __tablename__ = "alergenos"

    nombre: str = Field(max_length=100, unique=True)
    icono: Optional[str] = Field(default=None, max_length=50)
    activo: bool = Field(default=True)

    ingredientes_rel: List["IngredienteAlergeno"] = Relationship(back_populates="alergeno")
