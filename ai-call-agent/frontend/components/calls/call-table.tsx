'use client';

import React, { useState } from 'react';
import { Search, Phone, ShieldCheck, ShieldAlert, HelpCircle, Eye, Clock, X } from 'lucide-react';
import { CallRecord } from '@/types';

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
      return <span className="badge-pill badge-success"><ShieldCheck className="w-3 h-3" /> Legitimate</span>;
    }
    if (disp === 'spam') {
      return <span className="badge-pill badge-danger"><ShieldAlert className="w-3 h-3" /> Spam ({spamScore})</span>;
    }
    return <span className="badge-pill badge-warning"><HelpCircle className="w-3 h-3" /> Screened ({spamScore})</span>;
  };

  const getLanguageChip = (lang: string) => {
    if (lang === 'hi-IN') return <span className="text-[10px] px-2 py-0.5 rounded badge-neutral">Hindi</span>;
    if (lang === 'en-IN') return <span className="text-[10px] px-2 py-0.5 rounded badge-info">English</span>;
    return <span className="text-[10px] px-2 py-0.5 rounded badge-neutral">Hinglish</span>;
  };

  return (
    <div className="card-panel overflow-hidden shadow-sm">
      {/* Header & Filter Controls */}
      <div className="p-4 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">{title}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Total records evaluated: <span className="font-mono text-[var(--accent-primary)] font-semibold">{filteredCalls.length}</span></p>
        </div>

        {showFilters && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search caller, number, intent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-control w-full sm:w-56 text-xs pl-8 py-1.5"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center rounded-md bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] p-0.5 text-xs">
              {['all', 'legitimate', 'spam', 'uncertain'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-2.5 py-1 rounded text-xs capitalize transition-colors font-medium ${
                    filter === tab
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
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
          <thead className="bg-[var(--bg-surface-secondary)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-2.5">Caller Identity</th>
              <th className="px-3 py-2.5">Language</th>
              <th className="px-3 py-2.5">Extracted Intent</th>
              <th className="px-3 py-2.5">Disposition & Risk</th>
              <th className="px-3 py-2.5">Duration</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {filteredCalls.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-[var(--text-muted)]">
                  No matching call records present.
                </td>
              </tr>
            ) : (
              filteredCalls.map((call) => (
                <tr key={call.id} className="hover:bg-[var(--bg-surface-secondary)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[var(--text-primary)]">{call.callerName || 'Unknown Caller'}</div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 font-mono mt-0.5">
                      <Phone className="w-3 h-3" />
                      {call.callerNumber}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {getLanguageChip(call.detectedLanguage)}
                  </td>
                  <td className="px-3 py-3 max-w-xs truncate text-[var(--text-secondary)]">
                    {call.callerIntent || 'No intent recognized'}
                  </td>
                  <td className="px-3 py-3">
                    {getDispositionBadge(call.disposition, call.spamScore)}
                  </td>
                  <td className="px-3 py-3 text-[var(--text-muted)] font-mono">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                      {call.durationSeconds}s
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedCall(call)}
                      className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Inspect
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg card-panel p-5 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Call Details</h4>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">ID: {selectedCall.id}</p>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)]">
                <div>
                  <span className="text-[var(--text-muted)]">Caller Identity:</span>
                  <p className="font-semibold text-[var(--text-primary)]">{selectedCall.callerName || 'Unstated'}</p>
                  <p className="text-[var(--text-muted)] font-mono">{selectedCall.callerNumber}</p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Spam Assessment:</span>
                  <div className="mt-1">
                    {getDispositionBadge(selectedCall.disposition, selectedCall.spamScore)}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[var(--text-muted)] font-medium">Extracted Intent:</span>
                <p className="mt-1 p-2 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                  {selectedCall.callerIntent}
                </p>
              </div>

              <div>
                <span className="text-[var(--text-muted)] font-medium">Call Summary & Transcript:</span>
                <p className="mt-1 p-2 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] italic">
                  {selectedCall.transcriptSummary || 'Transcript logged and evaluated by AI Call Agent.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
              <button
                onClick={() => setSelectedCall(null)}
                className="btn-secondary text-xs"
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
