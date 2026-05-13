from datetime import datetime, timedelta
from typing import Optional

from core.security import create_access_token, verify_password, get_password_hash
from core.exceptions import (
    NotFoundException,
    UnauthorizedException,
    ForbiddenException,
    ConflictException,
    ValidationException,
)
from config import get_settings
from features.auth.models import Usuario
from features.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
)

settings = get_settings()

CLIENT_ROLE_NAME = "cliente"


class AuthService:
    def __init__(self, session):
        self._session = session
        # Import repos here to avoid circular imports at module level
        from features.auth.repository import UsuarioRepository, RolRepository, RefreshTokenRepository
        self.user_repo = UsuarioRepository(session)
        self.rol_repo = RolRepository(session)
        self.refresh_repo = RefreshTokenRepository(session)

    def register(self, request: RegisterRequest) -> TokenResponse:
        # Verificar si el email ya existe
        existing = self.user_repo.get_by_email(request.email)
        if existing:
            raise ConflictException("El email ya está registrado")

        # Hashear contraseña
        hashed = get_password_hash(request.password)

        # Crear usuario
        usuario = self.user_repo.create(
            nombre=request.nombre,
            email=request.email,
            hashed_password=hashed,
            telefono=request.telefono,
        )

        # Asignar rol CLIENT automáticamente
        rol_cliente = self.rol_repo.get_by_name(CLIENT_ROLE_NAME)
        if not rol_cliente:
            raise ValidationException("Rol CLIENT no encontrado en la base de datos. Ejecutá los seeds.")
        self.user_repo.assign_role(usuario.id, rol_cliente.id)

        # Generar tokens
        access_token = self._generate_access_token(usuario)
        refresh_token = self.refresh_repo.create(usuario.id, days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        # Obtener roles del usuario
        roles = self.user_repo.get_user_roles(usuario.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token.token,
            user=self._build_user_response(usuario, roles),
        )

    def login(self, request: LoginRequest) -> TokenResponse:
        # Buscar usuario por email
        usuario = self.user_repo.get_by_email(request.email)

        # Respuesta genérica: no diferenciar "email no existe" de "contraseña incorrecta"
        if not usuario or not verify_password(request.password, usuario.hashed_password):
            raise UnauthorizedException("Email o contraseña incorrectos")

        # Verificar si el usuario está activo
        if not usuario.activo:
            raise ForbiddenException("Cuenta desactivada")

        # Generar tokens
        access_token = self._generate_access_token(usuario)
        refresh_token = self.refresh_repo.create(usuario.id, days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        roles = self.user_repo.get_user_roles(usuario.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token.token,
            user=self._build_user_response(usuario, roles),
        )

    def refresh(self, refresh_token_str: str) -> TokenResponse:
        # Buscar token válido
        token_record = self.refresh_repo.find_valid(refresh_token_str)
        if not token_record:
            # Posible replay attack: verificar si ya fue usado
            from features.auth.models import RefreshToken
            from sqlmodel import select
            revoked_token = self._session.exec(
                select(RefreshToken).where(
                    RefreshToken.token == refresh_token_str,
                    RefreshToken.revoked == True,
                )
            ).first()
            if revoked_token:
                # Replay attack detected! Revocar todos los tokens del usuario
                self.refresh_repo.revoke_all_by_user(revoked_token.usuario_id)
            raise UnauthorizedException("Token de refresco inválido o expirado")

        usuario_id = token_record.usuario_id

        # Revocar el token actual (rotación)
        self.refresh_repo.revoke(token_record)

        # Obtener usuario
        from features.auth.repository import UsuarioRepository
        user_repo = UsuarioRepository(self._session)
        usuario = user_repo.get_by_id(usuario_id)
        if not usuario or not usuario.activo:
            raise UnauthorizedException("Usuario no encontrado o inactivo")

        # Generar nuevos tokens
        access_token = self._generate_access_token(usuario)
        new_refresh_token = self.refresh_repo.create(usuario_id, days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        roles = user_repo.get_user_roles(usuario.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token.token,
            user=self._build_user_response(usuario, roles),
        )

    def logout(self, refresh_token_str: str) -> None:
        token_record = self.refresh_repo.find_valid(refresh_token_str)
        if token_record:
            self.refresh_repo.revoke(token_record)

    def get_user_profile(self, usuario: Usuario) -> UserResponse:
        roles = self.user_repo.get_user_roles(usuario.id)
        return self._build_user_response(usuario, roles)

    def update_profile(self, usuario: Usuario, data: dict) -> UserResponse:
        from datetime import datetime
        allowed_fields = {"nombre", "telefono"}
        for key, value in data.items():
            if key in allowed_fields and value is not None:
                setattr(usuario, key, value)
        usuario.actualizado_en = datetime.utcnow()
        self._session.flush()
        self._session.refresh(usuario)
        return self.get_user_profile(usuario)

    def _generate_access_token(self, usuario: Usuario) -> str:
        roles = self.user_repo.get_user_roles(usuario.id)
        token_data = {
            "sub": str(usuario.id),
            "email": usuario.email,
            "roles": roles,
        }
        return create_access_token(
            data=token_data,
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

    def _build_user_response(self, usuario: Usuario, roles: list[str]) -> UserResponse:
        return UserResponse(
            id=usuario.id,
            nombre=usuario.nombre,
            email=usuario.email,
            telefono=usuario.telefono,
            roles=roles,
            activo=usuario.activo,
            creado_en=getattr(usuario, "creado_en", None),
            actualizado_en=getattr(usuario, "actualizado_en", None),
        )
