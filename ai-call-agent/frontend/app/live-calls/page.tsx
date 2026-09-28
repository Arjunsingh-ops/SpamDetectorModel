'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { LiveCallSimulator } from '@/components/dashboard/live-simulator';
import { ConversationPanel } from '@/components/calls/conversation-panel';
import { Radio, Volume2, Activity, PhoneCall, ShieldAlert, CheckCircle2, ChevronRight, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRealtime, LiveCallSession } from '@/lib/realtime-context';

interface PageProps {
  onOpenMobileNav?: () => void;
}

export default function LiveCallsPage({ onOpenMobileNav }: PageProps) {
  const realtime = useRealtime();
  const [selectedSession, setSelectedSession] = useState<LiveCallSession | null>(null);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        title="Live Calls Monitoring & Control"
        subtitle="Real-time WebSocket telephony channel inspection, live AI speech transcripts, and active call interception."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Active Telephony Telemetry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase">Active SIP Channels</p>
              <h4 className="text-2xl font-bold text-white mt-1">
                {realtime.activeCalls.length} <span className="text-zinc-500 text-sm font-normal">/ 8 max</span>
              </h4>
              <p className="text-[11px] text-emerald-400 mt-1">Concurrency within safe limit</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase">Speech AI Audio Latency</p>
              <h4 className="text-2xl font-bold text-emerald-400 mt-1">~380 ms</h4>
              <p className="text-[11px] text-zinc-400 mt-1">Target sub-500ms maintained</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase">Transport Protocol</p>
              <h4 className="text-2xl font-bold text-white mt-1">
                {realtime.isConnected ? 'WebSocket' : 'Polling Sync'}
              </h4>
              <p className="text-[11px] text-zinc-400 mt-1">Auto-reconnection fallback ready</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Active Telephony Sessions List */}
        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              Active Telephony Call Sessions ({realtime.activeCalls.length})
            </h3>
            <span className="text-xs text-zinc-400">Click any session to open live transcript panel</span>
          </div>

          {realtime.activeCalls.length === 0 ? (
            <div className="p-8 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-2">
              <PhoneCall className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">No active calls in progress right now.</p>
              <button
                onClick={() => realtime.triggerSimulatedCall()}
                className="mt-2 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                Simulate Inbound Test Call
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {realtime.activeCalls.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => setSelectedSession(ch)}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-indigo-600/60 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">{ch.callerName || 'Unknown Caller'}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">({ch.callerNumber})</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        State: <span className="text-indigo-300 font-mono font-semibold">{ch.aiState}</span> | Lang:{' '}
                        {ch.detectedLanguage}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={ch.disposition === 'legitimate' ? 'success' : 'destructive'}>
                      {ch.durationSeconds}s
                    </Badge>
                    <Eye className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Free Simulator Component */}
        <LiveCallSimulator />
      </main>

      {/* Live Conversation Drawer Panel */}
      <ConversationPanel
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
}
