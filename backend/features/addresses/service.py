from typing import Optional
from sqlmodel import Session, select
from features.addresses.models import DireccionEntrega
from features.addresses.schemas import DireccionCreate, DireccionUpdate
from core.exceptions import NotFoundException, ForbiddenException


class AddressService:
    def __init__(self, session: Session):
        self._session = session

    def list_by_user(self, usuario_id: int) -> list[DireccionEntrega]:
        statement = select(DireccionEntrega).where(
            DireccionEntrega.usuario_id == usuario_id,
            DireccionEntrega.eliminado_en.is_(None),
        ).order_by(DireccionEntrega.es_default.desc(), DireccionEntrega.id.desc())
        return list(self._session.exec(statement).all())

    def get_by_id(self, direccion_id: int, usuario_id: int) -> DireccionEntrega:
        direccion = self._session.get(DireccionEntrega, direccion_id)
        if not direccion or direccion.eliminado_en is not None:
            raise NotFoundException("Dirección no encontrada")
        if direccion.usuario_id != usuario_id:
            raise ForbiddenException("No tenés permisos para acceder a esta dirección")
        return direccion

    def create(self, data: DireccionCreate, usuario_id: int) -> DireccionEntrega:
        # Si es la primera dirección, marcar como default
        existing = self.list_by_user(usuario_id)
        es_default = data.es_default or len(existing) == 0

        if es_default:
            self._clear_default(usuario_id)

        direccion = DireccionEntrega(
            usuario_id=usuario_id,
            nombre=data.nombre,
            calle=data.calle,
            numero=data.numero,
            ciudad=data.ciudad,
            provincia=getattr(data, 'provincia', None),
            codigo_postal=data.codigo_postal,
            referencias=data.referencias,
            es_default=es_default,
        )
        self._session.add(direccion)
        self._session.flush()
        self._session.refresh(direccion)
        return direccion

    def update(self, direccion_id: int, data: DireccionUpdate, usuario_id: int) -> DireccionEntrega:
        direccion = self.get_by_id(direccion_id, usuario_id)

        update_data = data.model_dump(exclude_unset=True)
        if 'es_default' in update_data and update_data['es_default']:
            self._clear_default(usuario_id)

        for key, value in update_data.items():
            setattr(direccion, key, value)

        self._session.flush()
        self._session.refresh(direccion)
        return direccion

    def soft_delete(self, direccion_id: int, usuario_id: int) -> None:
        from datetime import datetime
        direccion = self.get_by_id(direccion_id, usuario_id)
        direccion.eliminado_en = datetime.utcnow()
        self._session.flush()

    def set_default(self, direccion_id: int, usuario_id: int) -> DireccionEntrega:
        direccion = self.get_by_id(direccion_id, usuario_id)
        self._clear_default(usuario_id)
        direccion.es_default = True
        self._session.flush()
        self._session.refresh(direccion)
        return direccion

    def _clear_default(self, usuario_id: int) -> None:
        from datetime import datetime
        statement = select(DireccionEntrega).where(
            DireccionEntrega.usuario_id == usuario_id,
            DireccionEntrega.es_default == True,
            DireccionEntrega.eliminado_en.is_(None),
        )
        current = self._session.exec(statement).first()
        if current:
            current.es_default = False
            self._session.flush()
