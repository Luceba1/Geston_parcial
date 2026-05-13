from datetime import datetime
from sqlmodel import Field
from typing import Optional

class TimestampMixin:
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    eliminado_en: Optional[datetime] = Field(default=None)

class BaseModel(TimestampMixin):
    id: Optional[int] = Field(default=None, primary_key=True)