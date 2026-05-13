from typing import Generator
from sqlmodel import Session

from database import SessionLocal
from features.repositories.unit_of_work import UnitOfWork


def get_db_session() -> Generator[Session, None, None]:
    """FastAPI dependency que provee una sesión de BD.
    
    Sin @contextmanager porque FastAPI ya maneja generators
    con yield como context managers automáticamente.
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_uow() -> Generator[UnitOfWork, None, None]:
    """FastAPI dependency que provee un Unit of Work."""
    session = SessionLocal()
    try:
        uow = UnitOfWork(session)
        yield uow
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()