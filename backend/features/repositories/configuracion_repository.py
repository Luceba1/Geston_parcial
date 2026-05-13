from sqlmodel import Session
from features.repositories.base_repository import BaseRepository
from features.admin.models import Configuracion


class ConfiguracionRepository(BaseRepository[Configuracion]):
    def __init__(self, session: Session):
        super().__init__(session, Configuracion)

    def get_by_clave(self, clave: str) -> Configuracion | None:
        return self._session.query(self._model).filter(self._model.clave == clave).first()
