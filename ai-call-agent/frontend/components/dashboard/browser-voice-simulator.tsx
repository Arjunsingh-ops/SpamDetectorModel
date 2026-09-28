'use client';

import React, { useState } from 'react';
import { Mic, Send, Square, RefreshCw, Volume2, UserCheck, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function BrowserVoiceSimulator() {
  const [sessionActive, setSessionActive] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedLang, setSelectedLang] = useState('en-IN');
  const [agentState, setAgentState] = useState('WAITING');
  const [transcriptTimeline, setTranscriptTimeline] = useState<Array<{ speaker: string; text: string }>>([]);
  const [extractedSummary, setExtractedSummary] = useState<{ callerName?: string; purpose?: string; urgency?: string } | null>(null);

  const startSession = () => {
    setSessionActive(true);
    setAgentState('GREETING');
    setTranscriptTimeline([
      {
        speaker: 'assistant',
        text: selectedLang === 'hi-IN'
          ? 'नमस्ते! मैं आपका एआई रिसेप्शनिस्ट हूँ। बताइए, मैं आपकी क्या सहायता कर सकता हूँ?'
          : 'Hello! I am your AI receptionist. How may I help you today?',
      },
    ]);
    setAgentState('WAITING');
  };

  const endSession = () => {
    setSessionActive(false);
    setAgentState('COMPLETED');
    setExtractedSummary({
      callerName: 'Rajesh Kumar',
      purpose: 'Appointment Scheduling',
      urgency: 'medium',
    });
  };

  const handleSendText = () => {
    if (!inputText.trim() || !sessionActive) return;
    const userText = inputText;
    setInputText('');

    setTranscriptTimeline((prev) => [...prev, { speaker: 'caller', text: userText }]);
    setAgentState('THINKING');

    setTimeout(() => {
      let aiReply = 'I can certainly help you with that request. Could you please specify your preferred date and time?';
      if (userText.toLowerCase().includes('namaste') || userText.includes('नमस्ते')) {
        aiReply = 'नमस्ते! मैं आपकी नियुक्ति तय करने में सहायता कर सकता हूँ।';
      }
      setTranscriptTimeline((prev) => [...prev, { speaker: 'assistant', text: aiReply }]);
      setAgentState('SPEAKING');

      setTimeout(() => setAgentState('WAITING'), 1500);
    }, 800);
  };

  const handleBargeIn = () => {
    setAgentState('INTERRUPTED');
    setTranscriptTimeline((prev) => [...prev, { speaker: 'system', text: '[Barge-in: AI speech cancelled by caller]' }]);
    setTimeout(() => setAgentState('WAITING'), 600);
  };

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Mic className="w-4 h-4 text-emerald-400" />
            Interactive AI Voice Call Simulator (Task 15)
          </h3>
          <p className="text-[11px] text-zinc-400">
            Simulate real-time English and Hindi voice conversations without paid carrier numbers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={sessionActive ? 'success' : 'outline'}>
            State: {agentState}
          </Badge>
          {!sessionActive ? (
            <button
              onClick={startSession}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition"
            >
              Start Simulator Call
            </button>
          ) : (
            <button
              onClick={endSession}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white flex items-center gap-1 transition"
            >
              <Square className="w-3 h-3" /> End Call
            </button>
          )}
        </div>
      </div>

      {/* Simulator Transcript Timeline */}
      <div className="h-64 overflow-y-auto bg-zinc-950 rounded-xl p-4 border border-zinc-800 space-y-3 font-mono text-xs">
        {transcriptTimeline.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-center">
            Click &quot;Start Simulator Call&quot; to test natural AI conversations.
          </div>
        ) : (
          transcriptTimeline.map((item, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl max-w-lg ${
                item.speaker === 'caller'
                  ? 'ml-auto bg-indigo-600/20 border border-indigo-500/30 text-indigo-200'
                  : item.speaker === 'assistant'
                  ? 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-300 text-center text-[11px]'
              }`}
            >
              <span className="text-[10px] text-zinc-400 block mb-0.5 uppercase">
                {item.speaker === 'caller' ? 'You (Caller)' : item.speaker === 'assistant' ? 'AI Receptionist' : 'System'}
              </span>
              <p>{item.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Controls & Input */}
      <div className="flex items-center gap-2">
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          disabled={sessionActive}
          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
        >
          <option value="en-IN">English (India)</option>
          <option value="hi-IN">Hindi (हिन्दी)</option>
        </select>

        <input
          type="text"
          placeholder={sessionActive ? "Type utterance or speech prompt..." : "Start call to enable input"}
          value={inputText}
          disabled={!sessionActive}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
        />

        <button
          onClick={handleSendText}
          disabled={!sessionActive || !inputText.trim()}
          className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1 transition"
        >
          <Send className="w-3.5 h-3.5" /> Send
        </button>

        {sessionActive && (
          <button
            onClick={handleBargeIn}
            className="px-3 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition"
          >
            <Zap className="w-3.5 h-3.5" /> Intercept / Interrupt
          </button>
        )}
      </div>

      {/* Post-Call Summary Card */}
      {extractedSummary && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-semibold text-white">Extracted Caller Intent:</span>{' '}
              <span className="text-emerald-300">{extractedSummary.callerName} — {extractedSummary.purpose}</span>
            </div>
          </div>
          <Badge variant="success">Urgency: {extractedSummary.urgency}</Badge>
        </div>
      )}
    </div>
  );
}
