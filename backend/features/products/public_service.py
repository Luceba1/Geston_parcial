from typing import Optional, List
from sqlmodel import Session

from features.products.models import Producto
from features.products.schemas import (
    ProductoResponse, ProductoListResponse, CategoriaInfo, IngredienteInfo,
)
from features.repositories.producto_repository import ProductoRepository


class PublicCatalogService:
    def __init__(self, session: Session):
        self._session = session
        self.repo = ProductoRepository(session)

    def list_public(
        self,
        page: int = 1,
        limit: int = 20,
        categoria_id: Optional[int] = None,
        busqueda: Optional[str] = None,
        excluir_alergenos: Optional[str] = None,
    ) -> ProductoListResponse:
        skip = (page - 1) * limit
        
        # Parsear IDs de alérgenos a excluir
        excluir_ids: Optional[List[int]] = None
        if excluir_alergenos:
            try:
                excluir_ids = [int(x.strip()) for x in excluir_alergenos.split(",") if x.strip()]
            except ValueError:
                excluir_ids = []
        
        items, total = self.repo.search_public(
            skip=skip,
            limit=limit,
            categoria_id=categoria_id,
            busqueda=busqueda,
            excluir_alergenos=excluir_ids,
        )
        
        productos_response = [self._build_public_response(p) for p in items]
        
        return ProductoListResponse(
            items=productos_response,
            total=total,
            page=page,
            limit=limit,
        )

    def get_detail(self, producto_id: int) -> ProductoResponse:
        producto = self.repo.get_public_detail(producto_id)
        if not producto:
            from core.exceptions import NotFoundException
            raise NotFoundException("Producto", producto_id)
        
        return self._build_public_response(producto)

    def _build_public_response(self, producto: Producto) -> ProductoResponse:
        """Convierte un Producto con relaciones a ProductoResponse público."""
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
