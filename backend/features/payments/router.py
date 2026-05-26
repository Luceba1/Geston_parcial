import os
import logging
from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse

from features.auth.dependencies import get_current_user
from features.auth.models import Usuario
from features.payments.schemas import (
    PagoCreateRequest, PagoCrearResponse,
    PagoEstadoResponse, ConfirmarPagoRequest,
)
from features.payments.service import PaymentService
from features.payments.dependencies import get_payment_service
from core.exceptions import BadRequestException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/pagos", tags=["pagos"])


@router.post("/crear", response_model=PagoCrearResponse)
async def crear_pago(
    data: PagoCreateRequest,
    current_user: Usuario = Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    """
    Crea una preferencia de pago en MercadoPago para un pedido pendiente.
    Requiere autenticación. El pedido debe pertenecer al usuario autenticado.
    """
    return service.crear_pago(
        pedido_id=data.pedido_id,
        usuario_id=current_user.id,
    )


@router.post("/webhook")
async def webhook_pago(
    request: Request,
    service: PaymentService = Depends(get_payment_service),
):
    """
    Webhook IPN de MercadoPago.
    Endpoint público (sin autenticación).
    Recibe notificaciones de pago y actualiza el estado del pedido.
    """
    try:
        # MP envía el webhook como form data, JSON, o query params
        query_params = dict(request.query_params)

        if request.headers.get("content-type", "").startswith("application/json"):
            data = await request.json()
        else:
            form_data = await request.form()
            data = dict(form_data)

        result = service.procesar_webhook(data, query_params=query_params)
        return result
    except Exception as e:
        logger.exception("Error en webhook MP")
        # Siempre retornar 200 para MP (evita bloqueo de IP)
        return {"status": "error", "reason": str(e)}


@router.get("/{pedido_id}", response_model=PagoEstadoResponse)
async def consultar_pago(
    pedido_id: int,
    current_user: Usuario = Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    """
    Consulta el estado del pago más reciente de un pedido.
    El usuario solo puede consultar sus propios pedidos (excepto admins).
    """
    es_admin = current_user.es_superadmin or "admin" in [
        r.rol.nombre for r in (current_user.roles or []) if r.rol
    ]
    return service.consultar_pago(
        pedido_id=pedido_id,
        usuario_id=current_user.id,
        es_admin=es_admin,
    )


@router.post("/confirmar", response_model=PagoEstadoResponse)
async def confirmar_pago(
    data: ConfirmarPagoRequest,
    current_user: Usuario = Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    """
    Confirma/verifica un pago después del redirect desde MercadoPago.
    Consulta el estado REAL del pago en MP usando el payment_id
    que MP pasa como query param en las back_urls.
    Actualiza la BD si el pago fue aprobado.
    Esto evita depender del webhook en desarrollo local.
    """
    es_admin = current_user.es_superadmin or "admin" in [
        r.rol.nombre for r in (current_user.roles or []) if r.rol
    ]
    return service.confirmar_pago(
        pedido_id=data.pedido_id,
        usuario_id=current_user.id,
        es_admin=es_admin,
        payment_id=data.payment_id,
    )


@router.post("/{pedido_id}/reintentar", response_model=PagoCrearResponse)
async def reintentar_pago(
    pedido_id: int,
    current_user: Usuario = Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    """
    Reintenta el pago de un pedido cuyo último pago fue rechazado.
    Crea una nueva preferencia de pago en MercadoPago.
    """
    return service.reintentar_pago(
        pedido_id=pedido_id,
        usuario_id=current_user.id,
    )


@router.get("/redirect/{pedido_id}/{status}")
async def redirect_after_pago(
    pedido_id: int,
    status: str,
    request: Request,
):
    """
    Redirige al usuario al frontend después de pagar en MercadoPago.
    MP requiere HTTPS en back_urls con auto_return.
    Pasa los query params de MP (payment_id, etc.) al frontend para que
    PagoExitosoPage pueda confirmar el pago.
    """
    frontend_url = os.getenv("VITE_FRONTEND_URL", "http://localhost:5174")

    # Preservar los query params que MP adjunta en la redirect (payment_id, etc.)
    qs = request.url.query
    url = f"{frontend_url}/orders/{pedido_id}/{status}"
    if qs:
        url += f"?{qs}"

    return RedirectResponse(url=url)
