'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { CallTable } from '@/components/calls/call-table';
import { fetchCalls, FetchCallsParams, PaginatedCallsResult } from '@/lib/api';
import { CallRecord } from '@/types';
import { FileSpreadsheet, Filter, ChevronLeft, ChevronRight, Search, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface PageProps {
  onOpenMobileNav?: () => void;
}

export default function CallHistoryPage({ onOpenMobileNav }: PageProps) {
  const { hasPermission } = useAuth();
  const canExport = hasPermission('call_history_export');

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [status, setStatus] = useState<string>('all');
  const [disposition, setDisposition] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [realOnly, setRealOnly] = useState<boolean>(false);

  const [paginatedData, setPaginatedData] = useState<PaginatedCallsResult>({
    items: [],
    total: 0,
    page: 1,
    limit: 15,
    pages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    const res = await fetchCalls({
      page,
      limit,
      status: status !== 'all' ? status : undefined,
      disposition: disposition !== 'all' ? disposition : undefined,
      search: search.trim() || undefined,
      realOnly,
    });
    setPaginatedData(res);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [page, status, disposition, realOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const exportCSV = () => {
    const headers = ['ID', 'External SID', 'Caller Number', 'Recipient Number', 'Status', 'Disposition', 'Language', 'Duration (s)', 'Spam Score', 'Intent'];
    const rows = paginatedData.items.map((c) => [
      c.id,
      c.externalCallSid,
      `"${c.callerNumber}"`,
      `"${c.recipientNumber}"`,
      c.status,
      c.disposition,
      c.detectedLanguage,
      c.durationSeconds,
      c.spamScore,
      `"${(c.callerIntent || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `call_audit_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        title="Call History & Transcripts Audit"
        subtitle="Complete chronological audit trail of all screened calls, intent summaries, and routing dispositions."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Export & Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Enterprise Call Log Audit</h2>
            <p className="text-xs text-zinc-400">Server-side paginated call records. Total available: {paginatedData.total}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportCSV}
              disabled={!canExport}
              className="px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50"
              title="Export filtered records to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Export Audit Log (CSV)
            </button>
          </div>
        </div>

        {/* Server-Side Filtering Control Strip */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1">Search Caller / Intent</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search number or intent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Call Session Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RINGING">Ringing</option>
              <option value="FLAGGED">Flagged</option>
            </select>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Fraud Shield Disposition</label>
            <select
              value={disposition}
              onChange={(e) => {
                setDisposition(e.target.value);
                setPage(1);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Dispositions</option>
              <option value="legitimate">Legitimate</option>
              <option value="spam">Spam</option>
              <option value="uncertain">Uncertain Screened</option>
            </select>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Call Source Filter</label>
            <button
              type="button"
              onClick={() => {
                setRealOnly(!realOnly);
                setPage(1);
              }}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors ${
                realOnly
                  ? 'bg-indigo-950 border-indigo-700 text-indigo-200'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300'
              }`}
            >
              <span>{realOnly ? 'PSTN Real Only' : 'All (PSTN + Sim)'}</span>
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              Apply Filters
            </button>
          </div>
        </form>

        {/* Calls Table View */}
        <CallTable calls={paginatedData.items} title="All Recorded Call Sessions" showFilters={false} />

        {/* Server-Side Pagination Bar */}
        <div className="flex items-center justify-between bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 text-xs text-zinc-300">
          <div>
            Page <span className="font-bold text-white">{paginatedData.page}</span> of{' '}
            <span className="font-bold text-white">{paginatedData.pages}</span> ({paginatedData.total} total items)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-200 disabled:opacity-40 inline-flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(paginatedData.pages, p + 1))}
              disabled={page >= paginatedData.pages}
              className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-200 disabled:opacity-40 inline-flex items-center gap-1 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
