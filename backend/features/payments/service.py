import os
import uuid
import logging
from datetime import datetime
from typing import Optional

from sqlmodel import Session, select
from features.payments.models import FormaPago, Pago
from features.payments.schemas import (
    PagoResponse, PagoCrearResponse, PagoEstadoResponse,
)
from features.orders.models import Pedido, EstadoPedido, HistorialEstadoPedido
from features.repositories.unit_of_work import UnitOfWork
from core.exceptions import (
    BadRequestException, NotFoundException, ForbiddenException,
)

logger = logging.getLogger(__name__)

# ─── SDK wrapper ──────────────────────────────────────────────


def _get_mp_access_token() -> Optional[str]:
    """Retorna el access token de MP desde environment, o None si no está configurado."""
    return os.getenv("MP_ACCESS_TOKEN")


def _get_mp_public_key() -> Optional[str]:
    """Retorna la public key de MP desde environment, o None si no está configurado."""
    return os.getenv("MP_PUBLIC_KEY")


def _crear_preferencia_mp(monto: float, titulo: str, idempotency_key: str,
                          pedido_id: int, back_urls: dict) -> dict:
    """
    Crea una preferencia de pago en MercadoPago.
    Requiere MP_ACCESS_TOKEN configurado. Si no, lanza RuntimeError.
    """
    access_token = _get_mp_access_token()
    if not access_token:
        raise RuntimeError("MercadoPago no está configurado. Configurá MP_ACCESS_TOKEN en el .env")

    try:
        import mercadopago
        sdk = mercadopago.SDK(access_token)

        preference_data = {
            "items": [
                {
                    "title": titulo,
                    "quantity": 1,
                    "unit_price": float(monto),
                    "currency_id": "ARS",
                }
            ],
            "external_reference": str(pedido_id),
            "back_urls": back_urls,
            "notification_url": os.getenv(
                "MP_WEBHOOK_URL",
                f"{os.getenv('VITE_API_URL', 'http://localhost:8000')}/api/v1/pagos/webhook"
            ),
            "auto_return": "approved",
        }

        result = sdk.preference().create(preference_data)

        if result.get("status") not in (200, 201):
            logger.error("Error creando preferencia MP: %s", result)
            raise RuntimeError(f"Error al crear preferencia en MercadoPago: {result.get('response', {}).get('message', 'Error desconocido')}")

        response = result.get("response", {})
        return {
            "preference_id": response.get("id"),
            "init_point": response.get("init_point"),
            "sandbox_init_point": response.get("sandbox_init_point"),
        }
    except ImportError:
        raise RuntimeError("El paquete 'mercadopago' no está instalado. Ejecutá: pip install mercadopago")
    except Exception as e:
        logger.exception("Error inesperado al crear preferencia MP")
        raise RuntimeError(f"Error de conexión con MercadoPago: {str(e)}")


def _buscar_pagos_por_external_ref(external_ref: str) -> list[dict]:
    """
    Busca pagos en MercadoPago por external_reference (pedido_id).
    Útil cuando se pierde el payment_id en el redirect por ngrok-free.
    Retorna una lista de pagos encontrados, ordenados por fecha descendente.
    """
    access_token = _get_mp_access_token()
    if not access_token:
        raise RuntimeError("MercadoPago no está configurado")

    try:
        import mercadopago
        sdk = mercadopago.SDK(access_token)
        result = sdk.payment().search({
            "external_reference": external_ref,
            "sort": "date_created",
            "criteria": "desc",
        })

        if result.get("status") != 200:
            logger.error("Error buscando pagos por external_ref %s: %s", external_ref, result)
            raise RuntimeError(f"Error al buscar pagos en MercadoPago: {external_ref}")

        results = result.get("response", {}).get("results", [])
        return [
            {
                "mp_payment_id": p.get("id"),
                "mp_status": p.get("status"),
                "mp_status_detail": p.get("status_detail"),
                "mp_merchant_order_id": p.get("merchant_order_id"),
                "date_created": p.get("date_created"),
            }
            for p in results
        ]
    except ImportError:
        raise RuntimeError("Paquete 'mercadopago' no instalado")
    except Exception as e:
        logger.exception("Error buscando pagos por external_ref %s", external_ref)
        raise RuntimeError(f"Error de conexión con MercadoPago: {str(e)}")


