# Production AI Inference, STT & TTS Deployment

**Project**: AI Call Agent  
**Version**: v1.0.0  
**Date**: September 27, 2026  

---

## 1. AI System Overview

The AI Call Agent relies on a multi-stage real-time speech pipeline:
1. **Speech Recognition (STT)**: Transcribes incoming caller audio (English `en-IN`, Hindi `hi-IN`, Hinglish).
2. **Intent & LLM Inference (Ollama / Cloud)**: Generates conversational responses and extracts recipient entities / intent.
3. **Speech Synthesis (TTS)**: Synthesizes bilingual audio using authorized voice profiles.

---

## 2. Inference Options & Hardware Sizing

### Option A: Local / Self-Hosted GPU Inference (Recommended for Data Privacy)
- **Engine**: Ollama running `llama3:8b` model.
- **Hardware Requirement**: Dedicated GPU with **8GB+ VRAM** (e.g., NVIDIA T4, RTX 4090, or A10G).
- **Endpoint**: `http://ollama-inference-service:11434`
- **Measured Latency**:
  - First token latency: ~180ms
  - Full sentence generation: ~650ms

### Option B: Cloud AI Fallback (OpenAI / Cloud LLM)
- Set `VOICE_AI_PROVIDER=openai_realtime` or cloud endpoint in `backend/.env`.
- Ideal when dedicated GPU hosting is unavailable.

---

## 3. Bilingual STT & TTS Capabilities

- **Automatic Language Identification**: Detects English (`en-IN`), Hindi (`hi-IN`), and Hinglish code-switching dynamically during caller dialogue.
- **Voice Profiles**: Supports default bilingual voice `aditi_bilingual_in` as well as authorized custom voice clones.
- **Audio Streaming**: 20ms audio frame chunking with low latency buffer management to allow caller barge-in interruptions.
