'use client';

import React, { useEffect, useState } from 'react';
import { X, Volume2, Lock, Play, Pause, Activity } from 'lucide-react';
import { LiveCallSession } from '@/lib/realtime-context';
import { useAuth } from '@/lib/auth-context';
import { fetchCallEvents, fetchCallConversation } from '@/lib/api';

interface ConversationPanelProps {
  session: LiveCallSession | null;
  onClose: () => void;
}

export function ConversationPanel({ session, onClose }: ConversationPanelProps) {
  const { hasPermission } = useAuth();
  const canViewTranscript = hasPermission('live_calls_view');

  const [events, setEvents] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    if (session) {
      fetchCallEvents(session.id).then((evs) => setEvents(evs || []));
      fetchCallConversation(session.id).then((conv) => setConversation(conv));
    }
  }, [session]);

  if (!session) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] card-panel bg-[var(--bg-surface)] border-l border-[var(--border-color)] shadow-2xl z-50 flex flex-col select-none rounded-none">
      {/* Drawer Header */}
      <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-surface-secondary)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] border border-[var(--border-color)] flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {session.callerName || 'Live Inbound Call'}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">{session.callerNumber}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
        {/* Telephony Session Metadata Card */}
        <div className="p-3.5 rounded card-panel space-y-2">
          <div className="grid grid-cols-2 gap-3 text-[var(--text-secondary)]">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Session Status</span>
              <p className="font-semibold text-[var(--status-success)] font-mono mt-0.5">{session.status}</p>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">AI Engine State</span>
              <p className="font-semibold text-[var(--accent-primary)] font-mono mt-0.5">{session.aiState}</p>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Language</span>
              <p className="font-semibold text-[var(--text-primary)] font-mono mt-0.5">{session.detectedLanguage}</p>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Spam Risk Score</span>
              <p className={`font-semibold font-mono mt-0.5 ${session.spamScore >= 70 ? 'text-[var(--status-danger)]' : 'text-[var(--status-success)]'}`}>
                {session.spamScore} / 100
              </p>
            </div>
          </div>
        </div>

        {/* Live Audio Stream Player (Authenticated Access) */}
        <div className="p-3.5 rounded card-panel space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[var(--status-success)]" />
              Live Audio Monitoring Channel
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">Encrypted Stream</span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="btn-primary text-xs py-1 px-3 inline-flex items-center gap-1.5"
            >
              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlayingAudio ? 'Mute Live Audio' : 'Listen Live Audio'}
            </button>
            {isPlayingAudio && (
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--status-success)]">
                <span className="live-dot" />
                Listening...
              </span>
            )}
          </div>
        </div>

        {/* Professional Conversation Timeline */}
        <div className="p-3.5 rounded card-panel space-y-3">
          <h4 className="font-semibold text-[var(--text-primary)] flex items-center justify-between">
            <span>Professional Conversation Timeline</span>
            {!canViewTranscript && <Lock className="w-3.5 h-3.5 text-[var(--status-warning)]" />}
          </h4>

          {!canViewTranscript ? (
            <div className="p-3 rounded bg-[var(--status-warning-bg)] text-[var(--status-warning)] text-center text-xs">
              Transcript access restricted by RBAC policy.
            </div>
          ) : (
            <div className="space-y-2 border-l border-[var(--border-color)] pl-3">
              {session.transcript.map((t, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={t.sender === 'ai' ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--status-success)] font-semibold'}>
                      {t.sender === 'ai' ? 'AI Agent' : 'Caller'}
                    </span>
                    <span className="text-[var(--text-muted)]">{t.timestamp}</span>
                  </div>
                  <p className="text-[var(--text-primary)] leading-relaxed text-xs">
                    &quot;{t.text}&quot;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Forensic Call Event Timeline */}
        <div className="p-3.5 rounded card-panel space-y-2">
          <h4 className="font-semibold text-[var(--text-primary)]">Call Event Timeline</h4>
          <div className="space-y-1.5 font-mono text-[11px]">
            {events.map((ev) => (
              <div key={ev.id} className="p-2 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] flex justify-between items-center">
                <div>
                  <span className="text-[var(--accent-primary)] font-medium">{ev.eventType}</span>
                  <span className="text-[var(--text-muted)] text-[10px] ml-2">by {ev.actor}</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