def _consultar_pago_mp(payment_id: int) -> dict:
    """Consulta el estado de un pago en MercadoPago por su payment_id."""
    access_token = _get_mp_access_token()
    if not access_token:
        raise RuntimeError("MercadoPago no está configurado")

    try:
        import mercadopago
        sdk = mercadopago.SDK(access_token)
        result = sdk.payment().get(payment_id)

        if result.get("status") != 200:
            logger.error("Error consultando pago MP %s: %s", payment_id, result)
            raise RuntimeError(f"Error al consultar pago {payment_id} en MercadoPago")

        response = result.get("response", {})
        return {
            "mp_payment_id": response.get("id"),
            "mp_status": response.get("status"),
            "mp_status_detail": response.get("status_detail"),
            "mp_merchant_order_id": response.get("merchant_order_id"),
        }
    except ImportError:
        raise RuntimeError("Paquete 'mercadopago' no instalado")
    except Exception as e:
        logger.exception("Error consultando pago MP %s", payment_id)
        raise RuntimeError(f"Error de conexión con MercadoPago: {str(e)}")


# ─── Service ──────────────────────────────────────────────────


class PaymentService:
    def __init__(self, uow: UnitOfWork, session: Session):
        self._uow = uow
        self._session = session

    # ── Crear pago ────────────────────────────────────────────

    def crear_pago(self, pedido_id: int, usuario_id: int) -> PagoCrearResponse:
        """Crea una preferencia de pago en MercadoPago para un pedido."""

        # Verificar que MP está configurado
        if not _get_mp_access_token():
            raise BadRequestException(
                "MercadoPago no está configurado. El administrador debe configurar MP_ACCESS_TOKEN."
            )

        # Validar pedido
        pedido = self._session.get(Pedido, pedido_id)
        if not pedido:
            raise NotFoundException("Pedido", pedido_id)

        if pedido.usuario_id != usuario_id:
            raise ForbiddenException("El pedido no pertenece al usuario autenticado")

        # Verificar estado del pedido
        estado_actual = self._session.get(EstadoPedido, pedido.estado_id)
        if not estado_actual or estado_actual.nombre != "pendiente":
            raise BadRequestException(
                "El pedido no está pendiente de pago. Estado actual: "
                f"{estado_actual.nombre if estado_actual else 'desconocido'}"
            )

        # Verificar que no haya un pago aprobado previo
        pagos_existentes = self._uow.pagos.get_by_pedido(pedido_id)
        for p in pagos_existentes:
            if p.estado == "aprobado":
                raise BadRequestException("El pedido ya tiene un pago aprobado")

        # Obtener forma de pago MP (o crearla si no existe)
        forma_pago = self._get_or_create_forma_pago_mp()

        # Generar idempotency_key única
        idempotency_key = str(uuid.uuid4())

        # Crear preferencia en MP
        titulo = f"Pedido #{pedido_id} - FoodStore"
        ngrok_url = os.getenv('NGROK_URL', 'http://localhost:8000')
        back_urls = {
            "success": f"{ngrok_url}/api/v1/pagos/redirect/{pedido_id}/success",
            "failure": f"{ngrok_url}/api/v1/pagos/redirect/{pedido_id}/failure",
            "pending": f"{ngrok_url}/api/v1/pagos/redirect/{pedido_id}/pending",
        }

        try:
            mp_data = _crear_preferencia_mp(
                monto=pedido.total,
                titulo=titulo,
                idempotency_key=idempotency_key,
                pedido_id=pedido_id,
                back_urls=back_urls,
            )
        except RuntimeError as e:
            raise BadRequestException(str(e))

        # Almacenar Pago en BD
        pago = Pago(
            pedido_id=pedido_id,
            forma_pago_id=forma_pago.id,
            monto=pedido.total,
            estado="pendiente",
            mp_preference_id=mp_data["preference_id"],
            mp_init_point=mp_data.get("init_point") or mp_data.get("sandbox_init_point"),
            idempotency_key=idempotency_key,
        )
        self._session.add(pago)
        self._session.flush()
        self._session.refresh(pago)

        return PagoCrearResponse(
            pago=PagoResponse.model_validate(pago),
            preference_id=mp_data["preference_id"],
            init_point=mp_data.get("init_point") or mp_data.get("sandbox_init_point"),
            public_key=_get_mp_public_key(),
        )

    # ── Webhook ───────────────────────────────────────────────

    def procesar_webhook(self, data: dict, query_params: Optional[dict] = None) -> dict:
        """
        Procesa un webhook IPN de MercadoPago.
        Según la documentación de MP, el webhook puede venir en distintos formatos:
        - JSON body: {"type": "payment", "data": {"id": 123}}
        - Form data: type=payment&data.id=123
        - Query params: ?id=123&topic=payment (common for merchant_order)
        
        Args:
            data: Datos del body (JSON o form)
            query_params: Query params de la URL (para webhooks que llegan solo con query string)
        """
        logger.info("Webhook recibido: data=%s, query_params=%s", data, query_params or {})

        # Si MP mandó data solo en query params, usarlos como fallback
        if not data and query_params:
            data = query_params

        # Extraer type y action del webhook
        topic = data.get("type") or data.get("topic")
        action = data.get("action")
        data_id = data.get("data_id") or data.get("data", {}).get("id")
        payment_id = data.get("id")  # Algunos formatos lo mandan directo
        
        # Fallback a query params si el body no trajo nada
        if not data_id and query_params:
            data_id = query_params.get("data.id") or query_params.get("id")
        if not topic and query_params:
            topic = query_params.get("topic") or query_params.get("type")

        # Si no hay payment_id, intentar con data_id
        pago_mp_id = payment_id or data_id

        if not pago_mp_id:
            logger.warning("Webhook sin ID de pago: %s", data)
            # MP espera 200 aunque no procesemos (evita reintentos)
            return {"status": "ignored", "reason": "No payment ID in webhook"}

        # Solo procesamos notificaciones de payment
        if topic not in (None, "payment", "merchant_order"):
            logger.info("Webhook ignorado - topic no relevante: %s", topic)
            return {"status": "ignored", "reason": f"Topic not relevant: {topic}"}

        # Si es merchant_order, necesitamos extraer el payment_id
        if topic == "merchant_order" and action:
            # Para merchant_order, el action contiene el estado
            pass

        try:
            # Consultar estado actual del pago en MP
            mp_info = _consultar_pago_mp(int(pago_mp_id))

            estado_mp = mp_info.get("mp_status")
            estado_detail = mp_info.get("mp_status_detail")

            # Mapear estado de MP a estado interno
            if estado_mp == "approved":
                nuevo_estado = "aprobado"
            elif estado_mp in ("rejected", "cancelled", "refunded", "charged_back"):
                nuevo_estado = "rechazado"
            elif estado_mp in ("pending", "in_process", "authorized"):
                nuevo_estado = "pendiente"
            else:
                logger.warning("Estado MP no mapeado: %s", estado_mp)
                return {"status": "ignored", "reason": f"Unknown MP status: {estado_mp}"}

            # Buscar el Pago en nuestra BD por mp_payment_id o por pedido
            pago = self._session.exec(
                select(Pago).where(Pago.mp_payment_id == int(pago_mp_id))
            ).first()

            if not pago:
                # Intentar buscar por merchant_order_id
                if mp_info.get("mp_merchant_order_id"):
                    pago = self._session.exec(
                        select(Pago).where(
                            Pago.mp_merchant_order_id == mp_info["mp_merchant_order_id"]
                        )
                    ).first()

            if not pago:
                # No encontramos el pago en BD - puede ser un webhook tardío o de otro sistema
                logger.warning("Pago %s no encontrado en BD", pago_mp_id)
                return {"status": "ignored", "reason": "Pago not found in local DB"}

            # Si ya está procesado, ignorar (idempotencia)
            if pago.estado != "pendiente":
                logger.info("Pago %s ya procesado (estado: %s)", pago.id, pago.estado)
                return {"status": "already_processed", "estado": pago.estado}

            # Actualizar datos del pago
            pago.mp_payment_id = int(pago_mp_id)
            pago.mp_status = estado_mp
            pago.mp_status_detail = estado_detail
            pago.mp_merchant_order_id = mp_info.get("mp_merchant_order_id")
            pago.estado = nuevo_estado
            pago.updated_at = datetime.utcnow()

            # Si el pago fue aprobado, transicionar el pedido a confirmado
            if nuevo_estado == "aprobado":
                self._confirmar_pedido(pago.pedido_id)

            self._session.flush()

            return {
                "status": "processed",
                "pago_id": pago.id,
                "estado": nuevo_estado,
                "pedido_id": pago.pedido_id,
            }

        except Exception as e:
            logger.exception("Error procesando webhook MP")
            try:
                self._session.rollback()
            except:
                pass
            # Siempre retornar 200 para MP (evita bloqueo de IP)
            return {"status": "error", "reason": str(e)}

    # ── Consultar estado ──────────────────────────────────────

    def consultar_pago(self, pedido_id: int, usuario_id: int, es_admin: bool = False) -> PagoEstadoResponse:
        """Consulta el estado del pago más reciente de un pedido."""
        pedido = self._session.get(Pedido, pedido_id)
        if not pedido:
            raise NotFoundException("Pedido", pedido_id)

        if not es_admin and pedido.usuario_id != usuario_id:
            raise ForbiddenException("El pedido no pertenece al usuario autenticado")

        pago = self._uow.pagos.get_ultimo_by_pedido(pedido_id)

        if not pago:
            return PagoEstadoResponse(
                estado=None,
                disponible=True,
                pago=None,
            )

        return PagoEstadoResponse(
            estado=pago.estado,
            disponible=pago.estado != "aprobado",
            pago=PagoResponse.model_validate(pago),
        )

    # ── Confirmar post-redirect ───────────────────────────────

    def confirmar_pago(self, pedido_id: int, usuario_id: int,
                       es_admin: bool = False, payment_id: Optional[int] = None) -> PagoEstadoResponse:
        """
        Confirma/verifica un pago después del redirect desde MP.
        Consulta el estado REAL en MP y actualiza la BD.

        Si payment_id no se provee (se perdió en el redirect por ngrok-free),
        busca el pago en MP por external_reference (pedido_id).
        Esto hace el flujo robusto aunque el frontend no reciba query params.
        """
        # Validar pedido
        pedido = self._session.get(Pedido, pedido_id)
        if not pedido:
            raise NotFoundException("Pedido", pedido_id)

        if not es_admin and pedido.usuario_id != usuario_id:
            raise ForbiddenException("El pedido no pertenece al usuario autenticado")

        # ── Resolver payment_id ─────────────────────────────
        # Si no vino, buscar el último pago de MP por external_reference
        resolved_payment_id = payment_id

        if not resolved_payment_id:
            logger.info(
                "confirmar_pago sin payment_id para pedido %s — "
                "buscando en MP por external_reference", pedido_id
            )
            try:
                mp_pagos = _buscar_pagos_por_external_ref(str(pedido_id))
            except RuntimeError as e:
                raise BadRequestException(
                    f"No se pudo buscar el pago en MercadoPago: {str(e)}. "
                    "Si estás en desarrollo, asegurate de tener MP_ACCESS_TOKEN configurado."
                )

            if not mp_pagos:
                # Sin payment_id y sin resultados de MP — no podemos confirmar
                logger.warning(
                    "No se encontraron pagos en MP para pedido %s", pedido_id
                )
                # Devolver el estado actual de BD si existe
                pago_local = self._uow.pagos.get_ultimo_by_pedido(pedido_id)
                return PagoEstadoResponse(
                    estado=pago_local.estado if pago_local else None,
                    disponible=True,
                    pago=PagoResponse.model_validate(pago_local) if pago_local else None,
                )

            # Tomar el pago más reciente
            resolved_payment_id = mp_pagos[0]["mp_payment_id"]
            logger.info(
                "Payment_id resuelto por external_reference: %s", resolved_payment_id
            )

        # ── Consultar estado real en MP ─────────────────────
        try:
            mp_info = _consultar_pago_mp(resolved_payment_id)
        except RuntimeError as e:
            raise BadRequestException(f"Error al consultar pago en MercadoPago: {str(e)}")

        estado_mp = mp_info.get("mp_status")
        estado_detail = mp_info.get("mp_status_detail")

        # Mapear estado de MP a estado interno
        if estado_mp == "approved":
            nuevo_estado = "aprobado"
        elif estado_mp in ("rejected", "cancelled", "refunded", "charged_back"):
            nuevo_estado = "rechazado"
        elif estado_mp in ("pending", "in_process", "authorized"):
            nuevo_estado = "pendiente"
        else:
            logger.warning("Estado MP no mapeado en confirmación: %s", estado_mp)
            nuevo_estado = "pendiente"

        # ── Buscar o crear el Pago en BD ────────────────────
        pago = self._session.exec(
            select(Pago).where(Pago.mp_payment_id == resolved_payment_id)
        ).first()

        if not pago:
            if mp_info.get("mp_merchant_order_id"):
                pago = self._session.exec(
                    select(Pago).where(
                        Pago.mp_merchant_order_id == mp_info["mp_merchant_order_id"]
                    )
                ).first()

        if not pago:
            pago = self._uow.pagos.get_ultimo_by_pedido(pedido_id)

        if pago:
            # Actualizar datos del pago
            pago.mp_payment_id = resolved_payment_id
            pago.mp_status = estado_mp
            pago.mp_status_detail = estado_detail
            pago.mp_merchant_order_id = mp_info.get("mp_merchant_order_id")
            pago.estado = nuevo_estado
            pago.updated_at = datetime.utcnow()

            if nuevo_estado == "aprobado":
                self._confirmar_pedido(pedido_id)

            self._session.flush()

            logger.info(
                "Pago %s confirmado post-redirect: estado=%s, mp_status=%s",
                pago.id, nuevo_estado, estado_mp,
            )

        return PagoEstadoResponse(
            estado=nuevo_estado,
            disponible=nuevo_estado != "aprobado",
            pago=PagoResponse.model_validate(pago) if pago else None,
        )

    # ── Reintentar pago ───────────────────────────────────────

    def reintentar_pago(self, pedido_id: int, usuario_id: int) -> PagoCrearResponse:
        """Reintenta el pago de un pedido cuyo último pago fue rechazado."""
        pedido = self._session.get(Pedido, pedido_id)
        if not pedido:
            raise NotFoundException("Pedido", pedido_id)

        if pedido.usuario_id != usuario_id:
            raise ForbiddenException("El pedido no pertenece al usuario autenticado")

        # Verificar estado del pedido
        estado_actual = self._session.get(EstadoPedido, pedido.estado_id)
        if not estado_actual or estado_actual.nombre != "pendiente":
            raise BadRequestException(
                "El pedido no está pendiente. No se puede reintentar el pago."
            )

        # Verificar último pago
        ultimo_pago = self._uow.pagos.get_ultimo_by_pedido(pedido_id)
        if ultimo_pago and ultimo_pago.estado == "aprobado":
            raise BadRequestException("El pedido ya tiene un pago aprobado")

        # Marcar pagos pendientes anteriores como reemplazados
        pagos_anteriores = self._uow.pagos.get_by_pedido(pedido_id)
        for p in pagos_anteriores:
            if p.estado == "pendiente":
                p.estado = "reemplazado"
                p.updated_at = datetime.utcnow()

        # Delegar a crear_pago (genera nueva preferencia con nueva idempotency_key)
        return self.crear_pago(pedido_id, usuario_id)

    # ── Helpers ───────────────────────────────────────────────

    def _get_or_create_forma_pago_mp(self) -> FormaPago:
        """Obtiene o crea la forma de pago 'MercadoPago'."""
        forma = self._session.exec(
            select(FormaPago).where(FormaPago.nombre == "MercadoPago")
        ).first()

        if not forma:
            forma = FormaPago(
                nombre="MercadoPago",
                descripcion="Pago electrónico vía MercadoPago",
                activo=True,
            )
            self._session.add(forma)
            self._session.flush()
            self._session.refresh(forma)

        return forma

    def _confirmar_pedido(self, pedido_id: int) -> None:
        """Transiciona un pedido de pendiente a confirmado (disparado por webhook de pago exitoso)."""
        pedido = self._session.get(Pedido, pedido_id)
        if not pedido:
            logger.error("Pedido %s no encontrado al confirmar por pago", pedido_id)
            return

        estado_confirmado = self._session.exec(
            select(EstadoPedido).where(EstadoPedido.nombre == "confirmado")
        ).first()

        if not estado_confirmado:
            logger.error("Estado 'confirmado' no encontrado en BD")
            return

        # Solo transicionar si está en pendiente
        if pedido.estado_id != self._session.exec(
            select(EstadoPedido).where(EstadoPedido.nombre == "pendiente")
        ).first().id:
            return

        pedido.estado_id = estado_confirmado.id

        # Registrar historial
        historial = HistorialEstadoPedido(
            pedido_id=pedido.id,
            estado_id=estado_confirmado.id,
            notas="Pago confirmado vía MercadoPago",
        )
        self._session.add(historial)
        logger.info("Pedido %s confirmado automáticamente por pago MP", pedido_id)
