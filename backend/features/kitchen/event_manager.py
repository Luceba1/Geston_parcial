"""
Event Manager para WebSocket (pub/sub en proceso).

Gestiona conexiones WebSocket activas usando colas asyncio.
Single-instance: funciona con un set de asyncio.Queue, una por conexión.
"""
import asyncio
import logging
from typing import Any

logger = logging.getLogger(__name__)


class EventManager:
    """Pub/sub en proceso para eventos de cocina.

    Cada conexión WebSocket se suscribe creando una asyncio.Queue.
    Al publicar un evento, se encola un dict en todas las queues activas.
    El WebSocket handler lee de su queue y envía el JSON al cliente.
    """

    def __init__(self) -> None:
        self._subscriptions: set[asyncio.Queue[dict[str, Any]]] = set()
        self._lock = asyncio.Lock()

    async def subscribe(self) -> asyncio.Queue[dict[str, Any]]:
        """Crea una nueva suscripción (cola) para una conexión WebSocket."""
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
        async with self._lock:
            self._subscriptions.add(queue)
        logger.debug("WS client connected. Active connections: %d", len(self._subscriptions))
        return queue

    async def unsubscribe(self, queue: asyncio.Queue[dict[str, Any]]) -> None:
        """Remueve una suscripción cuando la conexión WebSocket se cierra."""
        async with self._lock:
            self._subscriptions.discard(queue)
        logger.debug("WS client disconnected. Active connections: %d", len(self._subscriptions))

    async def publish(self, event: str, data: dict[str, Any]) -> None:
        """Publica un evento a todas las conexiones activas (best-effort)."""
        payload = {"event": event, "data": data}
        async with self._lock:
            dead: list[asyncio.Queue[dict[str, Any]]] = []
            for queue in self._subscriptions:
                try:
                    queue.put_nowait(payload)
                except asyncio.QueueFull:
                    dead.append(queue)
            for q in dead:
                self._subscriptions.discard(q)

    @property
    def active_connections(self) -> int:
        return len(self._subscriptions)


# Singleton global
event_manager = EventManager()
