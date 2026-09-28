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
  AlertCircle,
  Lock,
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
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        title="AI Voice Agent & Synthesis Configuration"
        subtitle="Manage bilingual LLM prompts, local/cloud TTS speech engines, and authorized voice cloning consent."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase">Active LLM Engine</p>
              <h4 className="text-base font-bold text-white mt-1">Ollama (Qwen2.5)</h4>
              <p className="text-[11px] text-emerald-400 mt-1">100% Free Local Inference</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase">Speech Recognition</p>
              <h4 className="text-base font-bold text-white mt-1">Faster-Whisper</h4>
              <p className="text-[11px] text-zinc-400 mt-1">CPU / CUDA Multilingual</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase">Active Synthesizer</p>
              <h4 className="text-base font-bold text-emerald-400 mt-1">Local TTS / XTTS</h4>
              <p className="text-[11px] text-zinc-400 mt-1">Sub-300ms audio latency</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase">Consent Compliance</p>
              <h4 className="text-base font-bold text-white mt-1">Verified (DPDP)</h4>
              <p className="text-[11px] text-zinc-400 mt-1">Voice Owner Metadata</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Voice Agent Setup Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSaveSettings} className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Receptionist Persona & Language Configuration
                </h3>
                <Badge variant="outline">Selected: {selectedLanguage}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Primary Language Mode</label>
                  <select
                    value={selectedLanguage}
                    disabled={!canManage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="en-IN">English (India) - Polly.Aditi</option>
                    <option value="hi-IN">Hindi (हिन्दी) - Natural Devanagari</option>
                    <option value="mixed">Bilingual / Hinglish (Auto Detection)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 font-medium block mb-1">AI Engine Provider</label>
                  <select
                    value={selectedProvider}
                    disabled={!canManage}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="local_tts">Local TTS (Free Offline CPU/GPU)</option>
                    <option value="polly">AWS Polly Cloud TTS</option>
                    <option value="custom_xtts">Custom XTTS-v2 Voice Clone</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">English Greeting Phrase</label>
                  <textarea
                    rows={2}
                    disabled={!canManage}
                    value={greetingEnglish}
                    onChange={(e) => setGreetingEnglish(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Hindi Greeting Phrase (हिन्दी अभिवादन)</label>
                  <textarea
                    rows={2}
                    disabled={!canManage}
                    value={greetingHindi}
                    onChange={(e) => setGreetingHindi(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Silence Turn Timeout (seconds)</label>
                  <input
                    type="number"
                    step="0.5"
                    disabled={!canManage}
                    value={silenceTimeout}
                    onChange={(e) => setSilenceTimeout(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-medium block mb-1">Max Call Duration (minutes)</label>
                  <input
                    type="number"
                    disabled={!canManage}
                    value={maxCallDuration}
                    onChange={(e) => setMaxCallDuration(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
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
                  className="rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="aiDisc" className="text-zinc-300 font-medium">
                  Enable mandatory AI assistant disclosure at call start ("I am an AI virtual receptionist...").
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handlePreviewVoice}
                  disabled={isPlayingPreview}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white flex items-center gap-2 transition"
                >
                  <Play className={`w-3.5 h-3.5 ${isPlayingPreview ? 'animate-pulse text-emerald-400' : ''}`} />
                  {isPlayingPreview ? 'Synthesizing Audio...' : 'Preview Voice Greeting'}
                </button>

                {canManage && (
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Save Configuration
                  </button>
                )}
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Voice agent configuration successfully persisted to backend.
                </div>
              )}
            </div>

            {/* Voice Cloning & Sample Upload Section */}
            <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                Custom Voice Sample Upload & Consent (Task 15)
              </h3>
              <p className="text-zinc-400">
                Upload a 10–30 second clean audio recording of an authorized speaker (WAV/MP3). Custom voice synthesis requires verified owner consent metadata under privacy guidelines.
              </p>

              <div className="p-6 rounded-xl bg-zinc-950 border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center space-y-2">
                <Mic className="w-8 h-8 text-zinc-500" />
                <p className="text-zinc-300 font-medium">Drag & drop voice sample file here, or click to browse</p>
                <p className="text-[11px] text-zinc-500">Supported formats: WAV, MP3 (Max 25MB)</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="consent" className="text-zinc-300 font-medium">
                  I confirm that I possess explicit legal authorization and written consent from the voice owner.
                </label>
              </div>
            </div>
          </form>

          {/* Voice Profiles Sidebar */}
          <div className="space-y-6 text-xs">
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Authorized Voice Profiles</h3>
              <div className="space-y-3">
                {voiceProfiles.map((vp) => (
                  <div key={vp.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{vp.name}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                        {vp.provider} | {vp.language}
                      </p>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => setVoiceProfiles(voiceProfiles.filter((p) => p.id !== vp.id))}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
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
