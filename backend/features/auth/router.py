from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from slowapi.errors import RateLimitExceeded

from dependencies import get_db_session
from core.rate_limit import limiter
from features.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserResponse,
)
from features.auth.service import AuthService
from features.auth.dependencies import get_current_user
from features.auth.models import Usuario
from sqlmodel import Session

router = APIRouter()


def get_auth_service(db: Session = Depends(get_db_session)) -> AuthService:
    return AuthService(db)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registro de nuevo usuario",
)
async def register(
    request: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Registra un nuevo usuario con rol CLIENT automáticamente.
    
    - El email debe ser único
    - La contraseña debe tener al menos 8 caracteres
    - Se asigna rol CLIENT automáticamente
    - Retorna access token + refresh token
    """
    return auth_service.register(request)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Inicio de sesión",
)
@limiter.limit("5/15minutes")
async def login(
    request: Request,
    login_data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Inicia sesión con email y contraseña.
    
    - Rate limit: 5 intentos cada 15 minutos por IP
    - Retorna access token (30 min) + refresh token (7 días)
    - No diferencia "email no existe" de "contraseña incorrecta"
    """
    return auth_service.login(login_data)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Renovar tokens",
)
async def refresh(
    request: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Renueva el access token usando un refresh token válido.
    
    - Aplica rotación: el refresh token anterior se revoca
    - Si se detecta reuso (replay attack), se revocan TODOS los tokens del usuario
    """
    return auth_service.refresh(request.refresh_token)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cerrar sesión",
)
async def logout(
    request: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Cierra la sesión revocando el refresh token.
    
    El access token sigue siendo válido hasta su expiración natural (stateless).
    """
    auth_service.logout(request.refresh_token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Perfil del usuario actual",
)
async def me(
    current_user: Usuario = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Obtiene los datos del usuario autenticado."""
    return auth_service.get_user_profile(current_user)


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Actualizar perfil del usuario actual",
)
async def update_me(
    data: dict,
    current_user: Usuario = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Actualiza nombre y/o teléfono del perfil."""
    return auth_service.update_profile(current_user, data)
