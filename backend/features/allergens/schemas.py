from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class AlergenoCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    icono: Optional[str] = Field(default=None, max_length=50)


class AlergenoUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    icono: Optional[str] = Field(default=None, max_length=50)
    activo: Optional[bool] = Field(default=None)


class AlergenoResponse(BaseModel):
    id: int
    nombre: str
    icono: Optional[str] = None
    activo: bool
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True


class AlergenoInfo(BaseModel):
    """Schema público liviano para incluir en respuestas de productos."""
    id: int
    nombre: str
    icono: Optional[str] = None

    class Config:
        from_attributes = True
