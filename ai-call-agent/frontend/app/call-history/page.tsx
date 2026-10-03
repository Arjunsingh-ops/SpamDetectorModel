'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { CallTable } from '@/components/calls/call-table';
import { fetchCalls, PaginatedCallsResult } from '@/lib/api';
import { FileSpreadsheet, Filter, ChevronLeft, ChevronRight, Search } from 'lucide-react';
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
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
      <Header
        title="Call History & Transcripts Audit"
        subtitle="Complete chronological audit trail of all screened calls, intent summaries, and routing dispositions."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-4">
        {/* Export & Filter Toolbar */}
        <div className="card-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">Enterprise Call Log Audit</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Server-side paginated call records. Total available: {paginatedData.total}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportCSV}
              disabled={!canExport}
              className="btn-secondary text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
              title="Export filtered records to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--status-success)]" />
              Export Audit Log (CSV)
            </button>
          </div>
        </div>

        {/* Server-Side Filtering Control Strip */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 card-panel p-3.5 text-xs">
          <div>
            <label className="text-[var(--text-muted)] block mb-1">Search Caller / Intent</label>
            <input
              type="text"
              placeholder="Search number or intent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-control w-full text-xs"
            />
          </div>

          <div>
            <label className="text-[var(--text-muted)] block mb-1">Call Session Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="input-control w-full text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RINGING">Ringing</option>
              <option value="FLAGGED">Flagged</option>
            </select>
          </div>

          <div>
            <label className="text-[var(--text-muted)] block mb-1">Fraud Shield Disposition</label>
            <select
              value={disposition}
              onChange={(e) => {
                setDisposition(e.target.value);
                setPage(1);
              }}
              className="input-control w-full text-xs"
            >
              <option value="all">All Dispositions</option>
              <option value="legitimate">Legitimate</option>
              <option value="spam">Spam</option>
              <option value="uncertain">Uncertain Screened</option>
            </select>
          </div>

          <div>
            <label className="text-[var(--text-muted)] block mb-1">Call Source Filter</label>
            <button
              type="button"
              onClick={() => {
                setRealOnly(!realOnly);
                setPage(1);
              }}
              className={`w-full py-1.5 px-2.5 rounded border text-xs font-medium flex items-center justify-between transition-colors ${
                realOnly
                  ? 'bg-[var(--accent-primary-subtle)] border-[var(--accent-primary)] text-[var(--accent-primary)]'
                  : 'bg-[var(--bg-surface-secondary)] border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              <span>{realOnly ? 'PSTN Real Only' : 'All (PSTN + Sim)'}</span>
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="btn-primary w-full text-xs py-1.5 flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              Apply Filters
            </button>
          </div>
        </form>

        {/* Calls Table View */}
        <CallTable calls={paginatedData.items} title="All Recorded Call Sessions" showFilters={false} />

        {/* Server-Side Pagination Bar */}
        <div className="flex items-center justify-between card-panel p-3 text-xs text-[var(--text-secondary)]">
          <div>
            Page <span className="font-semibold text-[var(--text-primary)]">{paginatedData.page}</span> of{' '}
            <span className="font-semibold text-[var(--text-primary)]">{paginatedData.pages}</span> ({paginatedData.total} total items)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary text-xs px-2.5 py-1 disabled:opacity-40 inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(paginatedData.pages, p + 1))}
              disabled={page >= paginatedData.pages}
              className="btn-secondary text-xs px-2.5 py-1 disabled:opacity-40 inline-flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
