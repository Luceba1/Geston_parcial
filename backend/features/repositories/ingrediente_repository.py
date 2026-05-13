from typing import Optional
from sqlmodel import Session, select
from features.repositories.base_repository import BaseRepository
from features.ingredients.models import Ingrediente
from features.products.models import ProductoIngrediente


class IngredienteRepository(BaseRepository[Ingrediente]):
    def __init__(self, session: Session):
        super().__init__(session, Ingrediente)

    def get_by_nombre(self, nombre: str) -> Optional[Ingrediente]:
        return self._session.query(self._model).filter(self._model.nombre == nombre).first()

    def get_products_count(self, ingrediente_id: int) -> int:
        """Cuenta productos activos asociados a un ingrediente."""
        from sqlmodel import func
        statement = select(func.count()).select_from(ProductoIngrediente).where(
            ProductoIngrediente.ingrediente_id == ingrediente_id,
        )
        result = self._session.exec(statement).one()
        return result