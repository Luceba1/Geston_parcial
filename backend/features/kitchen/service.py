"""
Servicio de cocina (KDS): lógica para listar pedidos activos en cocina.

Solo devuelve pedidos en estado CONFIRMADO y EN_PREPARACION (RN-CO01),
ordenados por antigüedad ascendente (RN-CO02).
"""
from typing import Tuple
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from datetime import datetime

from features.orders.models import Pedido, HistorialEstadoPedido, EstadoPedido
from features.products.models import Producto
from features.kitchen.schemas import (
    PedidoCocinaResponse,
    DetalleCocinaResponse,
    ProductoDisponibilidad,
)
from core.exceptions import NotFoundException


class KitchenService:
    """Servicio para la pantalla de cocina (KDS)."""

    ESTADOS_COCINA = {"confirmado", "en_preparacion"}

    def __init__(self, session: Session):
        self._session = session

    def _get_estado_by_id(self, estado_id: int) -> EstadoPedido:
        estado = self._session.get(EstadoPedido, estado_id)
        if not estado:
            raise NotFoundException("EstadoPedido", estado_id)
        return estado

    def _get_entrada_cocina(self, pedido: Pedido) -> datetime:
        """Obtiene el timestamp de cuando el pedido entró al estado actual de cocina.

        Busca en HistorialEstadoPedido el registro más reciente
        cuyo estado coincide con el estado actual del pedido.
        """
        historiales = getattr(pedido, 'historial_estados', None)
        if historiales is not None:
            matching = [h for h in historiales if h.estado_id == pedido.estado_id]
            if matching:
                return max(matching, key=lambda h: h.fecha_cambio).fecha_cambio
            return pedido.fecha_pedido

        stmt = (
            select(HistorialEstadoPedido)
            .where(
                HistorialEstadoPedido.pedido_id == pedido.id,
                HistorialEstadoPedido.estado_id == pedido.estado_id,
            )
            .order_by(HistorialEstadoPedido.fecha_cambio.desc())
            .limit(1)
        )
        result = self._session.exec(stmt).first()
        if result:
            return result.fecha_cambio
        return pedido.fecha_pedido

    def list_pedidos_cocina(self) -> Tuple[list[PedidoCocinaResponse], int]:
        """Lista pedidos activos en cocina (CONFIRMADO + EN_PREPARACION).

        Ordenados por antigüedad ascendente (RN-CO02).
        """
        # Obtener IDs de los estados de cocina
        estados = self._session.exec(
            select(EstadoPedido).where(EstadoPedido.nombre.in_(self.ESTADOS_COCINA))
        ).all()
        estado_ids = [e.id for e in estados]

        if not estado_ids:
            return [], 0

        # Buscar pedidos en esos estados
        stmt = (
            select(Pedido)
            .options(
                selectinload(Pedido.detalles),
                selectinload(Pedido.historial_estados),
            )
            .where(Pedido.estado_id.in_(estado_ids))
            .order_by(Pedido.fecha_pedido.asc())
        )
        pedidos = list(self._session.exec(stmt).all())

        responses = []
        for p in pedidos:
            estado = self._get_estado_by_id(p.estado_id)
            entrada = self._get_entrada_cocina(p)

            detalles = []
            for d in p.detalles or []:
                detalles.append(
                    DetalleCocinaResponse(
                        nombre_snapshot=d.nombre_snapshot,
                        cantidad=d.cantidad,
                        subtotal=d.precio_snapshot * d.cantidad,
                        personalizacion_snapshot=d.personalizacion_snapshot,
                        excluded_ingredient_ids=d.excluded_ingredient_ids,
                    )
                )

            responses.append(
                PedidoCocinaResponse(
                    id=p.id,
                    estado_nombre=estado.nombre,
                    items=detalles,
                    notas=p.notas,
                    direccion_snapshot=p.direccion_snapshot,
                    entrada_cocina_en=entrada,
                )
            )

        return responses, len(responses)

    # --- US-COCINA-07: Marcar producto no disponible ---

    def list_productos_cocina(self) -> list[ProductoDisponibilidad]:
        """Lista productos activos con su estado de disponibilidad para la cocina."""
        stmt = select(Producto).where(Producto.activo == True).order_by(Producto.nombre)
        productos = self._session.exec(stmt).all()
        return [
            ProductoDisponibilidad(id=p.id, nombre=p.nombre, disponible=p.disponible)
            for p in productos
        ]

    def toggle_disponibilidad(self, producto_id: int, disponible: bool) -> ProductoDisponibilidad:
        """Cambia la disponibilidad de un producto (RN-CO08: no modifica stock)."""
        producto = self._session.get(Producto, producto_id)
        if not producto:
            raise NotFoundException("Producto", producto_id)

        producto.disponible = disponible
        self._session.add(producto)
        self._session.flush()
        self._session.refresh(producto)

        return ProductoDisponibilidad(id=producto.id, nombre=producto.nombre, disponible=producto.disponible)
