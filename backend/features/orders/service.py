import asyncio
from typing import Optional, List, Tuple
from sqlmodel import Session, select, func
from sqlalchemy.orm import selectinload
from datetime import datetime

from features.orders.models import Pedido, DetallePedido, HistorialEstadoPedido, EstadoPedido
from features.orders.schemas import PedidoCreateRequest, EstadoUpdateRequest
from features.products.models import Producto
from features.addresses.models import DireccionEntrega
from features.kitchen.event_manager import event_manager
from core.exceptions import NotFoundException, ForbiddenException, ValidationException

# FSM: Define transitions allowed for each state
# Format: current_state_nombre -> [(next_state_nombre, allowed_roles), ...]
ALLOWED_TRANSITIONS: dict[str, list[tuple[str, list[str]]]] = {
    "pendiente": [
        ("confirmado", ["admin", "cocinero"]),
        ("cancelado", ["admin", "cliente"]),
    ],
    "confirmado": [
        ("en_preparacion", ["admin", "cocinero"]),
        ("cancelado", ["admin"]),
    ],
    "en_preparacion": [
        ("en_camino", ["admin", "cocinero"]),
        ("cancelado", ["admin"]),
    ],
    "en_camino": [
        ("entregado", ["admin", "repartidor"]),
    ],
    "entregado": [],       # terminal
    "cancelado": [],       # terminal
}


