from typing import Optional
from pydantic import BaseModel, Field


class DireccionCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    calle: str = Field(min_length=1, max_length=255)
    numero: str = Field(max_length=20)
    ciudad: str = Field(min_length=1, max_length=100)
    provincia: Optional[str] = Field(default=None, max_length=100)
    codigo_postal: str = Field(max_length=10)
    referencias: Optional[str] = Field(default=None, max_length=500)
    es_default: bool = False


class DireccionUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    calle: Optional[str] = Field(default=None, min_length=1, max_length=255)
    numero: Optional[str] = Field(default=None, max_length=20)
    ciudad: Optional[str] = Field(default=None, min_length=1, max_length=100)
    provincia: Optional[str] = Field(default=None, max_length=100)
    codigo_postal: Optional[str] = Field(default=None, max_length=10)
    referencias: Optional[str] = Field(default=None, max_length=500)
    es_default: Optional[bool] = Field(default=None)


class DireccionResponse(BaseModel):
    id: int
    usuario_id: int
    nombre: str
    calle: str
    numero: str
    ciudad: str
    provincia: Optional[str] = None
    codigo_postal: str
    referencias: Optional[str] = None
    es_default: bool

    class Config:
        from_attributes = True
