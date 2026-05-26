from typing import Optional, List
from sqlmodel import Field, Relationship, SQLModel
from features.base import BaseModel


class IngredienteAlergeno(SQLModel, table=True):
    __tablename__ = "ingrediente_alergeno"

    ingrediente_id: int = Field(foreign_key="ingredientes.id", primary_key=True)
    alergeno_id: int = Field(foreign_key="alergenos.id", primary_key=True)

    ingrediente: "Ingrediente" = Relationship(back_populates="alergenos_rel")
    alergeno: "Alergeno" = Relationship(back_populates="ingredientes_rel")


class Ingrediente(BaseModel, SQLModel, table=True):
    __tablename__ = "ingredientes"
    
    nombre: str = Field(max_length=100)
    unidad_medida: str = Field(max_length=20)
    disponible: bool = Field(default=True)
    alergenos: Optional[str] = Field(default=None, max_length=500)

    alergenos_rel: List[IngredienteAlergeno] = Relationship(back_populates="ingrediente")