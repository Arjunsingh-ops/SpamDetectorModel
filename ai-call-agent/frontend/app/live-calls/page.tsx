'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { LiveCallSimulator } from '@/components/dashboard/live-simulator';
import { ConversationPanel } from '@/components/calls/conversation-panel';
import { Radio, Volume2, Activity, PhoneCall, Eye } from 'lucide-react';
import { useRealtime, LiveCallSession } from '@/lib/realtime-context';

interface PageProps {
  onOpenMobileNav?: () => void;
}

export default function LiveCallsPage({ onOpenMobileNav }: PageProps) {
  const realtime = useRealtime();
  const [selectedSession, setSelectedSession] = useState<LiveCallSession | null>(null);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
      <Header
        title="Live Calls Monitoring & Control"
        subtitle="Real-time WebSocket telephony channel inspection, live AI speech transcripts, and active call interception."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-4">
        {/* Active Telephony Telemetry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="card-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Active SIP Channels</p>
              <h4 className="text-xl font-bold text-[var(--text-primary)] mt-1 font-mono">
                {realtime.activeCalls.length} <span className="text-[var(--text-muted)] text-xs font-normal">/ 8 max</span>
              </h4>
              <p className="text-[11px] text-[var(--status-success)] mt-0.5">Concurrency within safe limit</p>
            </div>
            <div className="w-8 h-8 rounded bg-[var(--status-success-bg)] text-[var(--status-success)] flex items-center justify-center border border-[var(--status-success-bg)]">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="card-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Speech AI Audio Latency</p>
              <h4 className="text-xl font-bold text-[var(--status-success)] mt-1 font-mono">~380 ms</h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Target sub-500ms maintained</p>
            </div>
            <div className="w-8 h-8 rounded bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] flex items-center justify-center border border-[var(--border-color)]">
              <Volume2 className="w-4 h-4" />
            </div>
          </div>

          <div className="card-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Transport Protocol</p>
              <h4 className="text-xl font-bold text-[var(--text-primary)] mt-1 font-mono">
                {realtime.isConnected ? 'WebSocket' : 'Polling Sync'}
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Auto-reconnection fallback ready</p>
            </div>
            <div className="w-8 h-8 rounded bg-[var(--status-info-bg)] text-[var(--status-info)] flex items-center justify-center border border-[var(--status-info-bg)]">
              <Radio className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Active Telephony Sessions List */}
        <div className="card-panel p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <span className="live-dot" />
              Active Telephony Call Sessions ({realtime.activeCalls.length})
            </h3>
            <span className="text-xs text-[var(--text-muted)]">Click any session to inspect live transcript</span>
          </div>

          {realtime.activeCalls.length === 0 ? (
            <div className="p-8 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-center space-y-2">
              <PhoneCall className="w-6 h-6 text-[var(--text-muted)] mx-auto" />
              <p className="text-xs text-[var(--text-muted)]">No active calls in progress right now.</p>
              <button
                onClick={() => realtime.triggerSimulatedCall()}
                className="btn-primary text-xs inline-flex items-center gap-1.5 mt-1"
              >
                Simulate Inbound Test Call
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {realtime.activeCalls.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => setSelectedSession(ch)}
                  className="p-3.5 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="live-dot shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-primary)] text-xs">{ch.callerName || 'Unknown Caller'}</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">({ch.callerNumber})</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        State: <span className="text-[var(--accent-primary)] font-mono font-medium">{ch.aiState}</span> | Lang:{' '}
                        {ch.detectedLanguage}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className={`badge-pill ${ch.disposition === 'legitimate' ? 'badge-success' : 'badge-danger'}`}>
                      {ch.durationSeconds}s
                    </span>
                    <Eye className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" />
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
