'use client';

import React, { useState } from 'react';
import { Play, RotateCcw, Phone, User, MessageSquare, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRealtime } from '@/lib/realtime-context';

type SimScenario = 'custom' | 'legitimate_inquiry' | 'fraud_scam' | 'uncertain_delivery';

export function LiveCallSimulator() {
  const realtime = useRealtime();
  const [activeScenario, setActiveScenario] = useState<SimScenario>('custom');
  
  // Custom User Inputs
  const [customPhone, setCustomPhone] = useState<string>('+91 98765 43210');
  const [customName, setCustomName] = useState<string>('Arjun Sharma');
  const [customSpeech, setCustomSpeech] = useState<string>('नमस्ते, मुझे सेल्स टीम से बात करनी है। (Hello, I want to speak with the sales team.)');

  const [simStep, setSimStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const presetScenarios = {
    custom: {
      name: 'Custom Phone Number Call',
      caller: `${customPhone} (${customName || 'Custom Caller'})`,
      language: 'hi-IN / en-IN',
      greeting: 'नमस्ते, मैं आपकी क्या सहायता कर सकता हूँ? (Hello, how may I assist you?)',
      callerSpeech: customSpeech,
      extractedIntent: 'Custom Caller Speech Evaluation',
      spamScore: 10,
      decision: 'PROCESSING -> Real-time AI Screening & Smart Routing Evaluation',
      statusBadge: { variant: 'info' as const, label: 'Custom Call Processing' },
    },
    legitimate_inquiry: {
      name: 'Legitimate Inbound Call',
      caller: '+91 98765 43210 (Rohan Sharma)',
      language: 'hi-IN (Hindi)',
      greeting: 'नमस्ते, मैं आपकी क्या सहायता कर सकता हूँ? (Hello, how may I assist you?)',
      callerSpeech: 'नमस्ते, मुझे आपके ऑफिस स्पेस लीज के बारे में जानकारी चाहिए।',
      extractedIntent: 'Commercial property leasing inquiry',
      spamScore: 12,
      decision: 'TRANSFERRING -> Forwarding to Leasing Specialist (+91 99887 76655)',
      statusBadge: { variant: 'success' as const, label: 'Legitimate Forward' },
    },
    fraud_scam: {
      name: 'High-Risk Electricity Bill Fraud',
      caller: '+91 140 987 6543 (Unregistered Telemarketer)',
      language: 'hi-IN / en-IN',
      greeting: 'Hello, thank you for calling. How may I direct your call? (नमस्ते...)',
      callerSpeech: 'Your power will be disconnected in 2 hours! Provide bank OTP or install QuickSupport app now!',
      extractedIntent: 'Extortion / Urgent Utility Cutoff Threat',
      spamScore: 94,
      decision: 'TERMINATED -> High-risk fraud pattern detected. Route to Spam Review Queue.',
      statusBadge: { variant: 'destructive' as const, label: 'Blocked Spam (Score: 94)' },
    },
    uncertain_delivery: {
      name: 'Uncertain Delivery Gate Call',
      caller: '+91 98112 23344 (Unknown Courier)',
      language: 'mixed (Hinglish)',
      greeting: 'Hello, thank you for calling. How may I direct your call?',
      callerSpeech: 'Bhaiya BlueDart courier se hoon, gate par entry nahi mil rahi.',
      extractedIntent: 'Building entrance delivery gate verification',
      spamScore: 48,
      decision: 'SCREENING CHALLENGE -> Prompting caller for recipient company badge / order ID.',
      statusBadge: { variant: 'warning' as const, label: 'Screening Challenge' },
    },
  };

  const curr = presetScenarios[activeScenario];

  const runSimulation = () => {
    setIsRunning(true);
    setSimStep(1);

    // Also trigger realtime active call state in dashboard context
    if (realtime && realtime.triggerSimulatedCall) {
      realtime.triggerSimulatedCall();
    }

    setTimeout(() => setSimStep(2), 1200);
    setTimeout(() => setSimStep(3), 2600);
    setTimeout(() => {
      setSimStep(4);
      setIsRunning(false);
    }, 4200);
  };

  const resetSimulation = () => {
    setSimStep(0);
    setIsRunning(false);
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-400" />
              Live Call Lifecycle Simulator
            </h3>
            <Badge variant="info">Free Local Testing</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Type your phone number below or choose a scenario to test live AI speech recognition, spam scoring, and call forwarding.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isRunning ? 'Simulating Call...' : 'Simulate Call Now'}
          </button>

          {simStep > 0 && (
            <button
              onClick={resetSimulation}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Custom Number Input Form */}
      <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Configure Custom Test Number & Speech Input
          </label>

          <select
            value={activeScenario}
            onChange={(e) => {
              setActiveScenario(e.target.value as SimScenario);
              setSimStep(0);
            }}
            disabled={isRunning}
            className="bg-zinc-800 border border-zinc-700 text-xs rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="custom">★ Type Custom Number & Name</option>
            <option value="legitimate_inquiry">Preset 1: Legitimate Hindi Caller</option>
            <option value="fraud_scam">Preset 2: Electricity Bill Fraud (+91 140)</option>
            <option value="uncertain_delivery">Preset 3: Delivery Gate Courier</option>
          </select>
        </div>

        {activeScenario === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-indigo-400" /> Your Phone Number
              </label>
              <input
                type="text"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-indigo-400" /> Your Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Arjun Sharma"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-indigo-400" /> Caller Speech Prompt
              </label>
              <input
                type="text"
                value={customSpeech}
                onChange={(e) => setCustomSpeech(e.target.value)}
                placeholder="Hello, I want to talk to sales..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Lifecycle Progress Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div
          className={`p-3 rounded-xl border transition-all ${
            simStep >= 1
              ? 'bg-indigo-950/30 border-indigo-700/60 text-indigo-300 shadow-sm'
              : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px]">1</span>
            Webhook Ingress
          </div>
          <p className="text-[11px] mt-1.5 text-zinc-400 truncate">
            {simStep >= 1 ? curr.caller : 'Awaiting carrier webhook...'}
          </p>
        </div>

        <div
          className={`p-3 rounded-xl border transition-all ${
            simStep >= 2
              ? 'bg-indigo-950/30 border-indigo-700/60 text-indigo-300 shadow-sm'
              : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px]">2</span>
            Bilingual Greeting
          </div>
          <p className="text-[11px] mt-1.5 text-zinc-400 truncate">
            {simStep >= 2 ? 'EN + Hindi Dual Prompt' : 'Standing by'}
          </p>
        </div>

        <div
          className={`p-3 rounded-xl border transition-all ${
            simStep >= 3
              ? 'bg-indigo-950/30 border-indigo-700/60 text-indigo-300 shadow-sm'
              : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px]">3</span>
            Multi-Signal Analysis
          </div>
          <p className="text-[11px] mt-1.5 text-zinc-400 truncate">
            {simStep >= 3 ? `Spam Risk Score: ${curr.spamScore}/100` : 'Awaiting speech'}
          </p>
        </div>

        <div
          className={`p-3 rounded-xl border transition-all ${
            simStep >= 4
              ? 'bg-indigo-950/30 border-indigo-700/60 text-indigo-300 shadow-sm'
              : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px]">4</span>
            Routing Decision
          </div>
          <p className="text-[11px] mt-1.5 text-zinc-400 truncate">
            {simStep >= 4 ? curr.statusBadge.label : 'Pending classification'}
          </p>
        </div>
      </div>

      {/* Simulated Live Console Log */}
      <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs space-y-2">
        {simStep === 0 && (
          <div className="text-zinc-400 text-center py-4">
            Type your phone number above and click <span className="text-indigo-400 font-semibold">&quot;Simulate Call Now&quot;</span> to launch a live test session.
          </div>
        )}

        {simStep >= 1 && (
          <div className="text-zinc-300 flex items-start gap-2">
            <span className="text-zinc-400">[00:00]</span>
            <span className="text-sky-400">INBOUND_RINGING:</span>
            <span>Carrier webhook verified from {curr.caller}. Session ID: sid_sim_{Date.now().toString().slice(-6)}</span>
          </div>
        )}

        {simStep >= 2 && (
          <div className="text-zinc-300 flex items-start gap-2">
            <span className="text-zinc-400">[00:01]</span>
            <span className="text-indigo-400">AI_GREETING:</span>
            <span>&quot;{curr.greeting}&quot;</span>
          </div>
        )}

        {simStep >= 3 && (
          <>
            <div className="text-zinc-300 flex items-start gap-2">
              <span className="text-zinc-400">[00:02]</span>
              <span className="text-amber-400">CALLER_SPEECH:</span>
              <span className="italic">&quot;{curr.callerSpeech}&quot;</span>
            </div>
            <div className="text-zinc-300 flex items-start gap-2">
              <span className="text-zinc-400">[00:03]</span>
              <span className="text-emerald-400">INTENT_EXTRACTED:</span>
              <span>Language: {curr.language} | Intent: {curr.extractedIntent}</span>
            </div>
          </>
        )}

        {simStep >= 4 && (
          <div className="pt-2 border-t border-zinc-900 text-zinc-200 flex items-start gap-2">
            <span className="text-zinc-400">[00:04]</span>
            <span className="text-purple-400 font-bold">STATE_MACHINE_DISPATCH:</span>
            <span className="font-semibold text-white">{curr.decision}</span>
          </div>
        )}
      </div>
    </div>
  );
}
