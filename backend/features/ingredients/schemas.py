from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class IngredienteCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    unidad_medida: str = Field(max_length=20)
    alergenos: Optional[str] = Field(default=None, max_length=500)


class IngredienteUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    unidad_medida: Optional[str] = Field(default=None, max_length=20)
    disponible: Optional[bool] = Field(default=None)
    alergenos: Optional[str] = Field(default=None, max_length=500)


class IngredienteResponse(BaseModel):
    id: int
    nombre: str
    unidad_medida: str
    disponible: bool
    alergenos: Optional[str] = None
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True
