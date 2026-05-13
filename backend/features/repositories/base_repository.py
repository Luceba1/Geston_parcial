from datetime import datetime
from typing import TypeVar, Generic, Optional, List
from sqlmodel import SQLModel, Session, select
from features.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    def __init__(self, session: Session, model: type[ModelType]):
        self._session = session
        self._model = model

    def create(self, data: dict) -> ModelType:
        db_object = self._model(**data)
        self._session.add(db_object)
        self._session.flush()
        self._session.refresh(db_object)
        return db_object

    def get_by_id(self, id: int) -> Optional[ModelType]:
        return self._session.get(self._model, id)

    def get_all(
        self, skip: int = 0, limit: int = 100,
        filters: Optional[dict] = None,
        order_by: Optional[str] = None,
        descending: bool = False,
    ) -> List[ModelType]:
        statement = select(self._model)
        
        if filters:
            for key, value in filters.items():
                column = getattr(self._model, key, None)
                if column is not None:
                    statement = statement.where(column == value)
        
        if order_by:
            column = getattr(self._model, order_by, None)
            if column is not None:
                if descending:
                    statement = statement.order_by(column.desc())
                else:
                    statement = statement.order_by(column)
        
        statement = statement.offset(skip).limit(limit)
        return list(self._session.exec(statement).all())

    def count(self, filters: Optional[dict] = None) -> int:
        from sqlmodel import func
        statement = select(func.count()).select_from(self._model)
        
        if filters:
            for key, value in filters.items():
                column = getattr(self._model, key, None)
                if column is not None:
                    statement = statement.where(column == value)
        
        result = self._session.exec(statement).one()
        return result

    def update(self, id: int, data: dict) -> Optional[ModelType]:
        db_object = self.get_by_id(id)
        if db_object is None:
            return None
        for key, value in data.items():
            setattr(db_object, key, value)
        db_object.actualizado_en = datetime.utcnow()
        self._session.flush()
        self._session.refresh(db_object)
        return db_object

    def soft_delete(self, id: int) -> bool:
        db_object = self.get_by_id(id)
        if db_object is None:
            return False
        db_object.eliminado_en = datetime.utcnow()
        self._session.flush()
        return True