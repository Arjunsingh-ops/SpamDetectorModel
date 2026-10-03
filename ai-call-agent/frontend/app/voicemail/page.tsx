'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import {
  Voicemail as VoicemailIcon,
  Play,
  Pause,
  CheckCircle2,
  Trash2,
  Search,
  Clock,
  Volume2,
  MailCheck,
} from 'lucide-react';
import { fetchVoicemails, markVoicemailReadApi, deleteVoicemailApi, fetchRecipients } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface PageProps {
  onOpenMobileNav?: () => void;
}

export default function VoicemailPage({ onOpenMobileNav }: PageProps) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('voicemail_manage');

  const [voicemails, setVoicemails] = useState<any[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    const [vms, recs] = await Promise.all([fetchVoicemails(), fetchRecipients()]);
    setVoicemails(vms || []);
    setRecipients(recs || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleRead = async (vm: any) => {
    await markVoicemailReadApi(vm.id);
    setVoicemails((prev) =>
      prev.map((v) => (v.id === vm.id ? { ...v, is_read: !v.is_read } : v))
    );
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently delete this voicemail recording according to retention policy?')) {
      await deleteVoicemailApi(id);
      setVoicemails((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const handlePlayToggle = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
      // Auto-mark read on play
      markVoicemailReadApi(id);
      setVoicemails((prev) =>
        prev.map((v) => (v.id === id ? { ...v, is_read: true } : v))
      );
    }
  };

  const filteredVoicemails = voicemails.filter((vm) => {
    if (filterRead === 'unread' && vm.is_read) return false;
    if (filterRead === 'read' && !vm.is_read) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (vm.caller_name || '').toLowerCase().includes(q);
      const matchNumber = (vm.caller_number || '').toLowerCase().includes(q);
      const matchTranscript = (vm.transcript || '').toLowerCase().includes(q);
      return matchName || matchNumber || matchTranscript;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
      <Header
        title="Voicemail Inbox & Audio Records"
        subtitle="Private authenticated playback of caller voicemails, transcript extraction, and operator assignment."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <VoicemailIcon className="w-5 h-5 text-[var(--accent-primary)]" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">Voicemail Records</h2>
              <p className="text-xs text-[var(--text-muted)]">Total messages: {voicemails.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="relative w-60">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search caller or transcript..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md pl-9 pr-3 py-1.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            <div className="flex items-center bg-[var(--bg-app)] border border-[var(--border-color)] p-0.5 rounded-md">
              {(['all', 'unread', 'read'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterRead(tab)}
                  className={`px-3 py-1 rounded-sm capitalize font-medium transition-colors ${
                    filterRead === tab ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Voicemail Items List */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] animate-pulse" />
              ))}
            </div>
          ) : filteredVoicemails.length === 0 ? (
            <div className="p-12 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center space-y-2">
              <MailCheck className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Voicemail Inbox Empty</h4>
              <p className="text-xs text-[var(--text-muted)]">No recorded voicemail messages match your current query.</p>
            </div>
          ) : (
            filteredVoicemails.map((vm) => (
              <div
                key={vm.id}
                className={`p-4 rounded-xl border transition-all space-y-3 shadow-xs ${
                  !vm.is_read
                    ? 'bg-[var(--bg-surface)] border-[var(--accent-primary)]'
                    : 'bg-[var(--bg-surface)] border-[var(--border-color)]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePlayToggle(vm.id)}
                      className="w-9 h-9 rounded-md bg-[var(--accent-primary)] hover:opacity-90 text-white flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95"
                    >
                      {playingId === vm.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-[var(--text-primary)] text-sm">{vm.caller_name || 'Anonymous Caller'}</h4>
                        {!vm.is_read && (
                          <span className="px-2 py-0.5 rounded-full bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] text-[10px] font-semibold uppercase">
                            New Unread
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] font-mono">{vm.caller_number}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {vm.duration_seconds || 24}s
                    </span>
                    <span>{new Date(vm.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Audio Waveform Stream Simulation */}
                {playingId === vm.id && (
                  <div className="p-2.5 rounded-md bg-[var(--accent-primary-subtle)] border border-[var(--accent-primary)]/30 flex items-center justify-between gap-3">
                    <Volume2 className="w-4 h-4 text-[var(--accent-primary)] animate-pulse shrink-0" />
                    <div className="flex-1 bg-[var(--bg-app)] h-2 rounded-full overflow-hidden">
                      <div className="bg-[var(--accent-primary)] h-full w-2/3 animate-pulse" />
                    </div>
                    <span className="text-[11px] text-[var(--accent-primary)] font-mono">Playing Private Media</span>
                  </div>
                )}

                {/* Transcript Box */}
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold block mb-1">Extracted Speech Transcript:</span>
                  <p className="p-3 rounded-md bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] leading-relaxed font-mono">
                    "{vm.transcript}"
                  </p>
                </div>

                {/* Actions Row */}
                <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRead(vm)}
                      className="px-2.5 py-1 rounded-md bg-[var(--bg-surface-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-medium inline-flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />
                      {vm.is_read ? 'Mark Unread' : 'Mark Read'}
                    </button>
                  </div>

                  {canManage && (
                    <button
                      onClick={() => handleDelete(vm.id)}
                      className="p-1.5 rounded-md hover:bg-[var(--status-danger-bg)] text-[var(--text-muted)] hover:text-[var(--status-danger)] transition-colors"
                      title="Delete Voicemail"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
