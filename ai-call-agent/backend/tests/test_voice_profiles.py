"""Tests for Custom Voice Profiles and Regulatory Consent Management."""

from app.ai.tts.custom_voice import CustomVoiceProvider


def test_custom_voice_sample_validation():
    provider = CustomVoiceProvider()

    # Empty sample validation
    empty_res = provider.validate_voice_sample(b"", "sample.wav")
    assert empty_res["valid"] is False
    assert "empty" in empty_res["reason"].lower()

    # Unsupported format validation
    txt_res = provider.validate_voice_sample(b"0" * 2000, "sample.txt")
    assert txt_res["valid"] is False
    assert "unsupported" in txt_res["reason"].lower()

    # Valid WAV sample validation
    valid_res = provider.validate_voice_sample(b"0" * 5000, "sample.wav")
    assert valid_res["valid"] is True
    assert valid_res["format"] == ".wav"
