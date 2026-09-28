"""Real-time Telephony Media Stream Processor and Audio Adapter."""

import json
import base64
import asyncio
import logging
from typing import Optional, Callable, Awaitable
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("ai_call_agent.telephony.media_stream")

# 8kHz G.711 mu-law silence byte
MULAW_SILENCE_BYTE = b"\xff" * 160  # 20ms of silence at 8000Hz (160 samples)


class MediaStreamSession:
    """
    Manages a single bidirectional WebSocket media stream connection from a telephony provider.
    Supports Twilio Media Streams specification.
    """

    def __init__(
        self,
        websocket: WebSocket,
        max_queue_size: int = 100,
        audio_handler: Optional[Callable[[bytes], Awaitable[Optional[bytes]]]] = None,
    ):
        self.websocket = websocket
        self.stream_id: Optional[str] = None
        self.call_sid: Optional[str] = None
        self.is_connected = False
        self.audio_queue: asyncio.Queue = asyncio.Queue(maxsize=max_queue_size)
        self.audio_handler = audio_handler or self._default_mock_echo_handler

    async def accept(self) -> None:
        """Accept WebSocket connection."""
        await self.websocket.accept()
        self.is_connected = True
        logger.info("Telephony WebSocket media stream connected.")

    async def receive_loop(self) -> None:
        """Main WebSocket loop receiving framing events from provider."""
        try:
            while self.is_connected:
                message_text = await self.websocket.receive_text()
                data = json.loads(message_text)
                event_type = data.get("event")

                if event_type == "connected":
                    logger.info("Stream connected protocol handshake received.")
                elif event_type == "start":
                    start_meta = data.get("start", {})
                    self.stream_id = data.get("streamSid") or start_meta.get("streamSid")
                    self.call_sid = start_meta.get("callSid")
                    logger.info(f"Media stream started for stream_id={self.stream_id}, call_sid={self.call_sid}")
                elif event_type == "media":
                    media_payload = data.get("media", {})
                    payload_b64 = media_payload.get("payload", "")
                    if payload_b64:
                        raw_audio = base64.b64decode(payload_b64)
                        # Backpressure handling: drop frame if queue full to avoid blocking
                        if not self.audio_queue.full():
                            await self.audio_queue.put(raw_audio)
                        else:
                            logger.warning(f"Audio queue full for stream {self.stream_id}, dropping frame.")

                        # Process audio frame and generate response
                        outbound_audio = await self.audio_handler(raw_audio)
                        if outbound_audio and self.stream_id:
                            await self.send_audio(outbound_audio)
                elif event_type == "mark":
                    mark_name = data.get("mark", {}).get("name")
                    logger.debug(f"Media mark received: {mark_name}")
                elif event_type == "clear":
                    logger.debug("Media clear buffer command received.")
                elif event_type == "stop":
                    logger.info(f"Media stream stop event received for stream {self.stream_id}")
                    break
        except WebSocketDisconnect:
            logger.info(f"WebSocket client disconnected for stream {self.stream_id}")
        except Exception as err:
            logger.error(f"Error in media stream receive loop: {err}")
        finally:
            self.is_connected = False

    async def send_audio(self, raw_mulaw_bytes: bytes) -> None:
        """Send base64 mu-law audio frame back to provider stream."""
        if not self.is_connected or not self.stream_id:
            return

        payload_b64 = base64.b64encode(raw_mulaw_bytes).decode("utf-8")
        media_message = {
            "event": "media",
            "streamSid": self.stream_id,
            "media": {"payload": payload_b64},
        }
        await self.websocket.send_text(json.dumps(media_message))

    async def send_mark(self, mark_name: str = "chunk_complete") -> None:
        """Send mark event to synchronize audio buffer playback."""
        if not self.is_connected or not self.stream_id:
            return
        mark_message = {
            "event": "mark",
            "streamSid": self.stream_id,
            "mark": {"name": mark_name},
        }
        await self.websocket.send_text(json.dumps(mark_message))

    async def close(self) -> None:
        """Gracefully terminate stream session."""
        self.is_connected = False
        try:
            await self.websocket.close()
        except Exception:
            pass

    async def _default_mock_echo_handler(self, inbound_bytes: bytes) -> Optional[bytes]:
        """Development audio adapter: Returns silence or low-level echo without calling paid AI APIs."""
        # For development simulation, return None or mock response
        return None
