'use client';

import React, { useEffect, useState } from 'react';
import { X, Mic, Volume2, ShieldAlert, PhoneForwarded, Lock, Play, Pause, Activity } from 'lucide-react';
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
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 flex flex-col select-none">
      {/* Drawer Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {session.callerName || 'Live Inbound Call'}
            </h3>
            <p className="text-[11px] text-zinc-400 font-mono">{session.callerNumber}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar text-xs">
        {/* Telephony Session Metadata Card */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-zinc-300">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Session Status</span>
              <p className="font-semibold text-emerald-400 font-mono mt-0.5">{session.status}</p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">AI Engine State</span>
              <p className="font-semibold text-indigo-300 font-mono mt-0.5">{session.aiState}</p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Language</span>
              <p className="font-semibold text-white font-mono mt-0.5">{session.detectedLanguage}</p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Spam Score</span>
              <p className={`font-semibold font-mono mt-0.5 ${session.spamScore >= 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {session.spamScore} / 100
              </p>
            </div>
          </div>
        </div>

        {/* Live Audio Stream Player (Authenticated Access) */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              Live Audio Monitoring Channel
            </span>
            <span className="text-[10px] font-mono text-zinc-400">Encrypted PCM16 Stream</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-2 transition"
            >
              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlayingAudio ? 'Mute Live Audio' : 'Listen Live Audio'}
            </button>
            {isPlayingAudio && (
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Listening...
              </span>
            )}
          </div>
        </div>

        {/* Live Transcript Stream (Chronological Order) */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <h4 className="font-semibold text-white flex items-center justify-between">
            <span>Chronological Live Transcript</span>
            {!canViewTranscript && <Lock className="w-3.5 h-3.5 text-amber-400" />}
          </h4>

          {!canViewTranscript ? (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-center">
              Transcript access restricted by RBAC policy.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {session.transcript.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border leading-relaxed ${
                    t.sender === 'ai'
                      ? 'bg-indigo-950/40 border-indigo-800/40 text-indigo-100 ml-4'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-200 mr-4'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono mb-1">
                    <span className={t.sender === 'ai' ? 'text-indigo-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {t.sender === 'ai' ? '● AI Receptionist' : '● Caller'}
                    </span>
                    <span>{t.timestamp}</span>
                  </div>
                  <p>{t.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Forensic Call Event Timeline */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <h4 className="font-semibold text-white">Call Event Timeline</h4>
          <div className="space-y-2 font-mono text-[11px]">
            {events.map((ev) => (
              <div key={ev.id} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center">
                <div>
                  <span className="text-indigo-400 font-bold">{ev.eventType}</span>
                  <span className="text-zinc-500 text-[10px] ml-2">by {ev.actor}</span>
                </div>
                <span className="text-[10px] text-zinc-500">
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
