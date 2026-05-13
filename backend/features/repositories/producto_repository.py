from typing import Optional, List, Tuple
from sqlmodel import Session, select, func
from features.repositories.base_repository import BaseRepository
from features.products.models import Producto, ProductoIngrediente
from features.categories.models import Categoria
from features.ingredients.models import Ingrediente


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session):
        super().__init__(session, Producto)

    def get_by_nombre(self, nombre: str) -> Optional[Producto]:
        return self._session.query(self._model).filter(self._model.nombre == nombre).first()

    def search_public(
        self,
        skip: int = 0,
        limit: int = 20,
        categoria_id: Optional[int] = None,
        busqueda: Optional[str] = None,
        excluir_alergenos: Optional[List[int]] = None,
    ) -> Tuple[List[Producto], int]:
        """Busca productos públicos activos con filtros."""
        # Query base: solo productos activos y no eliminados
        query = select(Producto).where(
            Producto.activo == True,
            Producto.eliminado_en == None,
        )
        count_query = select(func.count()).select_from(Producto).where(
            Producto.activo == True,
            Producto.eliminado_en == None,
        )

        # Filtro por categoría
        if categoria_id is not None:
            from features.products.models import ProductoCategoria
            subquery = select(ProductoCategoria.producto_id).where(
                ProductoCategoria.categoria_id == categoria_id
            )
            query = query.where(Producto.id.in_(subquery))
            count_query = count_query.where(Producto.id.in_(subquery))

        # Búsqueda por nombre (case-insensitive)
        if busqueda:
            pattern = f"%{busqueda}%"
            query = query.where(Producto.nombre.ilike(pattern))
            count_query = count_query.where(Producto.nombre.ilike(pattern))

        # Excluir productos que contengan ciertos ingredientes (alérgenos)
        if excluir_alergenos:
            from features.products.models import ProductoIngrediente
            excl_subquery = select(ProductoIngrediente.producto_id).where(
                ProductoIngrediente.ingrediente_id.in_(excluir_alergenos)
            )
            query = query.where(Producto.id.notin_(excl_subquery))
            count_query = count_query.where(Producto.id.notin_(excl_subquery))

        # Obtener total
        total = self._session.exec(count_query).one()

        # Ejecutar query paginada
        query = query.offset(skip).limit(limit)
        items = list(self._session.exec(query).all())

        return items, total

    def get_public_detail(self, producto_id: int) -> Optional[Producto]:
        """Obtiene detalle completo de un producto público activo."""
        statement = select(Producto).where(
            Producto.id == producto_id,
            Producto.activo == True,
            Producto.eliminado_en == None,
        )
        return self._session.exec(statement).first()

    def update_stock_atomic(self, producto_id: int, cantidad: int) -> Optional[Producto]:
        """Actualiza stock de forma atómica (incremento)."""
        producto = self.get_by_id(producto_id)
        if not producto:
            return None
        producto.stock += cantidad
        self._session.flush()
        self._session.refresh(producto)
        return producto