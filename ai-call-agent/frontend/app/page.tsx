'use client';

import React, { useEffect, useState } from 'react';
import {
  PhoneCall,
  PhoneForwarded,
  ShieldAlert,
  Radio,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { LiveCallSimulator } from '@/components/dashboard/live-simulator';
import { CallTable } from '@/components/calls/call-table';
import { fetchAnalyticsOverview, fetchCalls } from '@/lib/api';
import { CallRecord } from '@/types';
import { useRealtime } from '@/lib/realtime-context';

interface PageProps {
  onOpenMobileNav?: () => void;
}

export default function OverviewPage({ onOpenMobileNav }: PageProps) {
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d'>('today');
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentCalls, setRecentCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const realtime = useRealtime();

  const loadDashboardData = async () => {
    setLoading(true);
    const [anData, callsRes] = await Promise.all([
      fetchAnalyticsOverview(),
      fetchCalls({ page: 1, limit: 10 }),
    ]);
    setAnalytics(anData);
    setRecentCalls(callsRes.items);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
      <Header
        title="Telephony Control Plane Overview"
        subtitle="Real-time KPI metrics, active SIP trunk streams, multi-signal fraud shield, and warm PSTN forwarding."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-4">
        {/* Date Filter & Control Bar */}
        <div className="card-panel p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Calendar className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
            <span className="text-[var(--text-secondary)]">Reporting Window:</span>
            <div className="flex items-center bg-[var(--bg-surface-secondary)] p-0.5 rounded border border-[var(--border-color)]">
              <button
                onClick={() => setDateRange('today')}
                className={`px-2.5 py-1 rounded text-xs transition-colors font-medium ${
                  dateRange === 'today' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateRange('7d')}
                className={`px-2.5 py-1 rounded text-xs transition-colors font-medium ${
                  dateRange === '7d' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateRange('30d')}
                className={`px-2.5 py-1 rounded text-xs transition-colors font-medium ${
                  dateRange === '30d' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Last 30 Days
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-[var(--text-muted)] font-mono bg-[var(--bg-surface-secondary)] px-2.5 py-1 rounded border border-[var(--border-color)]">
              Active SIP Trunks: <span className="text-[var(--status-success)] font-semibold">{realtime.activeCalls.length}</span>
            </span>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="btn-secondary p-1.5"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--accent-primary)]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Primary 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            title="Total Inbound Calls"
            value={analytics?.totalCalls || 0}
            subtitle="Across all DIDs"
            icon={PhoneCall}
            colorScheme="indigo"
            trend={{ value: '+14.2% vs prev', isPositive: true }}
          />
          <KpiCard
            title="Active Live Channels"
            value={realtime.activeCalls.length}
            subtitle="SIP channels streaming live"
            icon={Radio}
            colorScheme="emerald"
            trend={{ value: 'Real-time telemetry', isPositive: true }}
          />
          <KpiCard
            title="Spam / Fraud Intercepted"
            value={analytics?.spamCallsBlocked || 0}
            subtitle="Challenged or blocked"
            icon={ShieldAlert}
            colorScheme="rose"
            trend={{ value: 'Multi-signal shield', isPositive: false }}
          />
          <KpiCard
            title="Forwarding Success Rate"
            value={`${analytics?.forwardingSuccessRate || 96.4}%`}
            subtitle="Warm transferred to staff"
            icon={PhoneForwarded}
            colorScheme="sky"
            trend={{ value: '+2.1% optimization', isPositive: true }}
          />
        </div>

        {/* Secondary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-3 rounded card-panel">
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Answered</span>
            <p className="text-base font-bold text-[var(--status-success)] mt-0.5">{analytics?.answeredCalls || 312}</p>
          </div>

          <div className="p-3 rounded card-panel">
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Missed</span>
            <p className="text-base font-bold text-[var(--status-danger)] mt-0.5">{analytics?.missedCalls || 14}</p>
          </div>

          <div className="p-3 rounded card-panel">
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Review Queue</span>
            <p className="text-base font-bold text-[var(--status-warning)] mt-0.5">{analytics?.flaggedForReview || 18}</p>
          </div>

          <div className="p-3 rounded card-panel">
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Voicemails</span>
            <p className="text-base font-bold text-[var(--accent-primary)] mt-0.5">{analytics?.pendingVoicemails || 3}</p>
          </div>

          <div className="p-3 rounded card-panel">
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Callbacks</span>
            <p className="text-base font-bold text-[var(--status-info)] mt-0.5">{analytics?.pendingCallbacks || 2}</p>
          </div>

          <div className="p-3 rounded card-panel">
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Avg Duration</span>
            <p className="text-base font-bold text-[var(--text-primary)] mt-0.5">{analytics?.avgDurationSeconds || 94}s</p>
          </div>
        </div>

        {/* Free Simulator Lab Component */}
        <LiveCallSimulator />

        {/* Recent Inbound Calls Audit Table */}
        <CallTable calls={recentCalls} title="Live Telephony Sessions Log" showFilters={true} />
      </main>
    </div>
  );
}
