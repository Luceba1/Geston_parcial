from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4
from sqlmodel import Session, select
from features.auth.models import Usuario, Rol, UsuarioRol, RefreshToken


class UsuarioRepository:
    def __init__(self, session: Session):
        self._session = session

    def get_by_email(self, email: str) -> Optional[Usuario]:
        statement = select(Usuario).where(Usuario.email == email)
        return self._session.exec(statement).first()

    def get_by_id(self, user_id: int) -> Optional[Usuario]:
        return self._session.get(Usuario, user_id)

    def create(self, nombre: str, email: str, hashed_password: str, telefono: Optional[str] = None) -> Usuario:
        usuario = Usuario(
            nombre=nombre,
            email=email,
            hashed_password=hashed_password,
            telefono=telefono,
            activo=True,
        )
        self._session.add(usuario)
        self._session.flush()
        self._session.refresh(usuario)
        return usuario

    def assign_role(self, usuario_id: int, rol_id: int) -> UsuarioRol:
        ur = UsuarioRol(usuario_id=usuario_id, rol_id=rol_id)
        self._session.add(ur)
        self._session.flush()
        return ur

    def get_user_roles(self, usuario_id: int) -> list[str]:
        from sqlmodel import text
        query = text("""
            SELECT r.nombre
            FROM roles r
            JOIN usuario_roles ur ON r.id = ur.rol_id
            WHERE ur.usuario_id = :uid
        """)
        result = self._session.execute(query, {"uid": usuario_id})
        return [row[0] for row in result]


class RolRepository:
    def __init__(self, session: Session):
        self._session = session

    def get_by_name(self, nombre: str) -> Optional[Rol]:
        statement = select(Rol).where(Rol.nombre == nombre)
        return self._session.exec(statement).first()


class RefreshTokenRepository:
    def __init__(self, session: Session):
        self._session = session

    def create(self, usuario_id: int, days: int = 7) -> RefreshToken:
        token_str = str(uuid4())
        token = RefreshToken(
            usuario_id=usuario_id,
            token=token_str,
            expires_at=datetime.utcnow() + timedelta(days=days),
            revoked=False,
        )
        self._session.add(token)
        self._session.flush()
        self._session.refresh(token)
        return token

    def find_valid(self, token_str: str) -> Optional[RefreshToken]:
        statement = select(RefreshToken).where(
            RefreshToken.token == token_str,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > datetime.utcnow(),
        )
        return self._session.exec(statement).first()

    def revoke(self, token: RefreshToken) -> None:
        token.revoked = True
        self._session.flush()

    def revoke_all_by_user(self, usuario_id: int) -> None:
        statement = select(RefreshToken).where(
            RefreshToken.usuario_id == usuario_id,
            RefreshToken.revoked == False,
        )
        tokens = self._session.exec(statement).all()
        for t in tokens:
            t.revoked = True
        self._session.flush()
