import os
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy.exc import SQLAlchemyError
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from core import (
    http_exception_handler,
    not_found_exception_handler,
    unauthorized_exception_handler,
    forbidden_exception_handler,
    validation_exception_handler,
    pydantic_validation_exception_handler,
    sqlalchemy_exception_handler,
    general_exception_handler,
    NotFoundException,
    UnauthorizedException,
    ForbiddenException,
)
from core.rate_limit import limiter
from config import get_settings


def create_app() -> FastAPI:
    # Cargar .env en os.environ para que os.getenv() funcione en todo el proyecto
    load_dotenv()
    settings = get_settings()
    app = FastAPI(
        title="FoodStore API",
        description="API para sistema de pedidos de comida",
        version="0.1.0",
    )
    
    # Rate Limiter (slowapi)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    
    # CORS
    cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Middleware para evitar el interstitial de ngrok-free en todas las responses
    @app.middleware("http")
    async def add_ngrok_skip_warning(request: Request, call_next):
        response = await call_next(request)
        response.headers["ngrok-skip-browser-warning"] = "true"
        return response

    # Exception handlers (RFC 7807 format)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(PydanticValidationError, pydantic_validation_exception_handler)
    app.add_exception_handler(NotFoundException, not_found_exception_handler)
    app.add_exception_handler(UnauthorizedException, unauthorized_exception_handler)
    app.add_exception_handler(ForbiddenException, forbidden_exception_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
    
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": "0.1.0"}
    
    # Incluir routers de features
    from features.auth.router import router as auth_router
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
    
    from features.addresses.router import router as direcciones_router
    app.include_router(direcciones_router, prefix="/api/v1/direcciones", tags=["direcciones"])
    
    from features.categories.router import router as categorias_router
    app.include_router(categorias_router, prefix="/api/v1/categorias", tags=["categorias"])
    
    from features.ingredients.router import router as ingredientes_router
    app.include_router(ingredientes_router, prefix="/api/v1/ingredientes", tags=["ingredientes"])
    
    from features.products.public_router import router as catalogo_publico_router
    app.include_router(catalogo_publico_router, prefix="/api/v1/productos", tags=["catálogo público"])
    
    from features.products.router import router as productos_admin_router
    app.include_router(productos_admin_router, prefix="/api/v1/productos", tags=["productos (admin)"])

    from features.orders.router import router as pedidos_router
    app.include_router(pedidos_router, prefix="/api/v1/pedidos", tags=["pedidos"])

    from features.admin.router import router as admin_router
    app.include_router(admin_router, tags=["admin"])

    from features.payments.router import router as pagos_router
    app.include_router(pagos_router, tags=["pagos"])

    from features.kitchen.router import router as cocina_router
    app.include_router(cocina_router, prefix="/api/v1/cocina", tags=["cocina"])

    from features.allergens.router import router as alergenos_router
    app.include_router(alergenos_router, prefix="/api/v1/alergenos", tags=["alérgenos"])

    
    # Registrar endpoint de prueba en la raíz para verificar conexión
    @app.get("/api/v1/test")
    async def test_connection():
        return {
            "status": "ok",
            "message": "Frontend conectado correctamente al backend",
            "data": {"roles_disponibles": 4}
        }
    
    return app

app = create_app()