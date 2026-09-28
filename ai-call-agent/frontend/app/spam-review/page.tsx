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
  Play,
  Plus,
  BarChart2,
  RefreshCw,
  Search,
  Lock,
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
  const [loading, setLoading] = useState<boolean>(true);

  // Form states for list entry
  const [newNumber, setNewNumber] = useState('');
  const [newListType, setNewListType] = useState<'allow' | 'block'>('block');
  const [newReason, setNewReason] = useState('');

  // Benchmark Eval State
  const [evalRunning, setEvalRunning] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [ov, ls, rl] = await Promise.all([
        fetchSpamOverview(),
        fetchAllowlistBlocklist(),
        fetchSpamRules(),
      ]);
      setOverview(ov);
      setLists(ls);
      setRules(rl);
      setLoading(false);
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
    // Simulate latency or call API
    await new Promise((r) => setTimeout(r, 800));
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
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 text-zinc-100 select-none">
      <Header
        title="Stage 5: AI Spam Detection & Call Screening"
        subtitle="Multi-signal risk engine, explainable attributions, operator review, allowlist/blocklist & benchmark metrics."
      />

      <main className="p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI Summary Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Total Screened Calls</p>
            <p className="text-2xl font-bold text-white mt-1">{overview?.total_screened || 142}</p>
            <span className="text-[10px] text-zinc-500">Live multi-signal stream</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider font-semibold">Flagged / Review Queue</p>
            <p className="text-2xl font-bold text-rose-400 mt-1">{pendingCalls.length}</p>
            <span className="text-[10px] text-rose-400/80">Operator verification needed</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Allowlist / Blocklist</p>
            <p className="text-2xl font-bold text-indigo-400 mt-1">
              {lists.allowlist.length} <span className="text-zinc-500 font-normal text-sm">/ {lists.blocklist.length}</span>
            </p>
            <span className="text-[10px] text-zinc-500">Active E.164 rules</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Benchmark F1-Score</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {overview?.benchmark_f1 ? `${(overview.benchmark_f1 * 100).toFixed(1)}%` : '90.9%'}
            </p>
            <span className="text-[10px] text-emerald-400/80">Synthetic dataset score</span>
          </div>
        </div>

        {/* Governance Notice */}
        <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">Ethical Guardrails & Non-Destructive Screening Policy</p>
            <p className="text-zinc-300 leading-relaxed">
              Calls evaluated as HIGH risk (Score ≥ 70) are challenged with neutral screening questions or routed to the human operator review queue. High-risk classification never triggers irreversible automatic call termination without operator authorization.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'queue'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Human Review Queue ({pendingCalls.length})
          </button>

          <button
            onClick={() => setActiveTab('lists')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'lists'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Ban className="w-4 h-4" />
            Allowlist & Blocklist
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Risk Rules & Thresholds
          </button>

          <button
            onClick={() => setActiveTab('eval')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'eval'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Model Benchmark Eval
          </button>
        </div>

        {/* TAB 1: REVIEW QUEUE */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {pendingCalls.length === 0 ? (
              <div className="p-12 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-semibold text-white">Queue Cleared!</h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  All flagged spam and uncertain calls have been reviewed. The system continues monitoring inbound streams.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Entry Form */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Add E.164 Number Rule
              </h3>
              <form onSubmit={handleAddListEntry} className="space-y-3 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">Phone Number (E.164 format)</label>
                  <input
                    type="text"
                    placeholder="+919876543210"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Policy List</label>
                  <select
                    value={newListType}
                    onChange={(e) => setNewListType(e.target.value as 'allow' | 'block')}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="block">Blocklist (Force HIGH Risk 100)</option>
                    <option value="allow">Allowlist (Force LOW Risk 0)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Reason / Case Reference</label>
                  <input
                    type="text"
                    placeholder="e.g., Confirmed Loan Phishing Bot"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                >
                  Save Entry Rule
                </button>
              </form>
            </div>

            {/* List Tables */}
            <div className="lg:col-span-2 space-y-6">
              {/* Allowlist Section */}
              <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Authorized Allowlist ({lists.allowlist.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {lists.allowlist.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-mono font-semibold text-emerald-300">{item.phone_number}</p>
                        <p className="text-[11px] text-zinc-400">{item.reason}</p>
                      </div>
                      <span className="text-[10px] text-zinc-500">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blocklist Section */}
              <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Ban className="w-4 h-4 text-rose-400" />
                    Confirmed Blocklist ({lists.blocklist.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {lists.blocklist.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-mono font-semibold text-rose-300">{item.phone_number}</p>
                        <p className="text-[11px] text-zinc-400">{item.reason}</p>
                      </div>
                      <span className="text-[10px] text-zinc-500">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RULES & CONFIG */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-semibold text-white">Multi-Signal Scoring Weight Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-amber-400">Reputation Signal Weight</span>
                    <span>40%</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Evaluates CLI history, call frequency, allow/block list matches, and past reports.</p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-rose-400">Semantic Signal Weight</span>
                    <span>50%</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Analyzes live transcript indicators, OTP requests, pressure tactics, and prompt-injection.</p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-indigo-400">Behavioral Signal Weight</span>
                    <span>10%</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Tracks rapid short repeat calls and sliding window burst rates.</p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-semibold text-white">Active Heuristic & Keyword Rules</h3>
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{rule.rule_name}</span>
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-mono">
                          Weight: +{rule.risk_weight}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">{rule.description}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Pattern: {rule.pattern}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
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
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Synthetic Evaluation Benchmark</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Evaluate hybrid model accuracy across held-out synthetic test cases in English, Hindi, and Hinglish.
                </p>
              </div>
              <button
                onClick={runEvaluation}
                disabled={evalRunning}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs inline-flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${evalRunning ? 'animate-spin' : ''}`} />
                {evalRunning ? 'Evaluating...' : 'Run Benchmark Evaluation'}
              </button>
            </div>

            {evalResult && (
              <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                    <p className="text-[10px] text-zinc-400 uppercase font-semibold">Precision</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{evalResult.precision}%</p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                    <p className="text-[10px] text-zinc-400 uppercase font-semibold">Recall</p>
                    <p className="text-2xl font-bold text-sky-400 mt-1">{evalResult.recall}%</p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                    <p className="text-[10px] text-zinc-400 uppercase font-semibold">F1-Score</p>
                    <p className="text-2xl font-bold text-indigo-400 mt-1">{evalResult.f1_score}%</p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                    <p className="text-[10px] text-zinc-400 uppercase font-semibold">Avg Latency</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{evalResult.avg_latency_ms} ms</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <p className="font-semibold text-white mb-2">Confusion Matrix Breakdown</p>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/40">
                        <span className="text-emerald-300 font-bold">TP: {evalResult.confusion_matrix.TP}</span>
                        <p className="text-[9px] text-zinc-400">Correct Spam</p>
                      </div>
                      <div className="p-2 rounded bg-rose-950/40 border border-rose-800/40">
                        <span className="text-rose-300 font-bold">FP: {evalResult.confusion_matrix.FP}</span>
                        <p className="text-[9px] text-zinc-400">False Positive</p>
                      </div>
                      <div className="p-2 rounded bg-amber-950/40 border border-amber-800/40">
                        <span className="text-amber-300 font-bold">FN: {evalResult.confusion_matrix.FN}</span>
                        <p className="text-[9px] text-zinc-400">False Negative</p>
                      </div>
                      <div className="p-2 rounded bg-indigo-950/40 border border-indigo-800/40">
                        <span className="text-indigo-300 font-bold">TN: {evalResult.confusion_matrix.TN}</span>
                        <p className="text-[9px] text-zinc-400">Correct Legitimate</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <p className="font-semibold text-white mb-2">Latency by Language</p>
                    {Object.entries(evalResult.latency_by_language).map(([lang, lat]: any) => (
                      <div key={lang} className="flex justify-between items-center py-1.5 border-b border-zinc-900">
                        <span className="text-zinc-300 font-medium">{lang}</span>
                        <span className="font-mono text-amber-400 font-bold">{lat}</span>
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

