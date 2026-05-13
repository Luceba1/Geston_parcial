from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class CategoriaCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    slug: Optional[str] = Field(default=None, max_length=100)
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    padre_id: Optional[int] = Field(default=None)


class CategoriaUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    slug: Optional[str] = Field(default=None, max_length=100)
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    activo: Optional[bool] = Field(default=None)
    padre_id: Optional[int] = Field(default=None)


class CategoriaResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    slug: str
    imagen_url: Optional[str] = None
    activo: bool
    padre_id: Optional[int] = None
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True


class CategoriaTree(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    slug: str
    imagen_url: Optional[str] = None
    activo: bool
    padre_id: Optional[int] = None
    subcategorias: List["CategoriaTree"] = []

    class Config:
        from_attributes = True
