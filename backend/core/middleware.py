"""Exception handlers for FoodStore API.

Provides handlers for different exception types, returning RFC 7807
compliant error responses.
"""

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy.exc import SQLAlchemyError

from core.exceptions import (
    ErrorDetail,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
    ValidationException,
    ConflictException,
)


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handler for HTTPException.
    
    Converts HTTPException to RFC 7807 format.
    
    Args:
        request: The incoming request
        exc: The HTTPException raised
        
    Returns:
        JSONResponse with RFC 7807 problem details
    """
    if isinstance(exc.detail, dict):
        detail_data = exc.detail
    else:
        detail_data = {
            "type": f"https://httpstatuses.com/{exc.status_code}",
            "title": "Error",
            "status": exc.status_code,
            "detail": str(exc.detail),
        }
    
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorDetail(
            type=detail_data.get("type", f"https://httpstatuses.com/{exc.status_code}"),
            title=detail_data.get("title", "Error"),
            status=exc.status_code,
            detail=detail_data.get("detail"),
            instance=str(request.url),
        ).model_dump(exclude_none=True)
    )


async def not_found_exception_handler(request: Request, exc: NotFoundException) -> JSONResponse:
    """Handler for NotFoundException.
    
    Args:
        request: The incoming request
        exc: The NotFoundException raised
        
    Returns:
        JSONResponse with RFC 7807 problem details
    """
    detail = exc.detail if isinstance(exc.detail, dict) else {"detail": str(exc.detail)}
    
    return JSONResponse(
        status_code=404,
        content={
            "type": "https://httpstatuses.com/404",
            "title": "Resource not found",
            "status": 404,
            "detail": detail.get("detail", "The requested resource was not found"),
            "instance": str(request.url),
        }
    )


async def unauthorized_exception_handler(request: Request, exc: UnauthorizedException) -> JSONResponse:
    """Handler for UnauthorizedException.
    
    Args:
        request: The incoming request
        exc: The UnauthorizedException raised
        
    Returns:
        JSONResponse with RFC 7807 problem details
    """
    return JSONResponse(
        status_code=401,
        content={
            "type": "https://httpstatuses.com/401",
            "title": "Unauthorized",
            "status": 401,
            "detail": exc.detail if isinstance(exc.detail, str) else "Not authenticated",
            "instance": str(request.url),
        }
    )


async def forbidden_exception_handler(request: Request, exc: ForbiddenException) -> JSONResponse:
    """Handler for ForbiddenException.
    
    Args:
        request: The incoming request
        exc: The ForbiddenException raised
        
    Returns:
        JSONResponse with RFC 7807 problem details
    """
    return JSONResponse(
        status_code=403,
        content={
            "type": "https://httpstatuses.com/403",
            "title": "Forbidden",
            "status": 403,
            "detail": exc.detail if isinstance(exc.detail, str) else "Insufficient permissions",
            "instance": str(request.url),
        }
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handler for RequestValidationError (FastAPI validation).
    
    Args:
        request: The incoming request
        exc: The RequestValidationError raised
        
    Returns:
        JSONResponse with RFC 7807 problem details
    """
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "type": "https://httpstatuses.com/422",
            "title": "Validation Error",
            "status": 422,
            "detail": "The request contains invalid data",
            "errors": exc.errors(),
            "instance": str(request.url),
        }
    )


async def pydantic_validation_exception_handler(
    request: Request, exc: PydanticValidationError
) -> JSONResponse:
    """Handler for Pydantic ValidationError.
    
    Args:
        request: The incoming request
        exc: The PydanticValidationError raised
        
    Returns:
        JSONResponse with RFC 7807 problem details
    """
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "type": "https://httpstatuses.com/422",
            "title": "Validation Error",
            "status": 422,
            "detail": "Data validation failed",
            "errors": exc.errors(),
            "instance": str(request.url),
        }
    )


async def sqlalchemy_exception_handler(
    request: Request, exc: SQLAlchemyError
) -> JSONResponse:
    """Handler for SQLAlchemy database errors.
    
    Args:
        request: The incoming request
        exc: The SQLAlchemyError raised
        
    Returns:
        JSONResponse with RFC 7807 problem details
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.exception("SQLAlchemy error processing %s %s", request.method, request.url)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "type": "https://httpstatuses.com/500",
            "title": "Database Error",
            "status": 500,
            "detail": "A database error occurred",
            "instance": str(request.url),
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Generic handler for unexpected exceptions.
    
    Note: Only use in development. In production, log the error
    and return a generic message without exposing details.
    
    Args:
        request: The incoming request
        exc: The unexpected exception raised
        
    Returns:
        JSONResponse with RFC 7807 problem details
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.exception("Unhandled exception processing %s %s", request.method, request.url)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "type": "https://httpstatuses.com/500",
            "title": "Internal Server Error",
            "status": 500,
            "detail": str(exc) if hasattr(exc, "__str__") else "An unexpected error occurred",
            "instance": str(request.url),
        }
    )