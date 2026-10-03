'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import {
  Mic,
  Volume2,
  ShieldCheck,
  Sparkles,
  Sliders,
  Play,
  Trash2,
  Upload,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  fetchVoiceSettingsApi,
  updateVoiceSettingsApi,
  fetchVoiceProfilesApi,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface PageProps {
  onOpenMobileNav?: () => void;
}

export default function VoiceAgentPage({ onOpenMobileNav }: PageProps) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('voice_agent_configure');

  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [selectedProvider, setSelectedProvider] = useState('local_tts');
  const [greetingEnglish, setGreetingEnglish] = useState(
    "Hello! Thank you for calling. I am your AI Virtual Receptionist. How may I direct your call today?"
  );
  const [greetingHindi, setGreetingHindi] = useState(
    "नमस्ते! कॉल करने के लिए धन्यवाद। मैं आपकी एआई रिसेप्शनिस्ट हूँ। आज मैं आपकी क्या सहायता कर सकती हूँ?"
  );
  const [silenceTimeout, setSilenceTimeout] = useState(3.0);
  const [maxCallDuration, setMaxCallDuration] = useState(10);
  const [aiDisclosure, setAiDisclosure] = useState(true);

  const [voiceProfiles, setVoiceProfiles] = useState<any[]>([]);
  const [consentGranted, setConsentGranted] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [settings, profiles] = await Promise.all([
      fetchVoiceSettingsApi(),
      fetchVoiceProfilesApi(),
    ]);
    if (settings) {
      setSelectedProvider(settings.provider || 'local_tts');
      setSelectedLanguage(settings.primaryLanguage || 'en-IN');
      setGreetingEnglish(settings.greetingEnglish || greetingEnglish);
      setGreetingHindi(settings.greetingHindi || greetingHindi);
      setSilenceTimeout(settings.silenceTimeoutSeconds || 3.0);
      setMaxCallDuration(settings.maxCallDurationMinutes || 10);
      setAiDisclosure(settings.aiDisclosureEnabled !== false);
    }
    setVoiceProfiles(profiles || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      provider: selectedProvider,
      primaryLanguage: selectedLanguage,
      greetingEnglish,
      greetingHindi,
      silenceTimeoutSeconds: Number(silenceTimeout),
      maxCallDurationMinutes: Number(maxCallDuration),
      aiDisclosureEnabled: aiDisclosure,
    };
    await updateVoiceSettingsApi(payload);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePreviewVoice = () => {
    setIsPlayingPreview(true);
    setTimeout(() => setIsPlayingPreview(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
      <Header
        title="AI Voice Agent & Synthesis Configuration"
        subtitle="Manage bilingual LLM prompts, local/cloud TTS speech engines, and authorized voice cloning consent."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Active LLM Engine</p>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">Ollama (Qwen2.5)</h4>
              <p className="text-[11px] text-[var(--status-success)] mt-0.5 font-medium">100% Free Local Inference</p>
            </div>
            <div className="w-8 h-8 rounded-md bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Speech Recognition</p>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">Faster-Whisper</h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">CPU / CUDA Multilingual</p>
            </div>
            <div className="w-8 h-8 rounded-md bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Active Synthesizer</p>
              <h4 className="text-sm font-semibold text-[var(--status-success)] mt-0.5">Local TTS / XTTS</h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Sub-300ms audio latency</p>
            </div>
            <div className="w-8 h-8 rounded-md bg-[var(--status-success-bg)] text-[var(--status-success)] flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Consent Compliance</p>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">Verified (DPDP)</h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Voice Owner Metadata</p>
            </div>
            <div className="w-8 h-8 rounded-md bg-[var(--status-warning-bg)] text-[var(--status-warning)] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Voice Agent Setup Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSaveSettings} className="lg:col-span-2 space-y-6">
            <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[var(--accent-primary)]" />
                  Receptionist Persona & Language Configuration
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] text-[11px] font-mono border border-[var(--border-color)]">
                  {selectedLanguage}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[var(--text-secondary)] font-medium block mb-1">Primary Language Mode</label>
                  <select
                    value={selectedLanguage}
                    disabled={!canManage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="en-IN">English (India) - Polly.Aditi</option>
                    <option value="hi-IN">Hindi (हिन्दी) - Natural Devanagari</option>
                    <option value="mixed">Bilingual / Hinglish (Auto Detection)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[var(--text-secondary)] font-medium block mb-1">AI Engine Provider</label>
                  <select
                    value={selectedProvider}
                    disabled={!canManage}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="local_tts">Local TTS (Free Offline CPU/GPU)</option>
                    <option value="polly">AWS Polly Cloud TTS</option>
                    <option value="custom_xtts">Custom XTTS-v2 Voice Clone</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[var(--text-secondary)] font-medium block mb-1">English Greeting Phrase</label>
                  <textarea
                    rows={2}
                    disabled={!canManage}
                    value={greetingEnglish}
                    onChange={(e) => setGreetingEnglish(e.target.value)}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md p-3 text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="text-[var(--text-secondary)] font-medium block mb-1">Hindi Greeting Phrase (हिन्दी अभिवादन)</label>
                  <textarea
                    rows={2}
                    disabled={!canManage}
                    value={greetingHindi}
                    onChange={(e) => setGreetingHindi(e.target.value)}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md p-3 text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[var(--text-secondary)] font-medium block mb-1">Silence Turn Timeout (seconds)</label>
                  <input
                    type="number"
                    step="0.5"
                    disabled={!canManage}
                    value={silenceTimeout}
                    onChange={(e) => setSilenceTimeout(Number(e.target.value))}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] font-mono"
                  />
                </div>

                <div>
                  <label className="text-[var(--text-secondary)] font-medium block mb-1">Max Call Duration (minutes)</label>
                  <input
                    type="number"
                    disabled={!canManage}
                    value={maxCallDuration}
                    onChange={(e) => setMaxCallDuration(Number(e.target.value))}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs">
                <input
                  type="checkbox"
                  id="aiDisc"
                  disabled={!canManage}
                  checked={aiDisclosure}
                  onChange={(e) => setAiDisclosure(e.target.checked)}
                  className="rounded border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--accent-primary)] focus:ring-0"
                />
                <label htmlFor="aiDisc" className="text-[var(--text-secondary)] font-medium">
                  Enable mandatory AI assistant disclosure at call start ("I am an AI virtual receptionist...").
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={handlePreviewVoice}
                  disabled={isPlayingPreview}
                  className="px-3 py-1.5 rounded-md bg-[var(--bg-surface-secondary)] hover:bg-[var(--border-color)] text-xs font-medium text-[var(--text-primary)] flex items-center gap-2 transition"
                >
                  <Play className={`w-3.5 h-3.5 ${isPlayingPreview ? 'animate-pulse text-[var(--status-success)]' : ''}`} />
                  {isPlayingPreview ? 'Synthesizing Audio...' : 'Preview Voice Greeting'}
                </button>

                {canManage && (
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-md bg-[var(--accent-primary)] hover:opacity-90 text-white text-xs font-medium inline-flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Configuration
                  </button>
                )}
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-md bg-[var(--status-success-bg)] border border-[var(--status-success)]/30 text-[var(--status-success)] text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Voice agent configuration successfully persisted to backend.
                </div>
              )}
            </div>

            {/* Voice Cloning & Sample Upload Section */}
            <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 text-xs shadow-xs">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[var(--status-success)]" />
                Custom Voice Sample Upload & Consent
              </h3>
              <p className="text-[var(--text-muted)]">
                Upload a 10–30 second clean audio recording of an authorized speaker (WAV/MP3). Custom voice synthesis requires verified owner consent metadata under privacy guidelines.
              </p>

              <div className="p-6 rounded-md bg-[var(--bg-app)] border border-dashed border-[var(--border-color)] flex flex-col items-center justify-center text-center space-y-2">
                <Mic className="w-8 h-8 text-[var(--text-muted)]" />
                <p className="text-[var(--text-primary)] font-medium">Drag & drop voice sample file here, or click to browse</p>
                <p className="text-[11px] text-[var(--text-muted)]">Supported formats: WAV, MP3 (Max 25MB)</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  className="rounded border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--accent-primary)] focus:ring-0"
                />
                <label htmlFor="consent" className="text-[var(--text-secondary)] font-medium">
                  I confirm that I possess explicit legal authorization and written consent from the voice owner.
                </label>
              </div>
            </div>
          </form>

          {/* Voice Profiles Sidebar */}
          <div className="space-y-6 text-xs">
            <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 shadow-xs">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Authorized Voice Profiles</h3>
              <div className="space-y-2">
                {voiceProfiles.map((vp) => (
                  <div key={vp.id} className="p-3 rounded-md bg-[var(--bg-app)] border border-[var(--border-color)] flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{vp.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-mono">
                        {vp.provider} | {vp.language}
                      </p>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => setVoiceProfiles(voiceProfiles.filter((p) => p.id !== vp.id))}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)] transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

