"""Event Broadcaster for Dashboard Real-Time Live Stream (SSE)."""

import asyncio
import logging
from typing import Dict, Any, Set

logger = logging.getLogger("ai_call_agent.services.broadcaster")


class CallEventBroadcaster:
    """Manages active Server-Sent Event (SSE) subscriber queues for real-time dashboard updates."""

    def __init__(self):
        self._listeners: Set[asyncio.Queue] = set()

    def subscribe(self) -> asyncio.Queue:
        """Create and register a new event listener queue."""
        queue: asyncio.Queue = asyncio.Queue()
        self._listeners.add(queue)
        logger.debug(f"Dashboard SSE listener subscribed. Total active listeners: {len(self._listeners)}")
        return queue

    def unsubscribe(self, queue: asyncio.Queue) -> None:
        """Remove a listener queue on disconnect."""
        self._listeners.discard(queue)
        logger.debug(f"Dashboard SSE listener unsubscribed. Remaining listeners: {len(self._listeners)}")

    def broadcast_sync(self, event_type: str, data: Dict[str, Any]) -> None:
        """Synchronously broadcast a call update event to active dashboard subscribers."""
        if not self._listeners:
            return

        payload = {
            "event": event_type,
            "data": data,
        }

        # Dispatch payload to all queues
        for queue in list(self._listeners):
            try:
                queue.put_nowait(payload)
            except Exception as err:
                logger.error(f"Error putting event into broadcast queue: {err}")

    def broadcast_event(self, event_type: str, data: Dict[str, Any]) -> None:
        """Alias for broadcast_sync to support synchronous coordinators."""
        self.broadcast_sync(event_type, data)

    async def broadcast(self, event_type: str, data: Dict[str, Any]) -> None:
        """Broadcast a call update event to all active dashboard subscribers."""
        self.broadcast_sync(event_type, data)


broadcaster = CallEventBroadcaster()
