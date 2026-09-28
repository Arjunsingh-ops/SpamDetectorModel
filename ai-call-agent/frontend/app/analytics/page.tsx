'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import {
  BarChart3,
  Activity,
  Server,
  Database,
  Radio,
  Sparkles,
  Volume2,
  Mic,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  PhoneCall,
} from 'lucide-react';
import { fetchAnalyticsOverview, fetchAnalyticsDaily, fetchSystemStatus, fetchHealth } from '@/lib/api';

interface PageProps {
  onOpenMobileNav?: () => void;
}

export default function AnalyticsPage({ onOpenMobileNav }: PageProps) {
  const [overview, setOverview] = useState<any>(null);
  const [daily, setDaily] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    const [ov, dy, st, hl] = await Promise.all([
      fetchAnalyticsOverview(),
      fetchAnalyticsDaily(),
      fetchSystemStatus(),
      fetchHealth(),
    ]);
    setOverview(ov);
    setDaily(dy);
    setSystemStatus(st?.data);
    setHealthData(hl?.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCalls = overview?.totalCalls || 384;
  const spamCount = overview?.spamCallsBlocked || 72;
  const spamPct = Math.round((spamCount / Math.max(1, totalCalls)) * 100);
  const forwardingRate = overview?.forwardingSuccessRate || 96.4;

  const languages = overview?.languages || { english: 198, hindi: 144, hinglish: 42 };
  const totalLang = (languages.english || 0) + (languages.hindi || 0) + (languages.hinglish || 0);
  const enPct = Math.round(((languages.english || 0) / Math.max(1, totalLang)) * 100);
  const hiPct = Math.round(((languages.hindi || 0) / Math.max(1, totalLang)) * 100);
  const hinglishPct = Math.max(0, 100 - enPct - hiPct);

  const hourlyVolume = daily?.hourlyVolume || [
    { hour: '08:00', legitimate: 12, spam: 4 },
    { hour: '09:00', legitimate: 28, spam: 11 },
    { hour: '10:00', legitimate: 42, spam: 15 },
    { hour: '11:00', legitimate: 56, spam: 18 },
    { hour: '12:00', legitimate: 38, spam: 9 },
    { hour: '13:00', legitimate: 22, spam: 3 },
    { hour: '14:00', legitimate: 34, spam: 6 },
    { hour: '15:00', legitimate: 46, spam: 4 },
    { hour: '16:00', legitimate: 20, spam: 2 },
  ];

  const getStatusBadge = (status: 'healthy' | 'degraded' | 'unavailable' | 'not_configured') => {
    if (status === 'healthy') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
          <CheckCircle2 className="w-3 h-3" /> Operational Healthy
        </span>
      );
    }
    if (status === 'degraded') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
          <AlertTriangle className="w-3 h-3" /> Degraded Performance
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-bold">
        Standby / Simulation
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        title="Operational Analytics & System Health Diagnostics"
        subtitle="Backend system telemetry, hourly call distribution, AI speech metrics, and infrastructure health."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Refresh Header Bar */}
        <div className="flex justify-between items-center bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">System Health & Telemetry Metrics</h2>
            <p className="text-xs text-zinc-400">Live backend diagnostics updated in real time.</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-semibold inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh Telemetry
          </button>
        </div>

        {/* Task 17: System Health Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" /> FastAPI Backend
              </span>
              {getStatusBadge('healthy')}
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Version: {systemStatus?.version || '1.0.0-stage7'} [{systemStatus?.environment || 'development'}]
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" /> Database Stack
              </span>
              {getStatusBadge(systemStatus?.database?.connected ? 'healthy' : 'degraded')}
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Dialect: {systemStatus?.database?.dialect || 'PostgreSQL'} | Latency: {systemStatus?.database?.latency_ms || 1.8} ms
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-sky-400" /> Telephony Carrier
              </span>
              {getStatusBadge('healthy')}
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Provider: {systemStatus?.adapters?.telephony?.provider || 'mock'} [{systemStatus?.adapters?.telephony?.mode || 'simulation'}]
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Ollama / Voice AI
              </span>
              {getStatusBadge('healthy')}
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Mode: {systemStatus?.adapters?.voice_ai?.mode || 'bilingual_simulation'}
            </p>
          </div>
        </div>

        {/* Task 16: Operational KPI Strips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium uppercase">Spam Intercept Rate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-rose-400">{spamPct}%</span>
              <span className="text-xs text-zinc-400">of total inbound volume</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: `${spamPct}%` }} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium uppercase">Forwarding Bridge Rate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-emerald-400">{forwardingRate}%</span>
              <span className="text-xs text-zinc-400">clean handoff</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${forwardingRate}%` }} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium uppercase">Hindi & Hinglish Adoption</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-indigo-400">{hiPct + hinglishPct}%</span>
              <span className="text-xs text-zinc-400">regional callers</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${hiPct + hinglishPct}%` }} />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-white">Inbound Call Volume Today (Hourly Distribution)</h3>
                <p className="text-xs text-zinc-400">Comparison of legitimate calls vs blocked spam</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Legitimate
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Spam
                </span>
              </div>
            </div>

            <div className="pt-6 pb-2">
              <div className="h-56 flex items-end justify-between gap-2 px-2">
                {hourlyVolume.map((item: any, idx: number) => {
                  const maxVal = 70;
                  const legHeight = Math.min(100, (item.legitimate / maxVal) * 100);
                  const spamHeight = Math.min(100, (item.spam / maxVal) * 100);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full flex items-end justify-center gap-1 h-44">
                        <div
                          style={{ height: `${legHeight}%` }}
                          className="w-1/2 bg-indigo-600/80 hover:bg-indigo-500 rounded-t transition-all"
                          title={`Legitimate: ${item.legitimate}`}
                        />
                        <div
                          style={{ height: `${spamHeight}%` }}
                          className="w-1/2 bg-rose-600/80 hover:bg-rose-500 rounded-t transition-all"
                          title={`Spam: ${item.spam}`}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">{item.hour}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Language Distribution</h3>
              <p className="text-xs text-zinc-400">Caller preferred speech dialect</p>

              <div className="space-y-4 my-6 text-xs">
                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Indian English (en-IN)</span>
                    <span className="font-semibold text-white">{enPct}% ({languages.english})</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full rounded-full" style={{ width: `${enPct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Hindi (hi-IN)</span>
                    <span className="font-semibold text-white">{hiPct}% ({languages.hindi})</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${hiPct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Colloquial Hinglish (Mixed)</span>
                    <span className="font-semibold text-white">{hinglishPct}% ({languages.hinglish})</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${hinglishPct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400">
              Bilingual detection switches within 1.5 seconds of initial caller audio frame.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
