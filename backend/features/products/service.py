from typing import Optional, List
from sqlmodel import Session

from features.products.models import Producto, ProductoCategoria, ProductoIngrediente
from features.products.schemas import (
    ProductoCreate, ProductoUpdate, ProductoResponse, ProductoListResponse,
    CategoriaInfo, IngredienteInfo, ProductoCategoriaAssign, ProductoIngredienteAssign,
)
from features.repositories.producto_repository import ProductoRepository
from features.repositories.categoria_repository import CategoriaRepository
from features.repositories.ingrediente_repository import IngredienteRepository
from core.exceptions import NotFoundException, ConflictException, ValidationException


class ProductoService:
    def __init__(self, session: Session):
        self._session = session
        self.repo = ProductoRepository(session)
        self.cat_repo = CategoriaRepository(session)
        self.ing_repo = IngredienteRepository(session)

    def create(self, data: ProductoCreate) -> Producto:
        producto = self.repo.create({
            "nombre": data.nombre,
            "descripcion": data.descripcion,
            "precio": data.precio,
            "imagen_url": data.imagen_url,
            "stock": data.stock,
            "tiempo_preparacion_minutos": data.tiempo_preparacion_minutos,
        })
        return producto

    def list_admin(self, skip: int = 0, limit: int = 100) -> tuple[List[Producto], int]:
        items = self.repo.get_all(skip=skip, limit=limit)
        total = self.repo.count()
        return items, total

    def get_by_id(self, producto_id: int) -> Producto:
        producto = self.repo.get_by_id(producto_id)
        if not producto:
            raise NotFoundException("Producto", producto_id)
        return producto

    def update(self, producto_id: int, data: ProductoUpdate) -> Producto:
        producto = self.repo.get_by_id(producto_id)
        if not producto:
            raise NotFoundException("Producto", producto_id)
        
        update_data = data.model_dump(exclude_unset=True)
        updated = self.repo.update(producto_id, update_data)
        return updated  # type: ignore

    def assign_categories(self, producto_id: int, data: ProductoCategoriaAssign) -> Producto:
        producto = self.repo.get_by_id(producto_id)
        if not producto:
            raise NotFoundException("Producto", producto_id)
        
        # Validar que todas las categorías existan
        for cat_id in data.categoria_ids:
            categoria = self.cat_repo.get_by_id(cat_id)
            if not categoria:
                raise NotFoundException("Categoria", cat_id)
        
        # Reemplazar asociaciones
        old = self._session.query(ProductoCategoria).filter(
            ProductoCategoria.producto_id == producto_id
        ).all()
        for item in old:
            self._session.delete(item)
        
        for cat_id in data.categoria_ids:
            self._session.add(ProductoCategoria(producto_id=producto_id, categoria_id=cat_id))
        
        self._session.flush()
        self._session.refresh(producto)
        return producto

    def assign_ingredients(self, producto_id: int, data: ProductoIngredienteAssign) -> Producto:
        producto = self.repo.get_by_id(producto_id)
        if not producto:
            raise NotFoundException("Producto", producto_id)
        
        # Validar que todos los ingredientes existan
        for item in data.ingredientes:
            ingrediente = self.ing_repo.get_by_id(item.ingrediente_id)
            if not ingrediente:
                raise NotFoundException("Ingrediente", item.ingrediente_id)
        
        # Reemplazar asociaciones
        old = self._session.query(ProductoIngrediente).filter(
            ProductoIngrediente.producto_id == producto_id
        ).all()
        for item in old:
            self._session.delete(item)
        
        for item in data.ingredientes:
            self._session.add(ProductoIngrediente(
                producto_id=producto_id,
                ingrediente_id=item.ingrediente_id,
                cantidad=item.cantidad,
            ))
        
        self._session.flush()
        self._session.refresh(producto)
        return producto

    def soft_delete(self, producto_id: int) -> None:
        producto = self.repo.get_by_id(producto_id)
        if not producto:
            raise NotFoundException("Producto", producto_id)
        self.repo.soft_delete(producto_id)

    def update_stock(self, producto_id: int, cantidad: int, operacion: str = "set") -> Producto:
        producto = self.repo.get_by_id(producto_id)
        if not producto:
            raise NotFoundException("Producto", producto_id)
        
        if operacion == "set":
            if cantidad < 0:
                raise ValidationException("El stock no puede ser negativo")
            producto.stock = cantidad
        elif operacion == "incrementar":
            producto.stock += cantidad
        elif operacion == "decrementar":
            if producto.stock - cantidad < 0:
                raise ValidationException("El stock no puede ser negativo")
            producto.stock -= cantidad
        
        self._session.flush()
        self._session.refresh(producto)
        return producto

    def _build_response(self, producto: Producto) -> ProductoResponse:
        """Convierte un Producto con relaciones a ProductoResponse."""
        categorias = []
        for pc in producto.categorias or []:
            if pc.categoria:
                categorias.append(CategoriaInfo(id=pc.categoria.id, nombre=pc.categoria.nombre))
        
        ingredientes = []
        for pi in producto.ingredientes or []:
            if pi.ingrediente:
                es_alergeno = bool(pi.ingrediente.alergenos)
                ingredientes.append(IngredienteInfo(
                    id=pi.ingrediente.id,
                    nombre=pi.ingrediente.nombre,
                    cantidad=pi.cantidad,
                    alergeno=es_alergeno,
                ))
        
        return ProductoResponse(
            id=producto.id,
            nombre=producto.nombre,
            descripcion=producto.descripcion,
            precio=producto.precio,
            imagen_url=producto.imagen_url,
            activo=producto.activo,
            stock=producto.stock,
            tiempo_preparacion_minutos=producto.tiempo_preparacion_minutos,
            categorias=categorias,
            ingredientes=ingredientes,
            creado_en=producto.creado_en,
            actualizado_en=producto.actualizado_en,
        )
