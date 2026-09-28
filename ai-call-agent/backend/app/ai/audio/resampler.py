"""Audio Resampler and Format Converter Utilities."""

import audioop


class AudioResampler:
    """Converts sample rates between Web Audio (48kHz/44.1kHz), Telephony (8kHz mu-law), and STT/TTS (16kHz PCM)."""

    @staticmethod
    def resample_pcm(pcm_bytes: bytes, from_rate: int, to_rate: int) -> bytes:
        if not pcm_bytes or from_rate == to_rate:
            return pcm_bytes
        try:
            resampled, _ = audioop.ratecv(pcm_bytes, 2, 1, from_rate, to_rate, None)
            return resampled
        except Exception:
            return pcm_bytes
