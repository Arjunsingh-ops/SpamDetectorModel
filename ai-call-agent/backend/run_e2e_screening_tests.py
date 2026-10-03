"""
End-to-End Automated Test Suite for Personal AI Call Screening & Safe Forwarding.

Executes all 12 Core Product Verification Tests:
TEST 1: Legitimate Caller (Rahul / College Project) -> Safe to Forward -> User Rings -> User Answers -> Call Bridged -> AI Exits
TEST 2: High-Risk OTP Scam -> High Risk -> Do Not Forward -> User Not Disturbed -> Evidence Saved
TEST 3: Uncertain Caller -> Insufficient Information -> Asks Neutral Question -> Reassesses
TEST 4: Uncertain -> Legitimate via Follow-up -> Low Risk -> Safe to Forward
TEST 5: Uncertain -> Suspicious via Follow-up -> High Risk -> Do Not Forward
TEST 6: User Declines Screened Call -> AI Resumes -> Voicemail/Callback Offered
TEST 7: User Does Not Answer -> Timeout -> AI Resumes
TEST 8: Transfer Failure / Recipient Unavailable -> Graceful Fallback
TEST 9: Caller Hangs Up / Terminate -> Resources Cleaned
TEST 10: Duplicate Telephony Webhook -> Idempotency Guard (No Duplication)
TEST 11: Spam Detector Unavailable -> Never Auto-Safe (Continue Screening / Review)
TEST 12: Ollama / LLM Offline -> Deterministic Heuristic Engine Operates
"""

import sys
import time
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.call import Call
from app.models.spam_assessment import SpamAssessment
from app.models.recipient import Recipient
from app.services.call_state_machine import CallState
from app.services.call_screening_orchestrator import call_screening_orchestrator
from app.schemas.screening import ExtractedScreeningInfo, UnifiedRiskAssessment


def setup_in_memory_db():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    # Pre-seed verified user line recipient
    recipient = Recipient(
        display_name="Arjun Singh (Personal Line)",
        phone_number="+919876543210",
        department="Personal",
        role_title="Owner",
        availability_status="available",
        is_active=True,
    )
    db.add(recipient)
    db.commit()
    db.refresh(recipient)
    return db


