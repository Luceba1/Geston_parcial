from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

class Rol(SQLModel, table=True):
    __tablename__ = "roles"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50, unique=True)
    descripcion: Optional[str] = None
    
    usuarios: List["UsuarioRol"] = Relationship(back_populates="rol")

class Usuario(SQLModel, table=True):
    __tablename__ = "usuarios"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(max_length=255, unique=True, index=True)
    hashed_password: str
    nombre: str = Field(max_length=100)
    telefono: Optional[str] = Field(default=None, max_length=20)
    activo: bool = Field(default=True)
    es_superadmin: bool = Field(default=False)
    creado_en: Optional[datetime] = Field(default=None)
    actualizado_en: Optional[datetime] = Field(default=None)
    eliminado_en: Optional[datetime] = Field(default=None)
    
    roles: List["UsuarioRol"] = Relationship(back_populates="usuario")

class UsuarioRol(SQLModel, table=True):
    __tablename__ = "usuario_roles"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id")
    rol_id: int = Field(foreign_key="roles.id")
    
    usuario: "Usuario" = Relationship(back_populates="roles")
    rol: "Rol" = Relationship(back_populates="usuarios")

class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id")
    token: str = Field(max_length=500)
    expires_at: datetime = Field()
    created_at: datetime = Field(default_factory=datetime.utcnow)
    revoked: bool = Field(default=False)