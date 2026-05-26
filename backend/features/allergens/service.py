from typing import Optional, List
from sqlmodel import Session, select

from features.allergens.models import Alergeno
from features.allergens.schemas import AlergenoCreate, AlergenoUpdate
from core.exceptions import NotFoundException, ConflictException


class AllergenService:
    def __init__(self, session: Session):
        self._session = session

    def list(self, solo_activos: bool = True) -> List[Alergeno]:
        query = select(Alergeno)
        if solo_activos:
            query = query.where(Alergeno.activo == True)
        query = query.order_by(Alergeno.nombre)
        return list(self._session.exec(query).all())

    def get_by_id(self, alergeno_id: int) -> Alergeno:
        alergeno = self._session.get(Alergeno, alergeno_id)
        if not alergeno:
            raise NotFoundException("Alérgeno", alergeno_id)
        return alergeno

    def create(self, data: AlergenoCreate) -> Alergeno:
        existing = self._session.exec(
            select(Alergeno).where(Alergeno.nombre == data.nombre)
        ).first()
        if existing:
            raise ConflictException(f"Ya existe un alérgeno con nombre '{data.nombre}'")

        alergeno = Alergeno(**data.model_dump())
        self._session.add(alergeno)
        self._session.flush()
        self._session.refresh(alergeno)
        return alergeno

    def update(self, alergeno_id: int, data: AlergenoUpdate) -> Alergeno:
        alergeno = self.get_by_id(alergeno_id)

        update_data = data.model_dump(exclude_unset=True)
        if "nombre" in update_data:
            existing = self._session.exec(
                select(Alergeno).where(
                    Alergeno.nombre == update_data["nombre"],
                    Alergeno.id != alergeno_id,
                )
            ).first()
            if existing:
                raise ConflictException(f"Ya existe un alérgeno con nombre '{update_data['nombre']}'")

        for key, value in update_data.items():
            setattr(alergeno, key, value)

        self._session.add(alergeno)
        self._session.flush()
        self._session.refresh(alergeno)
        return alergeno

    def soft_delete(self, alergeno_id: int) -> None:
        alergeno = self.get_by_id(alergeno_id)
        alergeno.activo = False
        self._session.add(alergeno)
        self._session.flush()