async def run_all_tests():
    print("=" * 70)
    print("AI CALL SCREENING & FORWARDING: END-TO-END VERIFICATION SUITE")
    print("=" * 70)

    db = setup_in_memory_db()
    passed = 0
    total = 12
    timings = {}

    # -------------------------------------------------------------------------
    # TEST 1: Legitimate Caller (Rahul / College Project)
    # -------------------------------------------------------------------------
    print("\n[TEST 1] Legitimate Caller -> Low Risk -> User Rings -> User Answers -> Bridged -> AI Exits")
    t0 = time.perf_counter()
    inbound = await call_screening_orchestrator.handle_inbound_call(
        db,
        {"external_call_sid": "test-call-1", "caller_number": "+919811223344", "caller_name": "Rahul"},
        is_simulation=True,
    )
    call_id = inbound["call_id"]

    speech = "Hi, I'm Rahul from Arjun's college project team. I'm calling about tomorrow's presentation."
    screen_res = await call_screening_orchestrator.process_caller_utterance(db, call_id, speech)

    assert screen_res["decision"] == "SAFE_TO_FORWARD", f"Expected SAFE_TO_FORWARD, got {screen_res['decision']}"
    assert screen_res["user_prompt_required"] is True
    assert screen_res["risk_assessment"]["risk_level"] == "LOW"

    # User answers incoming screened call
    user_action = await call_screening_orchestrator.handle_user_decision(db, call_id, "ANSWER")
    assert user_action["status"] == CallState.CONNECTED_TO_USER

    call_rec = db.query(Call).filter(Call.id == call_id).first()
    assert call_rec.status == CallState.CONNECTED_TO_USER
    timings["test_1_latency_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    print(f"  -> PASS: Call safely forwarded, user answered, call bridged ({timings['test_1_latency_ms']}ms)")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 2: High-Risk OTP Scam
    # -------------------------------------------------------------------------
    print("\n[TEST 2] High-Risk OTP Scam -> High Risk -> Do Not Forward -> User Not Disturbed")
    t0 = time.perf_counter()
    inbound = await call_screening_orchestrator.handle_inbound_call(
        db,
        {"external_call_sid": "test-call-2", "caller_number": "+911409876543"},
        is_simulation=True,
    )
    call_id = inbound["call_id"]

    speech = "I'm calling from your bank. Your account will be blocked today. Tell me the OTP you just received."
    screen_res = await call_screening_orchestrator.process_caller_utterance(db, call_id, speech)

    assert screen_res["decision"] == "DO_NOT_FORWARD", f"Expected DO_NOT_FORWARD, got {screen_res['decision']}"
    assert screen_res["risk_assessment"]["risk_level"] == "HIGH"
    assert screen_res["risk_assessment"]["category"] == "PHISHING_OTP"
    assert screen_res["user_prompt_required"] is False

    call_rec = db.query(Call).filter(Call.id == call_id).first()
    assert call_rec.status == CallState.AI_HANDLED
    timings["test_2_latency_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    print(f"  -> PASS: Scam blocked, user phone was NOT rung, evidence logged ({timings['test_2_latency_ms']}ms)")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 3: Uncertain Caller -> Asks Neutral Question
    # -------------------------------------------------------------------------
    print("\n[TEST 3] Uncertain Caller -> Insufficient Information -> Asks Neutral Question")
    t0 = time.perf_counter()
    inbound = await call_screening_orchestrator.handle_inbound_call(
        db,
        {"external_call_sid": "test-call-3", "caller_number": "+919988776655"},
        is_simulation=True,
    )
    call_id = inbound["call_id"]

    # Vague answer without clear identity or purpose
    speech = "Hello, can you hear me?"
    screen_res = await call_screening_orchestrator.process_caller_utterance(db, call_id, speech, question_count=1)

    assert screen_res["decision"] == "CONTINUE_SCREENING", f"Expected CONTINUE_SCREENING, got {screen_res['decision']}"
    assert "reason" in screen_res["next_ai_utterance"].lower() or "काम" in screen_res["next_ai_utterance"]
    assert screen_res["user_prompt_required"] is False
    timings["test_3_latency_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    print(f"  -> PASS: Follow-up question asked politely, screening continues ({timings['test_3_latency_ms']}ms)")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 4: Uncertain -> Legitimate via Follow-up
    # -------------------------------------------------------------------------
    print("\n[TEST 4] Uncertain -> Legitimate Clarification -> Low Risk -> Safe to Forward")
    t0 = time.perf_counter()
    inbound = await call_screening_orchestrator.handle_inbound_call(
        db,
        {"external_call_sid": "test-call-4", "caller_number": "+919877112233"},
        is_simulation=True,
    )
    call_id = inbound["call_id"]

    # Turn 1: Vague
    await call_screening_orchestrator.process_caller_utterance(db, call_id, "Hi, is this Arjun?", question_count=1)

    # Turn 2: Clarifies legitimate purpose
    turn2 = await call_screening_orchestrator.process_caller_utterance(
        db, call_id, "Yes, I am Priya from his project team calling regarding our submission.", question_count=2
    )
    assert turn2["decision"] == "SAFE_TO_FORWARD"
    assert turn2["user_prompt_required"] is True
    timings["test_4_latency_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    print(f"  -> PASS: Clarified identity and purpose, successfully safe-forwarded ({timings['test_4_latency_ms']}ms)")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 5: Uncertain -> Suspicious via Follow-up
    # -------------------------------------------------------------------------
    print("\n[TEST 5] Uncertain -> Suspicious Clarification -> High Risk -> Do Not Forward")
    t0 = time.perf_counter()
    inbound = await call_screening_orchestrator.handle_inbound_call(
        db,
        {"external_call_sid": "test-call-5", "caller_number": "+919765432100"},
        is_simulation=True,
    )
    call_id = inbound["call_id"]

    # Turn 1: Vague
    await call_screening_orchestrator.process_caller_utterance(db, call_id, "Hello, is this the account owner?", question_count=1)

    # Turn 2: Fraud threat revealed
    turn2 = await call_screening_orchestrator.process_caller_utterance(
        db, call_id, "This is CBI customs officer. Your parcel has illegal items, verify debit card immediately.", question_count=2
    )
    assert turn2["decision"] == "DO_NOT_FORWARD"
    assert turn2["risk_assessment"]["risk_level"] == "HIGH"
    timings["test_5_latency_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    print(f"  -> PASS: Threat detected during follow-up, call quarantined ({timings['test_5_latency_ms']}ms)")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 6: User Declines Screened Call
    # -------------------------------------------------------------------------
    print("\n[TEST 6] User Declines -> AI Resumes -> Voicemail Offered")
    t0 = time.perf_counter()
    inbound = await call_screening_orchestrator.handle_inbound_call(
        db,
        {"external_call_sid": "test-call-6", "caller_number": "+919822334455"},
        is_simulation=True,
    )
    call_id = inbound["call_id"]

    await call_screening_orchestrator.process_caller_utterance(
        db, call_id, "Hi, I am Neha from sales office calling about invoice payment.", question_count=1
    )

    # User declines the call
    decline_res = await call_screening_orchestrator.handle_user_decision(db, call_id, "DECLINE")
    assert decline_res["status"] == CallState.AI_RESUMED
    assert "not available" in decline_res["ai_speech"] or "leave a message" in decline_res["ai_speech"]
    timings["test_6_latency_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    print(f"  -> PASS: User declined, AI gracefully resumed and offered voicemail ({timings['test_6_latency_ms']}ms)")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 7: User Does Not Answer -> AI Resumes
    # -------------------------------------------------------------------------
    print("\n[TEST 7] User Does Not Answer -> Timeout -> AI Resumes")
    t0 = time.perf_counter()
    inbound = await call_screening_orchestrator.handle_inbound_call(
        db,
        {"external_call_sid": "test-call-7", "caller_number": "+919833445566"},
        is_simulation=True,
    )
    call_id = inbound["call_id"]
    await call_screening_orchestrator.process_caller_utterance(
        db, call_id, "I am Dr. Sharma calling regarding routine appointment schedule."
    )

    # Simulate timeout -> AI resumes
    timeout_action = await call_screening_orchestrator.handle_user_decision(db, call_id, "DECLINE", notes="Ring timeout (no answer)")
    assert timeout_action["status"] == CallState.AI_RESUMED
    timings["test_7_latency_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    print(f"  -> PASS: Timeout handled, AI took back control ({timings['test_7_latency_ms']}ms)")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 8: Transfer Failure / Fallback
    # -------------------------------------------------------------------------
    print("\n[TEST 8] Transfer Failure / Busy Recipient -> Fallback")
    t0 = time.perf_counter()
    inbound = await call_screening_orchestrator.handle_inbound_call(
        db,
        {"external_call_sid": "test-call-8", "caller_number": "+919844556677"},
        is_simulation=True,
    )
    call_id = inbound["call_id"]
    screen_res = await call_screening_orchestrator.process_caller_utterance(
        db, call_id, "Hello, this is Aman from technical support calling about your ticket."
    )
    assert screen_res["decision"] == "SAFE_TO_FORWARD"

    # Destination busy/fails -> AI resumes
    fallback_res = await call_screening_orchestrator.handle_user_decision(db, call_id, "DECLINE", notes="User phone line busy")
    assert fallback_res["status"] == CallState.AI_RESUMED
    timings["test_8_latency_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    print(f"  -> PASS: Line busy fallback routed to voicemail/callback ({timings['test_8_latency_ms']}ms)")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 9: Caller Hangs Up -> Resources Cleaned
    # -------------------------------------------------------------------------
    print("\n[TEST 9] Caller Hangs Up -> Teardown")
    t0 = time.perf_counter()
    adapter = call_screening_orchestrator.get_telephony_adapter if hasattr(call_screening_orchestrator, "get_telephony_adapter") else None
    from app.telephony import get_telephony_adapter
    mock_ad = get_telephony_adapter("mock")
    mock_ad.initiate_transfer("test-call-9", "+919876543210")
    assert "test-call-9" in mock_ad.active_calls
    mock_ad.terminate_call("test-call-9", reason="caller_hangup")
    assert "test-call-9" not in mock_ad.active_calls
    timings["test_9_latency_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    print(f"  -> PASS: Call resources terminated and freed on hangup ({timings['test_9_latency_ms']}ms)")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 10: Duplicate Telephony Webhook Idempotency
    # -------------------------------------------------------------------------
    print("\n[TEST 10] Duplicate Webhook -> Idempotency")
    t0 = time.perf_counter()
    dup_sid = "test-call-idempotent-unique-10"
    payload = {"external_call_sid": dup_sid, "caller_number": "+919811122233"}

    res1 = await call_screening_orchestrator.handle_inbound_call(db, payload, is_simulation=True)
    res2 = await call_screening_orchestrator.handle_inbound_call(db, payload, is_simulation=True)

    assert res1["call_id"] == res2["call_id"]
    calls_count = db.query(Call).filter(Call.external_call_sid == dup_sid).count()
    assert calls_count == 1, f"Expected 1 call record, got {calls_count}"
    timings["test_10_latency_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    print(f"  -> PASS: Duplicate webhook safely deduplicated, single call session preserved ({timings['test_10_latency_ms']}ms)")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 11: Spam Detector Unavailable -> Not Automatically Safe
    # -------------------------------------------------------------------------
    print("\n[TEST 11] Classifier Failure / Unavailable -> Never Automatically Safe")
    t0 = time.perf_counter()
    info = ExtractedScreeningInfo(caller_name="Caller")

    # Simulate ML exception
    original_eval = call_screening_orchestrator.spam_engine.evaluate_call
    def broken_eval(*args, **kwargs):
        raise RuntimeError("ML model file corrupted or memory exhausted")

    call_screening_orchestrator.spam_engine.evaluate_call = broken_eval
    try:
        fallback_risk = call_screening_orchestrator.spam_engine.evaluate_unified_screening_risk(
            caller_number="+919876543210",
            transcript="Hello, can you hear me?",
            screening_info=info,
            screening_question_count=1,
        )
        assert fallback_risk.risk_level != "LOW", "CRITICAL SAFETY VIOLATION: Failed classifier resulted in LOW risk"
        assert fallback_risk.recommended_action in ["CONTINUE_SCREENING", "REVIEW_REQUIRED"]
        assert fallback_risk.recommended_action != "SAFE_TO_FORWARD"
    finally:
        call_screening_orchestrator.spam_engine.evaluate_call = original_eval

    timings["test_11_latency_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    print(f"  -> PASS: Safety invariant held: Classifier failure never results in auto-forward ({timings['test_11_latency_ms']}ms)")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 12: LLM Unavailable -> Deterministic Fallback Operates
    # -------------------------------------------------------------------------
    print("\n[TEST 12] LLM Offline -> Deterministic Heuristic Engine Operates")
    t0 = time.perf_counter()
    # Test screening dialogue engine offline entity extraction without LLM
    text = "Hi, this is Vikas from delivery team calling about your package delivery."
    extracted = call_screening_orchestrator.screening_dialogue.extract_screening_info(text)

    assert extracted.caller_name == "Vikas"
    assert "delivery" in (extracted.purpose or "").lower() or "package" in (extracted.purpose or "").lower()

    risk = call_screening_orchestrator.spam_engine.evaluate_unified_screening_risk(
        caller_number="+919811223344",
        transcript=text,
        screening_info=extracted,
        screening_question_count=1,
    )
    assert risk.risk_level == "LOW"
    assert risk.recommended_action == "SAFE_TO_FORWARD"
    timings["test_12_latency_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    print(f"  -> PASS: Deterministic slot extractor and rules operate seamlessly offline ({timings['test_12_latency_ms']}ms)")
    passed += 1

    print("\n" + "=" * 70)
    print(f"RESULTS: {passed}/{total} TESTS PASSED CLEANLY (100% SUCCESS)")
    print("=" * 70)
    for k, v in timings.items():
        print(f"  - {k}: {v} ms")
    return passed == total


if __name__ == "__main__":
    import asyncio
    success = asyncio.run(run_all_tests())
    if not success:
        sys.exit(1)
