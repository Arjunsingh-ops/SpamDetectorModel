'use client';

import React, { useState } from 'react';
import { Search, Phone, ShieldCheck, ShieldAlert, HelpCircle, Eye, Clock } from 'lucide-react';
import { CallRecord } from '@/types';
import { Badge } from '@/components/ui/badge';

interface CallTableProps {
  calls: CallRecord[];
  title?: string;
  showFilters?: boolean;
}

export function CallTable({ calls, title = 'Recent Call Activity', showFilters = true }: CallTableProps) {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  const filteredCalls = calls.filter((c) => {
    if (filter !== 'all' && c.disposition !== filter) return false;
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      const matchCaller = c.callerNumber.toLowerCase().includes(q);
      const matchName = c.callerName?.toLowerCase().includes(q) || false;
      const matchIntent = c.callerIntent?.toLowerCase().includes(q) || false;
      return matchCaller || matchName || matchIntent;
    }
    return true;
  });

  const getDispositionBadge = (disp: string, spamScore: number) => {
    if (disp === 'legitimate') {
      return <Badge variant="success"><ShieldCheck className="w-3 h-3" /> Legitimate</Badge>;
    }
    if (disp === 'spam') {
      return <Badge variant="destructive"><ShieldAlert className="w-3 h-3" /> Spam ({spamScore})</Badge>;
    }
    return <Badge variant="warning"><HelpCircle className="w-3 h-3" /> Screened ({spamScore})</Badge>;
  };

  const getLanguageChip = (lang: string) => {
    if (lang === 'hi-IN') return <span className="text-[10px] px-2 py-0.5 rounded bg-orange-950/60 text-orange-300 border border-orange-800/40">हिन्दी</span>;
    if (lang === 'en-IN') return <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/40">English</span>;
    return <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">Hinglish</span>;
  };

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="p-5 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-zinc-400">Total records: {filteredCalls.length}</p>
        </div>

        {showFilters && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search caller or intent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-60 bg-zinc-950 border border-zinc-800 text-xs rounded-xl pl-9 pr-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center rounded-xl bg-zinc-950 border border-zinc-800 p-1 text-xs">
              {['all', 'legitimate', 'spam', 'uncertain'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded-lg capitalize transition-colors font-medium ${
                    filter === tab
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Calls Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/60 border-b border-zinc-800/80 text-zinc-400 font-medium">
            <tr>
              <th className="px-5 py-3">Caller</th>
              <th className="px-4 py-3">Language</th>
              <th className="px-4 py-3">Intent / Subject</th>
              <th className="px-4 py-3">Disposition</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filteredCalls.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-zinc-400">
                  No matching calls found in database.
                </td>
              </tr>
            ) : (
              filteredCalls.map((call) => (
                <tr key={call.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-zinc-100">{call.callerName || 'Unknown Caller'}</div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-zinc-400" />
                      {call.callerNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {getLanguageChip(call.detectedLanguage)}
                  </td>
                  <td className="px-4 py-3.5 max-w-xs truncate text-zinc-300">
                    {call.callerIntent || 'No intent recognized'}
                  </td>
                  <td className="px-4 py-3.5">
                    {getDispositionBadge(call.disposition, call.spamScore)}
                  </td>
                  <td className="px-4 py-3.5 text-zinc-400 font-mono">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {call.durationSeconds}s
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedCall(call)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Call Details Drawer/Modal */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h4 className="text-base font-semibold text-white">Call Forensic Details</h4>
                <p className="text-xs text-zinc-400 font-mono">ID: {selectedCall.id}</p>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 my-5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <div>
                  <span className="text-zinc-400">Caller Identity:</span>
                  <p className="font-semibold text-zinc-100">{selectedCall.callerName || 'Unstated'}</p>
                  <p className="text-zinc-400 font-mono">{selectedCall.callerNumber}</p>
                </div>
                <div>
                  <span className="text-zinc-400">Spam Score:</span>
                  <div className="mt-1">
                    {getDispositionBadge(selectedCall.disposition, selectedCall.spamScore)}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-zinc-400 font-medium">Extracted Intent:</span>
                <p className="mt-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200">
                  {selectedCall.callerIntent}
                </p>
              </div>

              <div>
                <span className="text-zinc-400 font-medium">Call Summary & Transcript:</span>
                <p className="mt-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 italic">
                  {selectedCall.transcriptSummary || 'Transcript logged and encrypted in Stage 1 storage.'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-800/30 text-indigo-300">
                <span className="font-medium">Audio Artifact: </span>
                <span>Encrypted in private S3 bucket. Pre-signed playback URL will activate in Stage 2.</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                onClick={() => setSelectedCall(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
