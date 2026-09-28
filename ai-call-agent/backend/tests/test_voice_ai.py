"""Unit Tests for Voice AI Conversation Agent, Language Detection, and Intent Extraction."""

import pytest
from app.ai.conversation.agent import ReceptionistVoiceAgent, VoiceAgentState
from app.ai.conversation.memory import ConversationMemory
from app.ai.conversation.language_detector import LanguageDetector
from app.ai.conversation.intent_extractor import IntentExtractor


def test_language_detector_devanagari_and_hinglish():
    # Hindi Devanagari test
    hi_res = LanguageDetector.detect_language("नमस्ते, मुझे डॉक्टर से मिलना है।")
    assert hi_res["language"] == "hi-IN"

    # Hinglish test
    hinglish_res = LanguageDetector.detect_language("Namaste, mera naam Rajesh hai aur mujhe appointment chahiye.")
    assert hinglish_res["language"] in ["hi-IN", "mixed"]

    # English test
    en_res = LanguageDetector.detect_language("Hello, I am calling to schedule a meeting with the manager.")
    assert en_res["language"] == "en-IN"


def test_intent_extractor_slots():
    text = "My name is Anita Sharma and I want to speak to Dr. Kapoor regarding an appointment."
    slots = IntentExtractor.extract_slots(text)

    assert slots["caller_name"] == "Anita Sharma"
    assert slots["target_person"] == "Dr. Kapoor"
    assert slots["purpose"] == "Appointment Scheduling"


@pytest.mark.asyncio
async def test_receptionist_voice_agent_dialogue_loop():
    memory = ConversationMemory(call_id="test_call_001")
    agent = ReceptionistVoiceAgent(memory=memory)

    # 1. Greeting
    greeting = agent.get_greeting(language="en-IN")
    assert "AI receptionist" in greeting
    assert agent.state == VoiceAgentState.WAITING

    # 2. Utterance processing
    res = await agent.process_caller_utterance("Hello, my name is Vikram and I need to book a consultation.")
    assert res["state"] == VoiceAgentState.SPEAKING
    assert res["language"] == "en-IN"
    assert res["extracted_slots"]["caller_name"] == "Vikram"

    # 3. Interruption
    agent.handle_interruption()
    assert agent.state == VoiceAgentState.INTERRUPTED
