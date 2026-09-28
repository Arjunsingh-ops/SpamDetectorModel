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
  UserCheck,
  Clock,
  Volume2,
  Lock,
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
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        title="Voicemail Inbox & Audio Records"
        subtitle="Private authenticated playback of caller voicemails, transcript extraction, and operator assignment."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-2">
            <VoicemailIcon className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Voicemail Records</h2>
              <p className="text-xs text-zinc-400">Total messages: {voicemails.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="relative w-60">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search caller or transcript..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center bg-zinc-950 border border-zinc-800 p-1 rounded-xl">
              {(['all', 'unread', 'read'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterRead(tab)}
                  className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors ${
                    filterRead === tab ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Voicemail Items List */}
        <div className="space-y-4">
          {filteredVoicemails.length === 0 ? (
            <div className="p-12 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center space-y-2">
              <MailCheck className="w-10 h-10 text-zinc-600 mx-auto" />
              <h4 className="text-sm font-semibold text-white">Voicemail Inbox Empty</h4>
              <p className="text-xs text-zinc-400">No recorded voicemail messages match your current query.</p>
            </div>
          ) : (
            filteredVoicemails.map((vm) => (
              <div
                key={vm.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  !vm.is_read
                    ? 'bg-zinc-900/90 border-indigo-700/60 shadow-lg shadow-indigo-950/30'
                    : 'bg-zinc-900/60 border-zinc-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePlayToggle(vm.id)}
                      className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30 transition-transform active:scale-95"
                    >
                      {playingId === vm.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{vm.caller_name || 'Anonymous Caller'}</h4>
                        {!vm.is_read && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 uppercase">
                            New Unread
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 font-mono">{vm.caller_number}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {vm.duration_seconds || 24}s
                    </span>
                    <span>{new Date(vm.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Audio Waveform Stream Simulation */}
                {playingId === vm.id && (
                  <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between gap-3">
                    <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                    <div className="flex-1 bg-zinc-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full w-2/3 animate-pulse" />
                    </div>
                    <span className="text-[11px] text-emerald-300 font-mono">Playing Private Media</span>
                  </div>
                )}

                {/* Transcript Box */}
                <div>
                  <span className="text-[11px] text-zinc-400 font-semibold block mb-1">Extracted Speech Transcript:</span>
                  <p className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-200 leading-relaxed font-mono">
                    "{vm.transcript}"
                  </p>
                </div>

                {/* Actions Row */}
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRead(vm)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {vm.is_read ? 'Mark Unread' : 'Mark Read'}
                    </button>
                  </div>

                  {canManage && (
                    <button
                      onClick={() => handleDelete(vm.id)}
                      className="p-1.5 rounded-xl bg-zinc-800 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 transition-colors"
                      title="Delete Voicemail"
                    >
                      <Trash2 className="w-4 h-4" />
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
