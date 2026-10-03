'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import {
  PhoneCall,
  CheckCircle2,
  Search,
  MessageSquare,
} from 'lucide-react';
import { fetchCallbacks, updateCallbackStatusApi, fetchUsersApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface PageProps {
  onOpenMobileNav?: () => void;
}

export default function CallbacksPage({ onOpenMobileNav }: PageProps) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('callbacks_manage');

  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  // Note Modal
  const [selectedCb, setSelectedCb] = useState<any | null>(null);
  const [noteText, setNoteText] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [cbs, usrs] = await Promise.all([fetchCallbacks(), fetchUsersApi()]);
    setCallbacks(cbs || []);
    setUsers(usrs || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateCallbackStatusApi(id, newStatus);
    setCallbacks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCb || !noteText.trim()) return;
    await updateCallbackStatusApi(selectedCb.id, selectedCb.status, noteText.trim());
    setCallbacks((prev) =>
      prev.map((c) => (c.id === selectedCb.id ? { ...c, notes: noteText.trim() } : c))
    );
    setSelectedCb(null);
    setNoteText('');
  };

  const filteredCallbacks = callbacks.filter((cb) => {
    if (statusFilter !== 'all' && cb.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (cb.caller_name || '').toLowerCase().includes(q);
      const matchNumber = (cb.caller_number || '').toLowerCase().includes(q);
      const matchPurpose = (cb.purpose || '').toLowerCase().includes(q);
      return matchName || matchNumber || matchPurpose;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
      <Header
        title="Callback Requests & Follow-up Queue"
        subtitle="Manage caller return requests, operator assignments, callback notes, and fulfillment state."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-[var(--status-success)]" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">Pending Return Requests</h2>
              <p className="text-xs text-[var(--text-muted)]">Total requests logged: {callbacks.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="relative w-60">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search caller or purpose..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md pl-9 pr-3 py-1.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Callbacks List */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] animate-pulse" />
              ))}
            </div>
          ) : filteredCallbacks.length === 0 ? (
            <div className="p-12 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[var(--status-success)] mx-auto" />
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">No Callback Requests</h4>
              <p className="text-xs text-[var(--text-muted)]">All caller callback requests have been resolved.</p>
            </div>
          ) : (
            filteredCallbacks.map((cb) => (
              <div key={cb.id} className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3 text-xs shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-[var(--text-primary)] text-sm">{cb.caller_name}</h4>
                      <span className="font-mono text-[var(--text-muted)]">({cb.caller_number})</span>
                    </div>
                    <p className="text-[var(--text-muted)] mt-0.5">
                      Requested Department: <span className="text-[var(--accent-primary)] font-semibold">{cb.requested_department || 'General'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={cb.status}
                      disabled={!canManage}
                      onChange={(e) => handleStatusChange(cb.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-md border text-xs font-medium uppercase ${
                        cb.status === 'completed'
                          ? 'bg-[var(--status-success-bg)] border-[var(--status-success)]/30 text-[var(--status-success)]'
                          : cb.status === 'in_progress'
                          ? 'bg-[var(--accent-primary-subtle)] border-[var(--accent-primary)]/30 text-[var(--accent-primary)]'
                          : 'bg-[var(--status-warning-bg)] border-[var(--status-warning)]/30 text-[var(--status-warning)]'
                      }`}
                    >
                      <option value="pending">● Pending</option>
                      <option value="in_progress">● In Progress</option>
                      <option value="completed">● Completed</option>
                      <option value="cancelled">● Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <span className="text-[var(--text-muted)] font-semibold block mb-1">Stated Purpose:</span>
                  <p className="p-3 rounded-md bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] leading-relaxed font-mono">
                    "{cb.purpose}"
                  </p>
                </div>

                {cb.notes && (
                  <div className="p-3 rounded-md bg-[var(--accent-primary-subtle)] border border-[var(--accent-primary)]/30 text-[var(--text-primary)]">
                    <span className="font-semibold block mb-0.5">Operator Notes:</span>
                    <p className="font-mono text-[11px]">{cb.notes}</p>
                  </div>
                )}

                <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[var(--text-muted)] font-mono text-[11px]">
                  <span>Requested: {new Date(cb.created_at).toLocaleString()}</span>
                  {canManage && (
                    <button
                      onClick={() => {
                        setSelectedCb(cb);
                        setNoteText(cb.notes || '');
                      }}
                      className="text-[var(--accent-primary)] hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Add Notes
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Note Modal */}
        {selectedCb && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleAddNote} className="w-full max-w-md rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] p-6 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Add Callback Note</h3>
                <button type="button" onClick={() => setSelectedCb(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
              </div>

              <div>
                <label className="text-[var(--text-secondary)] font-medium block mb-1">Operator Fulfillment Note</label>
                <textarea
                  rows={4}
                  required
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g. Called back at 4:30 PM. Scheduled follow up product demo."
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md p-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                <button type="button" onClick={() => setSelectedCb(null)} className="px-3 py-1.5 rounded-md bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] font-medium hover:bg-[var(--border-color)]">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 rounded-md bg-[var(--accent-primary)] hover:opacity-90 text-white font-medium shadow-sm">
                  Save Note
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

