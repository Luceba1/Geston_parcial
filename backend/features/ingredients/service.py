from typing import Optional, List
from sqlmodel import Session, select

from features.ingredients.models import Ingrediente, IngredienteAlergeno
from features.ingredients.schemas import IngredienteCreate, IngredienteUpdate
from features.repositories.ingrediente_repository import IngredienteRepository
from core.exceptions import NotFoundException, ConflictException


class IngredienteService:
    def __init__(self, session: Session):
        self._session = session
        self.repo = IngredienteRepository(session)

    def create(self, data: IngredienteCreate) -> Ingrediente:
        ingrediente = self.repo.create({
            "nombre": data.nombre,
            "unidad_medida": data.unidad_medida,
            "alergenos": data.alergenos,
        })

        # Sync alergeno_ids to junction table
        if data.alergeno_ids:
            for aid in data.alergeno_ids:
                self._session.add(
                    IngredienteAlergeno(ingrediente_id=ingrediente.id, alergeno_id=aid)
                )
            self._session.flush()
            self._session.refresh(ingrediente)

        return ingrediente

    def list(self, skip: int = 0, limit: int = 100, solo_disponibles: bool = True) -> tuple[List[Ingrediente], int]:
        filters = {"disponible": True} if solo_disponibles else {}
        items = self.repo.get_all(skip=skip, limit=limit, filters=filters)
        total = self.repo.count(filters=filters)
        return items, total

    def get_by_id(self, ingrediente_id: int) -> Ingrediente:
        ingrediente = self.repo.get_by_id(ingrediente_id)
        if not ingrediente:
            raise NotFoundException("Ingrediente", ingrediente_id)
        return ingrediente

    def update(self, ingrediente_id: int, data: IngredienteUpdate) -> Ingrediente:
        ingrediente = self.repo.get_by_id(ingrediente_id)
        if not ingrediente:
            raise NotFoundException("Ingrediente", ingrediente_id)

        update_data = data.model_dump(exclude_unset=True)
        alergeno_ids = update_data.pop("alergeno_ids", None)

        if update_data:
            updated = self.repo.update(ingrediente_id, update_data)
        else:
            updated = ingrediente  # type: ignore

        # Sync alergeno_ids
        if alergeno_ids is not None:
            # Remove existing relations
            existing_rels = self._session.exec(
                select(IngredienteAlergeno).where(
                    IngredienteAlergeno.ingrediente_id == ingrediente_id
                )
            ).all()
            for rel in existing_rels:
                self._session.delete(rel)

            # Add new relations
            for aid in alergeno_ids:
                self._session.add(
                    IngredienteAlergeno(ingrediente_id=ingrediente_id, alergeno_id=aid)
                )
            self._session.flush()
            self._session.refresh(updated)

        return updated  # type: ignore

    def soft_delete(self, ingrediente_id: int) -> None:
        ingrediente = self.repo.get_by_id(ingrediente_id)
        if not ingrediente:
            raise NotFoundException("Ingrediente", ingrediente_id)

        # Verificar que no esté asociado a productos activos
        products_count = self.repo.get_products_count(ingrediente_id)
        if products_count > 0:
            raise ConflictException(
                f"No se puede eliminar: el ingrediente está asociado a {products_count} producto(s) activo(s)"
            )

        self.repo.soft_delete(ingrediente_id)