class OrderService:
    def __init__(self, session: Session):
        self._session = session

    def _get_estado_by_nombre(self, nombre: str) -> EstadoPedido:
        """Busca un estado por nombre exacto (case-insensitive)."""
        stmt = select(EstadoPedido).where(EstadoPedido.nombre == nombre.lower())
        estado = self._session.exec(stmt).first()
        if not estado:
            raise NotFoundException("EstadoPedido", nombre)
        return estado

    def _get_estado_by_id(self, estado_id: int) -> EstadoPedido:
        estado = self._session.get(EstadoPedido, estado_id)
        if not estado:
            raise NotFoundException("EstadoPedido", estado_id)
        return estado

    def create(self, data: PedidoCreateRequest, usuario_id: int) -> Pedido:
        """Crea un pedido de forma atómica:
        1. Valida que la dirección exista y pertenezca al usuario
        2. Valida stock de todos los productos
        3. Crea Pedido con snapshot de dirección
        4. Crea DetallesPedido con snapshots de precio/nombre
        5. Decrementa stock
        6. Registra historial de estado como PENDIENTE
        """
        from sqlmodel import select

        # 1. Validar dirección
        direccion = self._session.get(DireccionEntrega, data.direccion_entrega_id)
        if not direccion or direccion.eliminado_en is not None:
            raise NotFoundException("DireccionEntrega", data.direccion_entrega_id)
        if direccion.usuario_id != usuario_id:
            raise ForbiddenException("La dirección no pertenece al usuario autenticado")

        # Crear snapshot de dirección como JSON string
        direccion_snapshot = (
            f"{direccion.calle} {direccion.numero}, "
            f"{direccion.ciudad}"
            f"{', ' + direccion.provincia if direccion.provincia else ''}"
            f" - CP: {direccion.codigo_postal}"
            f"{' (' + direccion.referencias + ')' if direccion.referencias else ''}"
        )

        # 2. Validar stock y calcular totales
        subtotal = 0.0
        for item in data.items:
            producto = self._session.get(Producto, item.producto_id)
            if not producto or not producto.activo:
                raise NotFoundException("Producto", item.producto_id)
            if producto.stock < item.cantidad:
                raise ValidationException(
                    f"Stock insuficiente para '{producto.nombre}': "
                    f"disponible {producto.stock}, solicitado {item.cantidad}"
                )
            subtotal += item.precio_snapshot * item.cantidad

        costo_envio = 0.0  # Envío gratis por ahora
        total = subtotal + costo_envio

        # 3. Obtener estado PENDIENTE
        estado_pendiente = self._get_estado_by_nombre("pendiente")

        # 4. Crear Pedido
        pedido = Pedido(
            usuario_id=usuario_id,
            direccion_entrega_id=data.direccion_entrega_id,
            estado_id=estado_pendiente.id,
            forma_pago_id=data.forma_pago_id,
            subtotal=subtotal,
            costo_envio=costo_envio,
            total=total,
            notas=data.notas,
            direccion_snapshot=direccion_snapshot,
        )
        self._session.add(pedido)
        self._session.flush()

        # 5. Crear DetallesPedido y decrementar stock
        for item in data.items:
            detalle = DetallePedido(
                pedido_id=pedido.id,
                producto_id=item.producto_id,
                nombre_snapshot=item.nombre_snapshot,
                precio_snapshot=item.precio_snapshot,
                cantidad=item.cantidad,
                excluded_ingredient_ids=item.excluded_ingredient_ids,
                personalizacion_snapshot=item.personalizacion_snapshot,
            )
            self._session.add(detalle)

            # Decrementar stock
            producto = self._session.get(Producto, item.producto_id)
            producto.stock -= item.cantidad

        # 6. Registrar historial
        historial = HistorialEstadoPedido(
            pedido_id=pedido.id,
            estado_id=estado_pendiente.id,
            usuario_id=usuario_id,
            notas="Pedido creado",
        )
        self._session.add(historial)

        self._session.flush()
        self._session.refresh(pedido)
        return pedido

    def list_mine(self, usuario_id: int, page: int = 1, limit: int = 20) -> Tuple[List[Pedido], int]:
        """Lista pedidos del usuario autenticado con paginación."""
        offset = (page - 1) * limit

        query = select(Pedido).options(
            selectinload(Pedido.detalles),
            selectinload(Pedido.historial_estados).selectinload(HistorialEstadoPedido.estado),
        ).where(
            Pedido.usuario_id == usuario_id
        ).order_by(Pedido.fecha_pedido.desc()).offset(offset).limit(limit)

        items = list(self._session.exec(query).all())
        total = self._session.exec(select(func.count()).select_from(Pedido).where(Pedido.usuario_id == usuario_id)).one()
        return items, total

    def list_all(self, page: int = 1, limit: int = 20) -> Tuple[List[Pedido], int]:
        """Lista todos los pedidos (admin/gestor) con paginación."""
        offset = (page - 1) * limit

        query = select(Pedido).options(
            selectinload(Pedido.detalles),
            selectinload(Pedido.historial_estados).selectinload(HistorialEstadoPedido.estado),
        ).order_by(
            Pedido.fecha_pedido.desc()
        ).offset(offset).limit(limit)

        items = list(self._session.exec(query).all())
        total = self._session.exec(select(func.count()).select_from(Pedido)).one()
        return items, total

    def get_by_id(self, pedido_id: int, usuario_id: Optional[int] = None) -> Pedido:
        """Obtiene un pedido por ID. Si usuario_id se pasa, verifica pertenencia."""
        pedido = self._session.get(Pedido, pedido_id)
        if not pedido:
            raise NotFoundException("Pedido", pedido_id)

        # Verificar pertenencia si se pasa usuario_id
        if usuario_id is not None and pedido.usuario_id != usuario_id:
            raise ForbiddenException("No tenés permisos para ver este pedido")

        return pedido

    def update_estado(
        self,
        pedido_id: int,
        data: EstadoUpdateRequest,
        current_user_roles: list[str],
        current_user_id: int,
    ) -> Pedido:
        """Avanza/retrocede el estado del pedido según la FSM."""
        pedido = self._session.get(Pedido, pedido_id)
        if not pedido:
            raise NotFoundException("Pedido", pedido_id)

        estado_actual = self._get_estado_by_id(pedido.estado_id)
        estado_destino = self._get_estado_by_nombre(data.estado_nombre)

        # --- Caso especial: cliente cancelando su propio pedido pendiente ---
        # El cliente puede cancelar solo si es su pedido y está en "pendiente"
        es_cliente = "cliente" in current_user_roles
        es_cocinero = "cocinero" in current_user_roles
        es_admin = "admin" in current_user_roles
        es_su_pedido = pedido.usuario_id == current_user_id

        if es_cliente and es_su_pedido and estado_actual.nombre == "pendiente" and estado_destino.nombre == "cancelado":
            # Permitir cancelación del cliente
            pass
        elif estado_destino.nombre == "cancelado" and not es_admin:
            raise ForbiddenException("Solo un administrador puede cancelar pedidos en este estado")

        # --- RN-CO03: Validación de transiciones para rol cocinero ---
        # El cocinero solo puede ejecutar: confirmado→en_preparacion y en_preparacion→en_camino
        if es_cocinero and not es_admin:
            cocinero_allowed = [
                ("confirmado", "en_preparacion"),
                ("en_preparacion", "en_camino"),
            ]
            if (estado_actual.nombre, estado_destino.nombre) not in cocinero_allowed:
                raise ForbiddenException(
                    "El rol cocinero solo puede tomar pedidos (confirmado→en_preparacion) "
                    "y marcarlos terminados (en_preparacion→en_camino)."
                )

        # --- Verificar transición permitida (FSM general) ---
        transitions = ALLOWED_TRANSITIONS.get(estado_actual.nombre, [])
        allowed = False
        for next_state, roles in transitions:
            if next_state == estado_destino.nombre:
                # Cliente puede cancelar su pedido pendiente
                if es_cliente and es_su_pedido and estado_actual.nombre == "pendiente" and next_state == "cancelado":
                    allowed = True
                    break
                # Verificar roles
                if any(r in current_user_roles for r in roles):
                    allowed = True
                    break

        if not allowed:
            raise ValidationException(
                f"No se puede cambiar de '{estado_actual.nombre}' a '{estado_destino.nombre}'. "
                f"Transición no permitida por la máquina de estados."
            )

        # Actualizar estado
        pedido.estado_id = estado_destino.id

        # Registrar historial (con usuario_id para auditoría, RN-CO04)
        historial = HistorialEstadoPedido(
            pedido_id=pedido.id,
            estado_id=estado_destino.id,
            usuario_id=current_user_id,
            notas=data.notas or f"Cambio de estado: {estado_actual.nombre} → {estado_destino.nombre}",
        )
        self._session.add(historial)

        self._session.flush()
        self._session.refresh(pedido)

        # Publicar evento SSE (best-effort, fire-and-forget)
        self._publish_evento_cocina(estado_actual.nombre, estado_destino.nombre, pedido)

        return pedido

    def _publish_evento_cocina(self, estado_desde: str, estado_hasta: str, pedido: Pedido) -> None:
        """Publica evento SSE según la transición de estado, si corresponde a cocina."""
        event_map = {
            ("pendiente", "confirmado"): "PEDIDO_CONFIRMADO",
            ("confirmado", "en_preparacion"): "PEDIDO_EN_PREPARACION",
            ("en_preparacion", "en_camino"): "PEDIDO_EN_CAMINO",
            ("confirmado", "cancelado"): "PEDIDO_CANCELADO",
            ("en_preparacion", "cancelado"): "PEDIDO_CANCELADO",
        }
        event_type = event_map.get((estado_desde, estado_hasta))
        if event_type:
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(
                        event_manager.publish(event_type, {"pedido_id": pedido.id})
                    )
            except RuntimeError:
                pass  # No event loop available, skip publish

    def _build_response(self, pedido: Pedido) -> dict:
        """Construye un dict con todos los datos del pedido (para el response model personalizado)."""
        estado = self._get_estado_by_id(pedido.estado_id)

        detalles = []
        for d in pedido.detalles or []:
            detalles.append({
                "id": d.id,
                "producto_id": d.producto_id,
                "nombre_snapshot": d.nombre_snapshot,
                "precio_snapshot": d.precio_snapshot,
                "cantidad": d.cantidad,
                "excluded_ingredient_ids": d.excluded_ingredient_ids,
                "personalizacion_snapshot": d.personalizacion_snapshot,
                "subtotal": d.precio_snapshot * d.cantidad,
            })

        historial = []
        for h in (pedido.historial_estados or []):
            historial.append({
                "id": h.id,
                "estado_id": h.estado_id,
                "estado_nombre": h.estado.nombre,
                "usuario_id": h.usuario_id,
                "fecha_cambio": h.fecha_cambio,
                "notas": h.notas,
            })

        return {
            "id": pedido.id,
            "usuario_id": pedido.usuario_id,
            "estado_id": pedido.estado_id,
            "estado_nombre": estado.nombre,
            "estado_orden": estado.orden,
            "forma_pago_id": pedido.forma_pago_id,
            "subtotal": pedido.subtotal,
            "costo_envio": pedido.costo_envio,
            "total": pedido.total,
            "notas": pedido.notas,
            "direccion_snapshot": pedido.direccion_snapshot,
            "fecha_pedido": pedido.fecha_pedido,
            "fecha_entrega_estimada": pedido.fecha_entrega_estimada,
            "detalles": detalles,
            "historial_estados": historial,
        }
