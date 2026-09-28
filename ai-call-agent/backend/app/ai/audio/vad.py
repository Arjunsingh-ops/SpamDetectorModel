"""Voice Activity Detection (VAD) and Silence Filter."""

import audioop


class VoiceActivityDetector:
    """Detects active speech vs silence from raw PCM 16kHz audio frames."""

    def __init__(self, energy_threshold: int = 400):
        self.energy_threshold = energy_threshold

    def is_speech(self, pcm_bytes: bytes) -> bool:
        """Calculate RMS acoustic energy level to classify speech."""
        if not pcm_bytes or len(pcm_bytes) < 320:
            return False
        try:
            rms = audioop.rms(pcm_bytes, 2)
            return rms > self.energy_threshold
        except Exception:
            return False
