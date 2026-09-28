# ADR 0001: Hybrid Bilingual Voice AI Architecture (English & Hindi)

## Status
Accepted

## Context
In inbound call screening for professional and residential users in India and multinational markets, callers fluidly alternate between English, Hindi, and colloquial "Hinglish". Standard monolithic IVR systems force callers into rigid numeric menus ("Press 1 for English, 2 for Hindi"), causing high drop-off rates and frustrating callers. Conversely, relying exclusively on single-language speech models causes transcription errors and intent misinterpretation when Hindi words or Indian accents are presented.

## Decision
We adopt a hybrid streaming bilingual architecture:
1. The opening prompt incorporates a polite dual-language greeting: *"Hello, thank you for calling. How may I direct your call? (नमस्ते, मैं आपकी क्या सहायता कर सकता हूँ?)"*.
2. The initial speech recognition window runs continuous dual-language phonetic detection.
3. Upon detecting language markers, the conversational context switches dynamically to either pure English, pure Hindi (Devanagari/phonetic), or conversational Hinglish.
4. Future real-time streaming connects to OpenAI Realtime API (with Indian English/Hindi system instructions) with fallback to localized Whisper + Indic TTS (e.g., Bhashini or ElevenLabs multilingual) for resilience.

## Consequences
- **Positive**: Seamless caller experience, zero friction of button-pressing menus, high caller completion rate.
- **Negative**: Higher prompt token overhead; requires testing against regional acoustic accents and background noise.
