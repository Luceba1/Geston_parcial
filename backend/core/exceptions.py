"""Custom exceptions for FoodStore API.

Provides domain-specific exceptions following FastAPI conventions.
All exceptions return RFC 7807 compliant error responses.
"""

from typing import Any, Optional

from fastapi import HTTPException
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """RFC 7807 Problem Details schema."""
    type: str = "https://httpstatuses.com/500"
    title: str = "Error"
    status: int = 500
    detail: Optional[str] = None
    instance: Optional[str] = None
    extra: Optional[dict] = None


class NotFoundException(HTTPException):
    """Exception raised when a requested resource is not found.
    
    Args:
        resource: Type of resource (e.g., "Product", "User")
        identifier: The identifier that was searched for
    """
    def __init__(self, resource: str, identifier: Any) -> None:
        super().__init__(
            status_code=404,
            detail={
                "type": "https://httpstatuses.com/404",
                "title": "Resource not found",
                "status": 404,
                "detail": f"{resource} with id {identifier} not found"
            }
        )


class UnauthorizedException(HTTPException):
    """Exception raised when user is not authenticated.
    
    Args:
        detail: Custom error message
    """
    def __init__(self, detail: str = "Not authenticated") -> None:
        super().__init__(status_code=401, detail=detail)


class ForbiddenException(HTTPException):
    """Exception raised when user lacks required permissions.
    
    Args:
        detail: Custom error message
    """
    def __init__(self, detail: str = "Insufficient permissions") -> None:
        super().__init__(status_code=403, detail=detail)


class ValidationException(HTTPException):
    """Exception raised for validation errors.
    
    Args:
        detail: Validation error message
    """
    def __init__(self, detail: str) -> None:
        super().__init__(status_code=422, detail=detail)


class BadRequestException(HTTPException):
    """Exception raised for bad requests.

    Args:
        detail: Error message
    """
    def __init__(self, detail: str) -> None:
        super().__init__(status_code=400, detail={
            "type": "https://httpstatuses.com/400",
            "title": "Bad Request",
            "status": 400,
            "detail": detail
        })


class ConflictException(HTTPException):
    """Exception raised for resource conflicts.
    
    Args:
        detail: Conflict error message
    """
    def __init__(self, detail: str) -> None:
        super().__init__(status_code=409, detail=detail)