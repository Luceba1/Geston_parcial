from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class ProductoCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=200)
    descripcion: Optional[str] = Field(default=None, max_length=1000)
    precio: float = Field(gt=0)
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    stock: int = Field(default=0, ge=0)
    tiempo_preparacion_minutos: int = Field(default=15, ge=1)


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=200)
    descripcion: Optional[str] = Field(default=None, max_length=1000)
    precio: Optional[float] = Field(default=None, gt=0)
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    activo: Optional[bool] = Field(default=None)
    stock: Optional[int] = Field(default=None, ge=0)
    tiempo_preparacion_minutos: Optional[int] = Field(default=None, ge=1)


class CategoriaInfo(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class IngredienteInfo(BaseModel):
    id: int
    nombre: str
    cantidad: float
    alergeno: bool = False

    class Config:
        from_attributes = True


class ProductoResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    imagen_url: Optional[str] = None
    activo: bool
    stock: int
    tiempo_preparacion_minutos: int
    categorias: List[CategoriaInfo] = []
    ingredientes: List[IngredienteInfo] = []
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductoListResponse(BaseModel):
    items: List[ProductoResponse]
    total: int
    page: int
    limit: int


class ProductoCategoriaAssign(BaseModel):
    categoria_ids: List[int]


class ProductoIngredienteItem(BaseModel):
    ingrediente_id: int
    cantidad: float = Field(ge=0)


class ProductoIngredienteAssign(BaseModel):
    ingredientes: List[ProductoIngredienteItem]


class StockUpdate(BaseModel):
    cantidad: int = Field(ge=0)
    operacion: str = Field(default="set", pattern="^(set|incrementar|decrementar)$")
