from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

from features.allergens.schemas import AlergenoInfo


class IngredienteCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    unidad_medida: str = Field(max_length=20)
    alergenos: Optional[str] = Field(default=None, max_length=500)
    alergeno_ids: Optional[List[int]] = Field(default=None)


class IngredienteUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    unidad_medida: Optional[str] = Field(default=None, max_length=20)
    disponible: Optional[bool] = Field(default=None)
    alergenos: Optional[str] = Field(default=None, max_length=500)
    alergeno_ids: Optional[List[int]] = Field(default=None)


class IngredienteResponse(BaseModel):
    id: int
    nombre: str
    unidad_medida: str
    disponible: bool
    alergenos: Optional[str] = None
    alergenos_list: List[AlergenoInfo] = []
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True

    @classmethod
    def model_validate_with_alergenos(cls, ingrediente) -> "IngredienteResponse":
        """Build response including resolved allergens from relationship."""
        alergenos_list = []
        for rel in getattr(ingrediente, "alergenos_rel", []) or []:
            if rel.alergeno:
                alergenos_list.append(
                    AlergenoInfo(id=rel.alergeno.id, nombre=rel.alergeno.nombre, icono=rel.alergeno.icono)
                )
        return cls(
            id=ingrediente.id,
            nombre=ingrediente.nombre,
            unidad_medida=ingrediente.unidad_medida,
            disponible=ingrediente.disponible,
            alergenos=ingrediente.alergenos,
            alergenos_list=alergenos_list,
            creado_en=ingrediente.creado_en,
            actualizado_en=ingrediente.actualizado_en,
        )
