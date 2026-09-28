"""Audio Queue Streaming Helper."""

import asyncio
import logging
from typing import Optional

logger = logging.getLogger("ai_call_agent.ai.audio.streaming")


class AudioStreamQueue:
    """Bounded queue for handling chunked PCM audio frames with backpressure management."""

    def __init__(self, maxsize: int = 100):
        self.queue: asyncio.Queue = asyncio.Queue(maxsize=maxsize)

    async def put(self, chunk: bytes) -> bool:
        if self.queue.full():
            logger.warning("AudioStreamQueue full. Dropping frame to prevent backpressure latency.")
            return False
        await self.queue.put(chunk)
        return True

    async def get(self) -> Optional[bytes]:
        try:
            return await self.queue.get()
        except asyncio.CancelledError:
            return None

    def clear(self) -> None:
        """Clear all pending queued audio frames."""
        while not self.queue.empty():
            try:
                self.queue.get_nowait()
            except Exception:
                break
