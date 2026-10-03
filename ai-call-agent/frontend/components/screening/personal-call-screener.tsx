'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Bot,
  User,
  Radio,
  Volume2,
  Mic,
  Send,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  simulateIncomingScreenedCall,
  sendCallerUtteranceApi,
  sendUserScreeningActionApi,
  fetchScreeningSettingsApi,
} from '@/lib/api';
import { useRealtime } from '@/lib/realtime-context';

export type ScreenerState =
  | 'IDLE'
  | 'RINGING'
  | 'SCREENING'
  | 'USER_RINGING'
  | 'CONNECTED'
  | 'AI_HANDLED'
  | 'AI_RESUMED';

interface ChatMessage {
  speaker: 'assistant' | 'caller' | 'system';
  text: string;
  timestamp: string;
}

export function PersonalCallScreener() {
  const realtime = useRealtime();

  // Screener Session State
  const [screenerState, setScreenerState] = useState<ScreenerState>('IDLE');
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [callerName, setCallerName] = useState<string>('Rahul');
  const [callerNumber, setCallerNumber] = useState<string>('+91 98112 23344');
  const [maskedNumber, setMaskedNumber] = useState<string>('+91 ••••• 4821');
  const [callerPurpose, setCallerPurpose] = useState<string | null>(null);
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'UNCERTAIN' | 'HIGH' | null>(null);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [riskReason, setRiskReason] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(true);
  const [customCallerInput, setCustomCallerInput] = useState<string>('');

  // User Settings
  const [userName, setUserName] = useState<string>('Arjun');
  const [assistantGreeting, setAssistantGreeting] = useState<string>(
    "Hello, you've reached Arjun's AI assistant. May I know who's calling and what this is regarding?"
  );

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Assistant Settings on mount
  useEffect(() => {
    fetchScreeningSettingsApi().then((s) => {
      if (s) {
        setUserName(s.user_name || 'Arjun');
        if (s.greeting) setAssistantGreeting(s.greeting);
      }
    });
  }, []);

  // Duration Timer when connected
  useEffect(() => {
    if (screenerState === 'CONNECTED') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (screenerState === 'IDLE') setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screenerState]);

  // Scroll transcript to bottom on new messages
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen to SSE events if incoming real call arrives
  useEffect(() => {
    // If realtime context receives active call or SSE
    if (realtime?.activeCalls?.length > 0) {
      const active = realtime.activeCalls[0];
      if (active.status === 'USER_RINGING' && screenerState !== 'USER_RINGING' && screenerState !== 'CONNECTED') {
        setCurrentCallId(active.id);
        setCallerName(active.callerName || 'Unknown Caller');
        setCallerNumber(active.callerNumber || '+91 98112 23344');
        setRiskLevel('LOW');
        setScreenerState('USER_RINGING');
      }
    }
  }, [realtime?.activeCalls]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Preset Simulation Scenarios
  const startSimulationScenario = async (type: 'legitimate' | 'scam' | 'uncertain') => {
    setIsProcessing(true);
    setScreenerState('SCREENING');
    setCallDuration(0);

    let phone = '+91 98112 23344';
    let name = 'Rahul';
    let initialSpeech = "Hi, I'm Rahul from Arjun's college project team. I'm calling about tomorrow's presentation.";

    if (type === 'scam') {
      phone = '+91 140 987 6543';
      name = 'Bank Support';
      initialSpeech = 'I am calling from your bank. Your debit card is blocked. Tell me the OTP you just received.';
    } else if (type === 'uncertain') {
      phone = '+91 99887 76655';
      name = 'Courier Delivery';
      initialSpeech = 'Hello, can you hear me?';
    }

    setCallerName(name);
    setCallerNumber(phone);
    setMaskedNumber(phone.slice(0, 4) + ' ••••• ' + phone.slice(-4));
    setCallerPurpose(null);
    setRiskLevel(null);
    setRiskScore(null);
    setRiskReason(null);

    // Initial greeting from AI
    setMessages([
      {
        speaker: 'assistant',
        text: assistantGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    try {
      // 1. Backend Incoming Call API
      const simCall = await simulateIncomingScreenedCall({
        caller_number: phone,
        caller_name: name,
      });

      const callId = simCall.call_id;
      setCurrentCallId(callId);

      // Caller speaks after 1s
      setTimeout(async () => {
        setMessages((prev) => [
          ...prev,
          {
            speaker: 'caller',
            text: initialSpeech,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        // 2. Utterance API to process speech, run ML spam model & extract slots
        const utteranceRes = await sendCallerUtteranceApi(callId, initialSpeech);
        setIsProcessing(false);

        if (utteranceRes.screening_info?.purpose) {
          setCallerPurpose(utteranceRes.screening_info.purpose);
        }
        if (utteranceRes.screening_info?.caller_name) {
          setCallerName(utteranceRes.screening_info.caller_name);
        }
        if (utteranceRes.risk_assessment) {
          setRiskLevel(utteranceRes.risk_assessment.risk_level);
          setRiskScore(utteranceRes.risk_assessment.risk_score);
          setRiskReason(utteranceRes.risk_assessment.reasoning);
        }

        const action = utteranceRes.recommended_action;

        if (action === 'SAFE_TO_FORWARD') {
          // AI says forwarding line
          if (utteranceRes.next_ai_utterance) {
            setMessages((prev) => [
              ...prev,
              {
                speaker: 'assistant',
                text: utteranceRes.next_ai_utterance,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
          // Ring User
          setTimeout(() => {
            setScreenerState('USER_RINGING');
          }, 800);
        } else if (action === 'CONTINUE_SCREENING') {
          setScreenerState('SCREENING');
          if (utteranceRes.next_ai_utterance) {
            setMessages((prev) => [
              ...prev,
              {
                speaker: 'assistant',
                text: utteranceRes.next_ai_utterance,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
        } else {
          // DO_NOT_FORWARD (Scam)
          setScreenerState('AI_HANDLED');
          if (utteranceRes.next_ai_utterance) {
            setMessages((prev) => [
              ...prev,
              {
                speaker: 'assistant',
                text: utteranceRes.next_ai_utterance,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
        }
      }, 1000);
    } catch (err) {
      console.error('Simulation error:', err);
      setIsProcessing(false);
    }
  };

  // Handle follow-up custom utterance from caller
  const handleSendCustomCallerSpeech = async () => {
    if (!customCallerInput.trim() || !currentCallId) return;
    const speech = customCallerInput;
    setCustomCallerInput('');
    setIsProcessing(true);

    setMessages((prev) => [
      ...prev,
      {
        speaker: 'caller',
        text: speech,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    try {
      const res = await sendCallerUtteranceApi(currentCallId, speech);
      setIsProcessing(false);

      if (res.screening_info?.purpose) setCallerPurpose(res.screening_info.purpose);
      if (res.screening_info?.caller_name) setCallerName(res.screening_info.caller_name);
      if (res.risk_assessment) {
        setRiskLevel(res.risk_assessment.risk_level);
        setRiskScore(res.risk_assessment.risk_score);
        setRiskReason(res.risk_assessment.reasoning);
      }

      if (res.next_ai_utterance) {
        setMessages((prev) => [
          ...prev,
          {
            speaker: 'assistant',
            text: res.next_ai_utterance,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }

      if (res.recommended_action === 'SAFE_TO_FORWARD') {
        setTimeout(() => setScreenerState('USER_RINGING'), 600);
      } else if (res.recommended_action === 'DO_NOT_FORWARD') {
        setScreenerState('AI_HANDLED');
      }
    } catch (e) {
      console.error('Utterance error:', e);
      setIsProcessing(false);
    }
  };

  // User Action: Answer call
  const handleUserAnswer = async () => {
    if (!currentCallId) return;
    setIsProcessing(true);
    try {
      await sendUserScreeningActionApi(currentCallId, 'ANSWER');
      setScreenerState('CONNECTED');
      setMessages((prev) => [
        ...prev,
        {
          speaker: 'system',
          text: '✓ User answered. Call bridged. AI has left the call.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // User Action: Decline call
  const handleUserDecline = async () => {
    if (!currentCallId) return;
    setIsProcessing(true);
    try {
      const res = await sendUserScreeningActionApi(currentCallId, 'DECLINE');
      setScreenerState('AI_RESUMED');
      if (res.ai_speech) {
        setMessages((prev) => [
          ...prev,
          {
            speaker: 'assistant',
            text: res.ai_speech,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // User Action: Let AI Handle
  const handleLetAiHandle = async () => {
    if (!currentCallId) return;
    setIsProcessing(true);
    try {
      await sendUserScreeningActionApi(currentCallId, 'LET_AI_HANDLE');
      setScreenerState('AI_HANDLED');
      setMessages((prev) => [
        ...prev,
        {
          speaker: 'system',
          text: 'AI assistant is taking message and handling caller.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // User Action: Take Over Call
  const handleTakeOver = async () => {
    if (!currentCallId) return;
    setIsProcessing(true);
    try {
      await sendUserScreeningActionApi(currentCallId, 'TAKE_OVER');
      setScreenerState('CONNECTED');
      setMessages((prev) => [
        ...prev,
        {
          speaker: 'system',
          text: '✓ User manually took over call. AI speech stopped. Caller connected directly to you.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to Idle
  const handleReset = () => {
    setScreenerState('IDLE');
    setCurrentCallId(null);
    setCallerName('Rahul');
    setCallerNumber('+91 98112 23344');
    setCallerPurpose(null);
    setRiskLevel(null);
    setRiskScore(null);
    setRiskReason(null);
    setMessages([]);
    setCallDuration(0);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Simulation / Scenario Toolbar */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-[#0071E3]/10 text-[#0071E3] dark:bg-[#0A84FF]/20 dark:text-[#0A84FF] border border-[#0071E3]/20">
            {isSimulationMode ? 'Simulation Mode' : 'Live Carrier Mode'}
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            Assistant: <strong className="text-[var(--text-primary)]">{userName}'s Screener</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => startSimulationScenario('legitimate')}
            disabled={screenerState !== 'IDLE' && screenerState !== 'AI_HANDLED' && screenerState !== 'CONNECTED'}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#34C759]/10 text-[#34C759] hover:bg-[#34C759]/20 border border-[#34C759]/30 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Legitimate Friend
          </button>
          <button
            onClick={() => startSimulationScenario('scam')}
            disabled={screenerState !== 'IDLE' && screenerState !== 'AI_HANDLED' && screenerState !== 'CONNECTED'}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#FF3B30]/10 text-[#FF3B30] hover:bg-[#FF3B30]/20 border border-[#FF3B30]/30 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            OTP Bank Scam
          </button>
          <button
            onClick={() => startSimulationScenario('uncertain')}
            disabled={screenerState !== 'IDLE' && screenerState !== 'AI_HANDLED' && screenerState !== 'CONNECTED'}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#FF9F0A]/10 text-[#FF9F0A] hover:bg-[#FF9F0A]/20 border border-[#FF9F0A]/30 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Uncertain Call
          </button>
          {screenerState !== 'IDLE' && (
            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Smartphone Screen Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Native Smartphone Call-Screening Interface */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[380px] bg-[var(--bg-surface)] border-2 border-[var(--border-color)] rounded-[40px] shadow-2xl overflow-hidden flex flex-col min-h-[640px] relative">
            {/* Phone Speaker & Notch */}
            <div className="pt-3 pb-2 flex justify-center items-center bg-[var(--bg-surface)] border-b border-[var(--border-color)]/30">
              <div className="w-16 h-1.5 bg-[var(--text-muted)]/20 rounded-full" />
            </div>

            {/* Top Status Area */}
            <div className="px-6 pt-4 pb-2 text-center space-y-1">
              {screenerState === 'IDLE' && (
                <>
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#0071E3]/10 dark:bg-[#0A84FF]/20 flex items-center justify-center text-[#0071E3] dark:text-[#0A84FF] mb-2">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">Personal Call Screener</h3>
                  <p className="text-xs text-[var(--text-secondary)]">AI is guarding your phone line</p>
                </>
              )}

              {(screenerState === 'SCREENING' || screenerState === 'USER_RINGING' || screenerState === 'CONNECTED' || screenerState === 'AI_HANDLED' || screenerState === 'AI_RESUMED') && (
                <>
                  <p className="text-xs font-medium tracking-wide uppercase text-[var(--text-muted)]">
                    {screenerState === 'CONNECTED'
                      ? 'Call In Progress'
                      : screenerState === 'USER_RINGING'
                      ? 'Screened Call · Ringing You'
                      : screenerState === 'AI_HANDLED'
                      ? 'AI Handled Call'
                      : screenerState === 'AI_RESUMED'
                      ? 'AI Voicemail Assistant'
                      : 'AI is Screening Call...'}
                  </p>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                    {callerName || 'Unknown Caller'}
                  </h2>
                  <p className="text-xs font-mono text-[var(--text-secondary)]">
                    {maskedNumber}
                  </p>

                  {/* Pulsing Screening / Connected Badge */}
                  <div className="pt-1 flex justify-center">
                    {screenerState === 'SCREENING' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#0071E3]/10 text-[#0071E3] dark:bg-[#0A84FF]/20 dark:text-[#0A84FF] animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-[#0071E3] dark:bg-[#0A84FF]" />
                        Listening & Evaluating Risk...
                      </span>
                    )}

                    {screenerState === 'CONNECTED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#34C759]/10 text-[#34C759]">
                        <span className="w-2 h-2 rounded-full bg-[#34C759] animate-ping" />
                        Connected ({formatTimer(callDuration)}) · AI Left Call
                      </span>
                    )}

                    {screenerState === 'AI_HANDLED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FF3B30]/10 text-[#FF3B30]">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Scam Blocked · User Not Disturbed
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Purpose & Risk Snapshot Pill (When Identified) */}
            {callerPurpose && (
              <div className="mx-4 my-2 p-2.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Caller Purpose
                  </span>
                  {riskLevel && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        riskLevel === 'LOW'
                          ? 'bg-[#34C759]/20 text-[#34C759]'
                          : riskLevel === 'HIGH'
                          ? 'bg-[#FF3B30]/20 text-[#FF3B30]'
                          : 'bg-[#FF9F0A]/20 text-[#FF9F0A]'
                      }`}
                    >
                      {riskLevel} RISK {riskScore !== null ? `(${(riskScore * 100).toFixed(0)}%)` : ''}
                    </span>
                  )}
                </div>
                <p className="text-[var(--text-primary)] font-medium leading-snug">
                  "{callerPurpose}"
                </p>
              </div>
            )}

            {/* Middle: Live Transcript Feed */}
            <div className="flex-1 px-4 py-3 overflow-y-auto space-y-3 min-h-[200px] max-h-[290px] border-y border-[var(--border-color)]/40 bg-[var(--bg-app)]/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)] space-y-2">
                  <Bot className="w-8 h-8 opacity-40" />
                  <p className="text-xs">No active call right now.<br />Choose a scenario above to test.</p>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      m.speaker === 'assistant'
                        ? 'items-start'
                        : m.speaker === 'caller'
                        ? 'items-end'
                        : 'items-center'
                    }`}
                  >
                    {m.speaker === 'system' ? (
                      <div className="my-1 px-2.5 py-1 rounded-full bg-[var(--bg-surface-secondary)] text-[11px] text-[var(--text-muted)] border border-[var(--border-color)] text-center">
                        {m.text}
                      </div>
                    ) : (
                      <>
                        <span className="text-[10px] text-[var(--text-muted)] mb-0.5 px-1">
                          {m.speaker === 'assistant' ? "Arjun's AI" : callerName || 'Caller'} · {m.timestamp}
                        </span>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                            m.speaker === 'assistant'
                              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-sm'
                              : 'bg-[#0071E3] text-white rounded-tr-sm'
                          }`}
                        >
                          {m.text}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Interactive Decision Action Area */}
            <div className="p-4 bg-[var(--bg-surface)] space-y-3">
              {/* STATE: SCREENING (Allow Take Over or Let AI Handle) */}
              {screenerState === 'SCREENING' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>Screening in progress...</span>
                    {isProcessing && <span className="animate-spin text-[#0071E3]">◷</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleTakeOver}
                      className="py-2.5 px-3 rounded-xl bg-[#0071E3] hover:bg-[#005bb5] text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <User className="w-3.5 h-3.5" />
                      Take Over
                    </button>
                    <button
                      onClick={handleLetAiHandle}
                      className="py-2.5 px-3 rounded-xl bg-[var(--bg-surface-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border-color)] transition flex items-center justify-center gap-1.5"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      Let AI Handle
                    </button>
                  </div>
                </div>
              )}

              {/* STATE: USER_RINGING (Core Forwarding Screen from Section 46) */}
              {screenerState === 'USER_RINGING' && (
                <div className="space-y-3 p-3 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/30">
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-[#34C759] uppercase tracking-wider flex items-center justify-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Looks Safe · Forwarding to You
                    </p>
                    <p className="text-xs text-[var(--text-primary)] font-medium">
                      {callerName} is calling about "{callerPurpose || 'General Inquiry'}"
                    </p>
                  </div>

                  {/* 3 Core Touch Targets: [ANSWER], [DECLINE], [LET AI HANDLE] */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={handleUserAnswer}
                      className="py-3 px-2 rounded-2xl bg-[#34C759] hover:bg-[#2db24f] text-white text-xs font-bold transition flex flex-col items-center justify-center gap-1 shadow-md"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Answer</span>
                    </button>
                    <button
                      onClick={handleUserDecline}
                      className="py-3 px-2 rounded-2xl bg-[#FF3B30] hover:bg-[#e0342a] text-white text-xs font-bold transition flex flex-col items-center justify-center gap-1 shadow-md"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                    <button
                      onClick={handleLetAiHandle}
                      className="py-3 px-2 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border-color)] transition flex flex-col items-center justify-center gap-1"
                    >
                      <Bot className="w-4 h-4" />
                      <span>AI Handle</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STATE: CONNECTED (Call active between Caller and User) */}
              {screenerState === 'CONNECTED' && (
                <div className="space-y-2 text-center">
                  <button
                    onClick={handleReset}
                    className="w-full py-3 rounded-2xl bg-[#FF3B30] hover:bg-[#e0342a] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md"
                  >
                    <PhoneOff className="w-4 h-4" />
                    End Call
                  </button>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Call bridged directly to your phone. AI has stepped away.
                  </p>
                </div>
              )}

              {/* STATE: IDLE or AI_HANDLED */}
              {(screenerState === 'IDLE' || screenerState === 'AI_HANDLED' || screenerState === 'AI_RESUMED') && (
                <div className="space-y-2">
                  <button
                    onClick={() => startSimulationScenario('legitimate')}
                    className="w-full py-3 rounded-2xl bg-[#0071E3] hover:bg-[#005bb5] text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Phone className="w-4 h-4" />
                    Simulate Inbound Friend Call
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Two-Browser Simulator & Telephony Signals Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* Caller Interactive Terminal (Browser A = Caller) */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0071E3]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Browser A: Caller Voice/Text Input
                </h4>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {screenerState !== 'IDLE' ? 'Call Active' : 'Idle'}
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              Type or speak as the caller to test the bilingual voice AI, ML spam detector, and slot extractor in real time:
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customCallerInput}
                  onChange={(e) => setCustomCallerInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCustomCallerSpeech()}
                  placeholder={
                    screenerState !== 'IDLE'
                      ? 'Reply to AI assistant...'
                      : 'Start call first with a scenario above'
                  }
                  disabled={screenerState === 'IDLE' || screenerState === 'CONNECTED' || isProcessing}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#0071E3]"
                />
                <button
                  onClick={handleSendCustomCallerSpeech}
                  disabled={screenerState === 'IDLE' || screenerState === 'CONNECTED' || !customCallerInput.trim() || isProcessing}
                  className="p-2 rounded-xl bg-[#0071E3] hover:bg-[#005bb5] text-white disabled:opacity-50 transition"
                  title="Send utterance"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sample phrases */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setCustomCallerInput("Hi, I'm Rahul from Arjun's college project team. I'm calling about tomorrow's presentation.")}
                  className="text-[10px] px-2 py-1 rounded bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
                >
                  "Rahul · College Project"
                </button>
                <button
                  type="button"
                  onClick={() => setCustomCallerInput("I'm calling from State Bank. Share the 6-digit OTP sent to your phone.")}
                  className="text-[10px] px-2 py-1 rounded bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
                >
                  "Bank · Share OTP"
                </button>
                <button
                  type="button"
                  onClick={() => setCustomCallerInput("Bhaiya delivery courier se hoon, gate par entry nahi mil rahi.")}
                  className="text-[10px] px-2 py-1 rounded bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
                >
                  "Courier Delivery Gate"
                </button>
              </div>
            </div>
          </div>

          {/* Real-Time Screening & Spam Decision Telemetry */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#0071E3]" />
                Spam Detector & Risk Telemetry
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-surface-secondary)] text-[var(--text-muted)] border border-[var(--border-color)]">
                Stage 5 + ML Engine
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[var(--border-color)]/40">
                <span className="text-[var(--text-secondary)]">Decision Policy</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {screenerState === 'USER_RINGING' || screenerState === 'CONNECTED'
                    ? 'SAFE_TO_FORWARD'
                    : screenerState === 'AI_HANDLED'
                    ? 'DO_NOT_FORWARD'
                    : screenerState === 'SCREENING'
                    ? 'CONTINUE_SCREENING'
                    : 'STANDBY'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[var(--border-color)]/40">
                <span className="text-[var(--text-secondary)]">Risk Classification</span>
                <span
                  className={`font-bold ${
                    riskLevel === 'LOW'
                      ? 'text-[#34C759]'
                      : riskLevel === 'HIGH'
                      ? 'text-[#FF3B30]'
                      : 'text-[#FF9F0A]'
                  }`}
                >
                  {riskLevel || 'EVALUATING...'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[var(--border-color)]/40">
                <span className="text-[var(--text-secondary)]">Risk Score (Calibrated)</span>
                <span className="font-mono text-[var(--text-primary)]">
                  {riskScore !== null ? `${(riskScore * 100).toFixed(1)}%` : '0.0%'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[var(--border-color)]/40">
                <span className="text-[var(--text-secondary)]">Forwarding Target</span>
                <span className="font-mono text-[var(--text-primary)]">
                  {userName} (Personal Line)
                </span>
              </div>

              {riskReason && (
                <div className="p-2 rounded-xl bg-[var(--bg-surface-secondary)] text-[11px] text-[var(--text-secondary)] border border-[var(--border-color)]">
                  <strong className="text-[var(--text-primary)]">Classifier Reasoning:</strong> {riskReason}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
