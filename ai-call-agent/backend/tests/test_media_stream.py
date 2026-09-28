"""Tests for WebSocket Media Stream Handshake and Audio Transcoding."""

import json
import base64
from fastapi.testclient import TestClient
from app.main import app
from app.services.audio_session import AudioTranscoder

client = TestClient(app)


def test_audio_transcoder_mulaw_conversion():
    # 20ms of G.711 mu-law silence (160 bytes)
    mulaw_silence = b"\xff" * 160
    pcm16 = AudioTranscoder.mulaw_to_pcm16(mulaw_silence)
    assert len(pcm16) > 0

    # Convert back to mu-law
    reencoded = AudioTranscoder.pcm16_to_mulaw(pcm16)
    assert len(reencoded) > 0


def test_media_stream_websocket_handshake():
    with client.websocket_connect("/api/v1/telephony/stream") as websocket:
        # 1. Send start framing event
        start_event = {
            "event": "start",
            "streamSid": "MZ12345",
            "start": {
                "streamSid": "MZ12345",
                "callSid": "CS98765",
                "mediaFormat": {"encoding": "audio/x-mulaw", "sampleRate": 8000, "channels": 1},
            },
        }
        websocket.send_text(json.dumps(start_event))

        # 2. Send media framing event with base64 mu-law frame
        mulaw_b64 = base64.b64encode(b"\xff" * 160).decode("utf-8")
        media_event = {
            "event": "media",
            "streamSid": "MZ12345",
            "media": {"payload": mulaw_b64},
        }
        websocket.send_text(json.dumps(media_event))

        # 3. Send stop event
        stop_event = {"event": "stop", "streamSid": "MZ12345"}
        websocket.send_text(json.dumps(stop_event))
