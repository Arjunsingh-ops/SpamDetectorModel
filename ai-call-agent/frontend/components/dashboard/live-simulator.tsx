'use client';

import React, { useState } from 'react';
import { Play, RotateCcw, Phone, User, MessageSquare, Sparkles } from 'lucide-react';
import { useRealtime } from '@/lib/realtime-context';

type SimScenario = 'custom' | 'legitimate_inquiry' | 'fraud_scam' | 'uncertain_delivery';

export function LiveCallSimulator() {
  const realtime = useRealtime();
  const [activeScenario, setActiveScenario] = useState<SimScenario>('custom');
  
  // Custom User Inputs
  const [customPhone, setCustomPhone] = useState<string>('+91 98765 43210');
  const [customName, setCustomName] = useState<string>('John Doe');
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
      badgeClass: 'badge-info',
      badgeLabel: 'Custom Call Processing',
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
      badgeClass: 'badge-success',
      badgeLabel: 'Legitimate Forward',
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
      badgeClass: 'badge-danger',
      badgeLabel: 'Blocked Spam (Score: 94)',
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
      badgeClass: 'badge-warning',
      badgeLabel: 'Screening Challenge',
    },
  };

  const curr = presetScenarios[activeScenario];

  const runSimulation = () => {
    setIsRunning(true);
    setSimStep(1);

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
    <div className="card-panel p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 tracking-tight">
              <Phone className="w-4 h-4 text-[var(--accent-primary)]" />
              Telephony Testing & AI LifeCycle Console
            </h3>
            <span className="badge-pill badge-info">Interactive Sandbox</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Configure synthetic PSTN inputs or select presets to test real-time speech intent extraction, multi-signal spam risk scoring, and smart PSTN forwarding.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className="btn-primary flex items-center gap-1.5 text-xs disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isRunning ? 'Running Session...' : 'Run Call Test'}
          </button>

          {simStep > 0 && (
            <button
              onClick={resetSimulation}
              className="btn-secondary p-1.5"
              title="Reset Sandbox"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Custom Number Input Form */}
      <div className="p-3.5 rounded-md bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            Configure Telephony Inputs
          </label>

          <select
            value={activeScenario}
            onChange={(e) => {
              setActiveScenario(e.target.value as SimScenario);
              setSimStep(0);
            }}
            disabled={isRunning}
            className="input-control text-xs py-1 px-2"
          >
            <option value="custom">Custom Phone Number & Speech Prompt</option>
            <option value="legitimate_inquiry">Preset 1: Legitimate Hindi Commercial Lead</option>
            <option value="fraud_scam">Preset 2: Electricity Disconnection Fraud (+91 140)</option>
            <option value="uncertain_delivery">Preset 3: Gate Delivery Courier Verification</option>
          </select>
        </div>

        {activeScenario === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-[var(--accent-primary)]" /> Test Caller Number
              </label>
              <input
                type="text"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="input-control w-full text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-[var(--accent-primary)]" /> Caller Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="John Doe"
                className="input-control w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-[var(--accent-primary)]" /> Speech Prompt / Transcript Input
              </label>
              <input
                type="text"
                value={customSpeech}
                onChange={(e) => setCustomSpeech(e.target.value)}
                placeholder="Hello, I want to talk to sales..."
                className="input-control w-full text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Lifecycle Progress Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
        <div
          className={`p-3 rounded-md border transition-colors ${
            simStep >= 1
              ? 'bg-[var(--accent-primary-subtle)] border-[var(--accent-primary)] text-[var(--accent-primary)] font-medium'
              : 'bg-[var(--bg-surface-secondary)] border-[var(--border-color)] text-[var(--text-muted)]'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-4 h-4 rounded-full bg-[var(--border-color)] flex items-center justify-center text-[10px] text-[var(--text-primary)]">1</span>
            Webhook Ingress
          </div>
          <p className="text-[11px] mt-1 text-[var(--text-muted)] truncate">
            {simStep >= 1 ? curr.caller : 'Awaiting carrier webhook...'}
          </p>
        </div>

        <div
          className={`p-3 rounded-md border transition-colors ${
            simStep >= 2
              ? 'bg-[var(--accent-primary-subtle)] border-[var(--accent-primary)] text-[var(--accent-primary)] font-medium'
              : 'bg-[var(--bg-surface-secondary)] border-[var(--border-color)] text-[var(--text-muted)]'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-4 h-4 rounded-full bg-[var(--border-color)] flex items-center justify-center text-[10px] text-[var(--text-primary)]">2</span>
            Bilingual Greeting
          </div>
          <p className="text-[11px] mt-1 text-[var(--text-muted)] truncate">
            {simStep >= 2 ? 'EN + Hindi Dual Prompt' : 'Standing by'}
          </p>
        </div>

        <div
          className={`p-3 rounded-md border transition-colors ${
            simStep >= 3
              ? 'bg-[var(--accent-primary-subtle)] border-[var(--accent-primary)] text-[var(--accent-primary)] font-medium'
              : 'bg-[var(--bg-surface-secondary)] border-[var(--border-color)] text-[var(--text-muted)]'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-4 h-4 rounded-full bg-[var(--border-color)] flex items-center justify-center text-[10px] text-[var(--text-primary)]">3</span>
            Multi-Signal Analysis
          </div>
          <p className="text-[11px] mt-1 text-[var(--text-muted)] truncate">
            {simStep >= 3 ? `Spam Risk Score: ${curr.spamScore}/100` : 'Awaiting speech'}
          </p>
        </div>

        <div
          className={`p-3 rounded-md border transition-colors ${
            simStep >= 4
              ? 'bg-[var(--accent-primary-subtle)] border-[var(--accent-primary)] text-[var(--accent-primary)] font-medium'
              : 'bg-[var(--bg-surface-secondary)] border-[var(--border-color)] text-[var(--text-muted)]'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-4 h-4 rounded-full bg-[var(--border-color)] flex items-center justify-center text-[10px] text-[var(--text-primary)]">4</span>
            Routing Decision
          </div>
          <p className="text-[11px] mt-1 text-[var(--text-muted)] truncate">
            {simStep >= 4 ? curr.badgeLabel : 'Pending classification'}
          </p>
        </div>
      </div>

      {/* Simulated Live Console Log */}
      <div className="rounded-md bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] p-3 font-mono text-xs space-y-2">
        {simStep === 0 && (
          <div className="text-[var(--text-muted)] text-center py-3">
            Type your phone number above and click <span className="text-[var(--accent-primary)] font-medium">&quot;Run Call Test&quot;</span> to launch a live test session.
          </div>
        )}

        {simStep >= 1 && (
          <div className="text-[var(--text-primary)] flex items-start gap-2">
            <span className="text-[var(--text-muted)]">[00:00]</span>
            <span className="text-[var(--accent-primary)] font-semibold">INBOUND_RINGING:</span>
            <span>Carrier webhook verified from {curr.caller}. Session ID: sid_sim_{Date.now().toString().slice(-6)}</span>
          </div>
        )}

        {simStep >= 2 && (
          <div className="text-[var(--text-primary)] flex items-start gap-2">
            <span className="text-[var(--text-muted)]">[00:01]</span>
            <span className="text-[var(--accent-primary)] font-semibold">AI_GREETING:</span>
            <span>&quot;{curr.greeting}&quot;</span>
          </div>
        )}

        {simStep >= 3 && (
          <>
            <div className="text-[var(--text-primary)] flex items-start gap-2">
              <span className="text-[var(--text-muted)]">[00:02]</span>
              <span className="text-[var(--status-warning)] font-semibold">CALLER_SPEECH:</span>
              <span className="italic">&quot;{curr.callerSpeech}&quot;</span>
            </div>
            <div className="text-[var(--text-primary)] flex items-start gap-2">
              <span className="text-[var(--text-muted)]">[00:03]</span>
              <span className="text-[var(--status-success)] font-semibold">INTENT_EXTRACTED:</span>
              <span>Language: {curr.language} | Intent: {curr.extractedIntent}</span>
            </div>
          </>
        )}

        {simStep >= 4 && (
          <div className="pt-2 border-t border-[var(--border-color)] text-[var(--text-primary)] flex items-start gap-2">
            <span className="text-[var(--text-muted)]">[00:04]</span>
            <span className="text-[var(--accent-primary)] font-semibold">STATE_MACHINE_DISPATCH:</span>
            <span className="font-medium text-[var(--text-primary)]">{curr.decision}</span>
          </div>
        )}
      </div>
    </div>
  );
}
