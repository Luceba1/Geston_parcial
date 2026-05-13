from typing import Optional, List
from sqlmodel import Session, select
from features.repositories.base_repository import BaseRepository
from features.categories.models import Categoria
from features.products.models import ProductoCategoria


class CategoriaRepository(BaseRepository[Categoria]):
    def __init__(self, session: Session):
        super().__init__(session, Categoria)

    def get_by_slug(self, slug: str) -> Optional[Categoria]:
        return self._session.query(self._model).filter(self._model.slug == slug).first()

    def get_tree_data(self) -> List[Categoria]:
        """Obtiene todas las categorías activas para armar el árbol."""
        statement = select(Categoria).where(Categoria.activo == True)
        return list(self._session.exec(statement).all())

    def get_active_subcategories(self, categoria_id: int) -> List[Categoria]:
        """Obtiene las subcategorías activas de una categoría."""
        statement = select(Categoria).where(
            Categoria.padre_id == categoria_id,
            Categoria.activo == True,
        )
        return list(self._session.exec(statement).all())

    def get_products_count(self, categoria_id: int) -> int:
        """Cuenta productos activos asociados a una categoría."""
        from sqlmodel import func
        statement = select(func.count()).select_from(ProductoCategoria).where(
            ProductoCategoria.categoria_id == categoria_id,
        )
        result = self._session.exec(statement).one()
        return result