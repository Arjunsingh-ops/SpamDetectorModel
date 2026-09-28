"""Unit Tests for STT, TTS, VAD, and Audio Resampler Primitives."""

import pytest
from app.ai.stt.faster_whisper import FasterWhisperSTTProvider
from app.ai.tts.local_tts import LocalTTSProvider
from app.ai.audio.vad import VoiceActivityDetector
from app.ai.audio.resampler import AudioResampler


@pytest.mark.asyncio
async def test_local_tts_synthesis():
    tts = LocalTTSProvider()
    pcm_bytes = await tts.synthesize_speech("Hello from test suite", language="en-IN")
    assert len(pcm_bytes) > 0
    # Sample length must be multiple of 2 (16-bit PCM samples)
    assert len(pcm_bytes) % 2 == 0


@pytest.mark.asyncio
async def test_stt_provider_transcription():
    stt = FasterWhisperSTTProvider()
    # 20ms of silence
    pcm_silence = b"\x00" * 640
    res = await stt.transcribe_audio(pcm_silence, sample_rate=16000)
    assert "text" in res
    assert "language" in res
    assert "confidence" in res


def test_vad_and_resampler():
    vad = VoiceActivityDetector(energy_threshold=100)
    pcm_silence = b"\x00" * 640
    assert vad.is_speech(pcm_silence) is False

    resampled = AudioResampler.resample_pcm(pcm_silence, 16000, 8000)
    assert len(resampled) > 0
