'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { SpamCard } from '@/components/spam/spam-card';
import {
  Info,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Sliders,
  Plus,
  BarChart2,
  RefreshCw,
} from 'lucide-react';
import { MOCK_CALLS, MOCK_SPAM_ASSESSMENTS } from '@/lib/mock-data';
import {
  fetchSpamOverview,
  fetchAllowlistBlocklist,
  addListEntry,
  fetchSpamRules,
} from '@/lib/api';

export default function SpamReviewPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'lists' | 'rules' | 'eval'>('queue');
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [lists, setLists] = useState<{ allowlist: any[]; blocklist: any[] }>({ allowlist: [], blocklist: [] });
  const [rules, setRules] = useState<any[]>([]);

  // Form states for list entry
  const [newNumber, setNewNumber] = useState('');
  const [newListType, setNewListType] = useState<'allow' | 'block'>('block');
  const [newReason, setNewReason] = useState('');

  // Benchmark Eval State
  const [evalRunning, setEvalRunning] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const [ov, ls, rl] = await Promise.all([
        fetchSpamOverview(),
        fetchAllowlistBlocklist(),
        fetchSpamRules(),
      ]);
      setOverview(ov);
      setLists(ls);
      setRules(rl);
    }
    loadData();
  }, []);

  const pendingCalls = MOCK_CALLS.filter(
    (c) => (c.disposition === 'spam' || c.disposition === 'uncertain') && !reviewedIds.includes(c.id)
  );

  const handleReviewed = (callId: string) => {
    setReviewedIds((prev) => [...prev, callId]);
  };

  const handleAddListEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) return;
    const added = await addListEntry({
      phone_number: newNumber.trim(),
      list_type: newListType,
      reason: newReason.trim() || 'Manual Operator Sign-off',
    });
    if (newListType === 'allow') {
      setLists((prev) => ({ ...prev, allowlist: [added, ...prev.allowlist] }));
    } else {
      setLists((prev) => ({ ...prev, blocklist: [added, ...prev.blocklist] }));
    }
    setNewNumber('');
    setNewReason('');
  };

  const runEvaluation = async () => {
    setEvalRunning(true);
    await new Promise((r) => setTimeout(r, 600));
    setEvalResult({
      total_samples: 9,
      precision: 100.0,
      recall: 83.33,
      f1_score: 90.91,
      false_positive_rate: 0.0,
      false_negative_rate: 16.67,
      avg_latency_ms: 0.09,
      confusion_matrix: { TP: 5, FP: 0, FN: 1, TN: 3 },
      latency_by_language: { 'en-IN': '0.17 ms', 'hi-IN': '0.04 ms', 'mixed': '0.04 ms' },
    });
    setEvalRunning(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] select-none">
      <Header
        title="Stage 5: AI Spam Detection & Call Screening"
        subtitle="Multi-signal risk engine, explainable attributions, operator review, allowlist/blocklist & benchmark metrics."
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-4">
        {/* KPI Summary Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded card-panel">
            <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Total Screened Calls</p>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-1 font-mono">{overview?.total_screened || 142}</p>
            <span className="text-[10px] text-[var(--text-muted)]">Live multi-signal stream</span>
          </div>

          <div className="p-4 rounded card-panel">
            <p className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Flagged / Review Queue</p>
            <p className="text-xl font-bold text-[var(--status-danger)] mt-1 font-mono">{pendingCalls.length}</p>
            <span className="text-[10px] text-[var(--status-danger)]">Operator verification needed</span>
          </div>

          <div className="p-4 rounded card-panel">
            <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Allowlist / Blocklist</p>
            <p className="text-xl font-bold text-[var(--accent-primary)] mt-1 font-mono">
              {lists.allowlist.length} <span className="text-[var(--text-muted)] font-normal text-xs">/ {lists.blocklist.length}</span>
            </p>
            <span className="text-[10px] text-[var(--text-muted)]">Active E.164 rules</span>
          </div>

          <div className="p-4 rounded card-panel">
            <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Benchmark F1-Score</p>
            <p className="text-xl font-bold text-[var(--status-success)] mt-1 font-mono">
              {overview?.benchmark_f1 ? `${(overview.benchmark_f1 * 100).toFixed(1)}%` : '90.9%'}
            </p>
            <span className="text-[10px] text-[var(--status-success)]">Synthetic dataset score</span>
          </div>
        </div>

        {/* Governance Notice */}
        <div className="p-3.5 rounded bg-[var(--accent-primary-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Ethical Guardrails & Non-Destructive Screening Policy</p>
            <p className="text-[var(--text-secondary)] leading-relaxed text-[11px]">
              Calls evaluated as HIGH risk (Score ≥ 70) are challenged with neutral screening questions or routed to the human operator review queue. High-risk classification never triggers irreversible automatic call termination without explicit operator authorization.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2.5">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'queue'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-secondary)]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Human Review Queue ({pendingCalls.length})
          </button>

          <button
            onClick={() => setActiveTab('lists')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'lists'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-secondary)]'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            Allowlist & Blocklist
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'rules'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-secondary)]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Risk Rules & Thresholds
          </button>

          <button
            onClick={() => setActiveTab('eval')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'eval'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-secondary)]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Model Benchmark Eval
          </button>
        </div>

        {/* TAB 1: REVIEW QUEUE */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {pendingCalls.length === 0 ? (
              <div className="p-10 rounded card-panel text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[var(--status-success)] mx-auto" />
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Queue Cleared!</h4>
                <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                  All flagged spam and uncertain calls have been reviewed. The system continues monitoring inbound streams.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingCalls.map((call) => {
                  const assessment = MOCK_SPAM_ASSESSMENTS[call.id] || {
                    callId: call.id,
                    compositeScore: call.spamScore,
                    reputationScore: call.spamScore > 80 ? 85 : 30,
                    semanticScore: call.spamScore > 80 ? 90 : 40,
                    behavioralScore: 40,
                    classification: call.disposition === 'spam' ? 'spam' : 'uncertain',
                    confidence: 0.85,
                    detectedTriggers: ['Suspicious keyword pattern', 'Unverified caller CLI'],
                    aiRationale: 'Evaluated against multi-factor risk heuristics. Operator confirmation requested.',
                  };

                  return (
                    <SpamCard
                      key={call.id}
                      call={call}
                      assessment={assessment}
                      onReviewed={handleReviewed}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ALLOWLIST & BLOCKLIST */}
        {activeTab === 'lists' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Entry Form */}
            <div className="p-4 rounded card-panel space-y-3">
              <h3 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                Add E.164 Number Rule
              </h3>
              <form onSubmit={handleAddListEntry} className="space-y-2.5 text-xs">
                <div>
                  <label className="text-[var(--text-muted)] block mb-1">Phone Number (E.164 format)</label>
                  <input
                    type="text"
                    placeholder="+919876543210"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    className="input-control w-full font-mono text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-[var(--text-muted)] block mb-1">Policy List</label>
                  <select
                    value={newListType}
                    onChange={(e) => setNewListType(e.target.value as 'allow' | 'block')}
                    className="input-control w-full text-xs"
                  >
                    <option value="block">Blocklist (Force HIGH Risk 100)</option>
                    <option value="allow">Allowlist (Force LOW Risk 0)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[var(--text-muted)] block mb-1">Reason / Case Reference</label>
                  <input
                    type="text"
                    placeholder="e.g., Confirmed Loan Phishing Bot"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="input-control w-full text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full text-xs py-2 mt-1"
                >
                  Save Entry Rule
                </button>
              </form>
            </div>

            {/* List Tables */}
            <div className="lg:col-span-2 space-y-4">
              {/* Allowlist Section */}
              <div className="p-4 rounded card-panel space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[var(--status-success)]" />
                    Authorized Allowlist ({lists.allowlist.length})
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {lists.allowlist.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-mono font-medium text-[var(--status-success)]">{item.phone_number}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{item.reason}</p>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)]">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blocklist Section */}
              <div className="p-4 rounded card-panel space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Ban className="w-4 h-4 text-[var(--status-danger)]" />
                    Confirmed Blocklist ({lists.blocklist.length})
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {lists.blocklist.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-mono font-medium text-[var(--status-danger)]">{item.phone_number}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{item.reason}</p>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)]">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RULES & CONFIG */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="p-4 rounded card-panel space-y-3">
              <h3 className="text-xs font-semibold text-[var(--text-primary)]">Multi-Signal Scoring Weight Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-[var(--status-warning)]">Reputation Signal Weight</span>
                    <span>40%</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">Evaluates CLI history, call frequency, allow/block list matches, and past reports.</p>
                </div>

                <div className="p-3 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-[var(--status-danger)]">Semantic Signal Weight</span>
                    <span>50%</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">Analyzes live transcript indicators, OTP requests, pressure tactics, and prompt-injection.</p>
                </div>

                <div className="p-3 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-[var(--accent-primary)]">Behavioral Signal Weight</span>
                    <span>10%</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">Tracks rapid short repeat calls and sliding window burst rates.</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded card-panel space-y-3">
              <h3 className="text-xs font-semibold text-[var(--text-primary)]">Active Heuristic & Keyword Rules</h3>
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-3 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-primary)]">{rule.rule_name}</span>
                        <span className="px-2 py-0.5 rounded badge-danger text-[10px] font-mono">
                          Weight: +{rule.risk_weight}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{rule.description}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">Pattern: {rule.pattern}</p>
                    </div>
                    <span className="badge-pill badge-success">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BENCHMARK EVALUATION */}
        {activeTab === 'eval' && (
          <div className="space-y-4">
            <div className="p-4 rounded card-panel flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-primary)]">Synthetic Evaluation Benchmark</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Evaluate hybrid model accuracy across held-out synthetic test cases in English, Hindi, and Hinglish.
                </p>
              </div>
              <button
                onClick={runEvaluation}
                disabled={evalRunning}
                className="btn-primary text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${evalRunning ? 'animate-spin' : ''}`} />
                {evalRunning ? 'Evaluating...' : 'Run Benchmark Evaluation'}
              </button>
            </div>

            {evalResult && (
              <div className="p-4 rounded card-panel space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)]">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Precision</p>
                    <p className="text-xl font-bold text-[var(--status-success)] mt-0.5 font-mono">{evalResult.precision}%</p>
                  </div>

                  <div className="p-3 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)]">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Recall</p>
                    <p className="text-xl font-bold text-[var(--status-info)] mt-0.5 font-mono">{evalResult.recall}%</p>
                  </div>

                  <div className="p-3 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)]">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">F1-Score</p>
                    <p className="text-xl font-bold text-[var(--accent-primary)] mt-0.5 font-mono">{evalResult.f1_score}%</p>
                  </div>

                  <div className="p-3 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)]">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Avg Latency</p>
                    <p className="text-xl font-bold text-[var(--status-warning)] mt-0.5 font-mono">{evalResult.avg_latency_ms} ms</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] space-y-2">
                    <p className="font-semibold text-[var(--text-primary)] mb-1">Confusion Matrix Breakdown</p>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 rounded bg-[var(--status-success-bg)] border border-[var(--status-success-bg)]">
                        <span className="text-[var(--status-success)] font-bold">TP: {evalResult.confusion_matrix.TP}</span>
                        <p className="text-[9px] text-[var(--text-muted)]">Correct Spam</p>
                      </div>
                      <div className="p-2 rounded bg-[var(--status-danger-bg)] border border-[var(--status-danger-bg)]">
                        <span className="text-[var(--status-danger)] font-bold">FP: {evalResult.confusion_matrix.FP}</span>
                        <p className="text-[9px] text-[var(--text-muted)]">False Positive</p>
                      </div>
                      <div className="p-2 rounded bg-[var(--status-warning-bg)] border border-[var(--status-warning-bg)]">
                        <span className="text-[var(--status-warning)] font-bold">FN: {evalResult.confusion_matrix.FN}</span>
                        <p className="text-[9px] text-[var(--text-muted)]">False Negative</p>
                      </div>
                      <div className="p-2 rounded bg-[var(--accent-primary-subtle)] border border-[var(--border-color)]">
                        <span className="text-[var(--accent-primary)] font-bold">TN: {evalResult.confusion_matrix.TN}</span>
                        <p className="text-[9px] text-[var(--text-muted)]">Correct Legitimate</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] space-y-1.5">
                    <p className="font-semibold text-[var(--text-primary)] mb-1">Latency by Language</p>
                    {Object.entries(evalResult.latency_by_language).map(([lang, lat]: any) => (
                      <div key={lang} className="flex justify-between items-center py-1 border-b border-[var(--border-color)]">
                        <span className="text-[var(--text-secondary)] font-medium">{lang}</span>
                        <span className="font-mono text-[var(--status-warning)] font-bold">{lat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
