from typing import Optional, List
from sqlmodel import Field, Relationship, SQLModel
from features.base import BaseModel


class Producto(BaseModel, SQLModel, table=True):
    __tablename__ = "productos"
    
    nombre: str = Field(max_length=200)
    descripcion: Optional[str] = Field(default=None, max_length=1000)
    precio: float = Field(ge=0)
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    activo: bool = Field(default=True)
    disponible: bool = Field(default=True, description="Disponible para la venta (lo puede togglear cocina)")
    stock: int = Field(default=0, ge=0)
    tiempo_preparacion_minutos: int = Field(default=15)
    
    categorias: List["ProductoCategoria"] = Relationship(back_populates="producto")
    ingredientes: List["ProductoIngrediente"] = Relationship(back_populates="producto")

class ProductoCategoria(SQLModel, table=True):
    __tablename__ = "producto_categorias"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    producto_id: int = Field(foreign_key="productos.id")
    categoria_id: int = Field(foreign_key="categorias.id")
    
    producto: "Producto" = Relationship(back_populates="categorias")
    categoria: "Categoria" = Relationship()


class ProductoIngrediente(SQLModel, table=True):
    __tablename__ = "producto_ingredientes"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    producto_id: int = Field(foreign_key="productos.id")
    ingrediente_id: int = Field(foreign_key="ingredientes.id")
    cantidad: float = Field(ge=0)
    
    producto: "Producto" = Relationship(back_populates="ingredientes")
    ingrediente: "Ingrediente" = Relationship()