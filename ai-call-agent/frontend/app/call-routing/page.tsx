'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import {
  PhoneForwarded,
  Users,
  Voicemail,
  PhoneCall,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  AlertCircle,
  ShieldCheck,
  Ban,
  UserCheck,
  RefreshCw,
  Sliders,
  PhoneOff,
} from 'lucide-react';
import {
  fetchRecipients,
  updateRecipientAvailability,
  fetchTransfers,
  acceptTransferApi,
  declineTransferApi,
  fetchVoicemails,
  fetchCallbacks,
} from '@/lib/api';

export default function CallRoutingPage() {
  const [activeTab, setActiveTab] = useState<'recipients' | 'transfers' | 'voicemail' | 'callbacks' | 'simulator'>('recipients');
  const [recipients, setRecipients] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [voicemails, setVoicemails] = useState<any[]>([]);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Transfer Simulator States
  const [simUtterance, setSimUtterance] = useState('I need to speak to Sales regarding a product pricing quote');
  const [simSpamScore, setSimSpamScore] = useState(15);
  const [simStep, setSimStep] = useState<'idle' | 'routing' | 'announcing' | 'connected' | 'fallback'>('idle');
  const [simResult, setSimResult] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [recs, trs, vms, cbs] = await Promise.all([
        fetchRecipients(),
        fetchTransfers(),
        fetchVoicemails(),
        fetchCallbacks(),
      ]);
      setRecipients(recs);
      setTransfers(trs);
      setVoicemails(vms);
      setCallbacks(cbs);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleStatusToggle = async (recipientId: string, currentStatus: string) => {
    const nextStatusMap: Record<string, string> = {
      available: 'busy',
      busy: 'away',
      away: 'dnd',
      dnd: 'offline',
      offline: 'available',
    };
    const nextStatus = nextStatusMap[currentStatus] || 'available';
    await updateRecipientAvailability(recipientId, nextStatus);
    setRecipients((prev) =>
      prev.map((r) => (r.id === recipientId ? { ...r, availability_status: nextStatus } : r))
    );
  };

  const handleAcceptTransfer = async (transferId: string) => {
    const res = await acceptTransferApi(transferId);
    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, transfer_status: 'CONNECTED' } : t))
    );
  };

  const handleDeclineTransfer = async (transferId: string) => {
    const res = await declineTransferApi(transferId);
    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, transfer_status: 'DECLINED' } : t))
    );
  };

  const runSimulation = async () => {
    setSimStep('routing');
    await new Promise((r) => setTimeout(r, 600));

    let recipient = recipients.find((r) => r.department === 'Sales' && r.availability_status === 'available');
    if (!recipient) recipient = recipients[0];

    const ann = `You have an incoming call from Rahul regarding ${simUtterance}. Press 1 to accept or 2 to decline.`;

    setSimResult({
      recipient_name: recipient.display_name,
      department: recipient.department,
      phone: recipient.phone_number,
      announcement: ann,
      spam_score: simSpamScore,
      action: simSpamScore >= 70 ? 'flag_review' : 'transfer_warm',
    });

    if (simSpamScore >= 70) {
      setSimStep('fallback');
    } else {
      setSimStep('announcing');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 text-zinc-100 select-none">
      <Header
        title="Stage 6: Smart Call Forwarding & Intelligent Routing"
        subtitle="Provider-independent routing engine, warm transfers, availability directory, voicemail & callbacks."
      />

      <main className="p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Directory Recipients</p>
            <p className="text-2xl font-bold text-white mt-1">{recipients.length}</p>
            <span className="text-[10px] text-zinc-500">Active E.164 destinations</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Active Warm Transfers</p>
            <p className="text-2xl font-bold text-indigo-400 mt-1">{transfers.length}</p>
            <span className="text-[10px] text-indigo-400/80">Real-time state machine</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Voicemail Messages</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{voicemails.length}</p>
            <span className="text-[10px] text-amber-400/80">Recorded fallback inbox</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Pending Callbacks</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{callbacks.length}</p>
            <span className="text-[10px] text-emerald-400/80">Caller return requests</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab('recipients')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'recipients'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Recipient Directory ({recipients.length})
          </button>

          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'transfers'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <PhoneForwarded className="w-4 h-4" />
            Warm Transfers ({transfers.length})
          </button>

          <button
            onClick={() => setActiveTab('voicemail')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'voicemail'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Voicemail className="w-4 h-4" />
            Voicemail Inbox ({voicemails.length})
          </button>

          <button
            onClick={() => setActiveTab('callbacks')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'callbacks'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            Callback Requests ({callbacks.length})
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Play className="w-4 h-4 text-emerald-400" />
            Transfer Simulator
          </button>
        </div>

        {/* TAB 1: RECIPIENT DIRECTORY */}
        {activeTab === 'recipients' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recipients.map((rec) => (
              <div key={rec.id} className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-white text-sm">{rec.display_name}</h4>
                    <p className="text-xs text-indigo-400 font-medium">{rec.role_title || rec.department}</p>
                  </div>
                  <span
                    onClick={() => handleStatusToggle(rec.id, rec.availability_status)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase cursor-pointer transition-colors ${
                      rec.availability_status === 'available'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : rec.availability_status === 'busy'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    ● {rec.availability_status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-zinc-400 font-mono">
                  <p>Destination: {rec.phone_number}</p>
                  <p>Hours: {rec.business_hours_start} - {rec.business_hours_end} ({rec.time_zone})</p>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Priority: #{rec.routing_priority}</span>
                  <span className="text-zinc-500">Click status to toggle</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: WARM TRANSFERS */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            {transfers.map((t) => (
              <div key={t.id} className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white text-sm">Target: {t.target_name}</h4>
                    <p className="text-xs text-zinc-400 font-mono">{t.target_phone_number} ({t.department})</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                    {t.transfer_status}
                  </span>
                </div>

                <p className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 leading-relaxed font-mono">
                  "{t.announcement_text}"
                </p>

                {t.transfer_status === 'AWAITING_ACCEPTANCE' && (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleDeclineTransfer(t.id)}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Decline Transfer
                    </button>
                    <button
                      onClick={() => handleAcceptTransfer(t.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Accept & Bridge Call
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: VOICEMAIL INBOX */}
        {activeTab === 'voicemail' && (
          <div className="space-y-4">
            {voicemails.map((vm) => (
              <div key={vm.id} className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">{vm.caller_name || 'Unknown Caller'}</span>
                  <span className="font-mono text-zinc-400">{vm.caller_number}</span>
                </div>
                <p className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 leading-relaxed">
                  "{vm.transcript}"
                </p>
                <div className="text-[10px] text-zinc-500 flex justify-between">
                  <span>Duration: {vm.duration_seconds}s</span>
                  <span>Received: {new Date(vm.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: CALLBACK REQUESTS */}
        {activeTab === 'callbacks' && (
          <div className="space-y-4">
            {callbacks.map((cb) => (
              <div key={cb.id} className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">{cb.caller_name} ({cb.caller_number})</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-semibold">{cb.status}</span>
                </div>
                <p className="text-zinc-400">Department: {cb.requested_department}</p>
                <p className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300">{cb.purpose}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: TRANSFER SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              Free Browser Call Forwarding & Warm Transfer Simulator
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Simulated Caller Utterance / Purpose</label>
                <input
                  type="text"
                  value={simUtterance}
                  onChange={(e) => setSimUtterance(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Simulated Stage 5 Spam Score (0 - 100)</label>
                <input
                  type="number"
                  value={simSpamScore}
                  onChange={(e) => setSimSpamScore(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={runSimulation}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors inline-flex items-center gap-2"
            >
              <PhoneForwarded className="w-4 h-4" />
              Simulate Warm Transfer Flow
            </button>

            {simResult && (
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Simulation Output State: {simStep.toUpperCase()}</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono">Action: {simResult.action}</span>
                </div>

                <div className="space-y-1 font-mono text-zinc-400">
                  <p>Resolved Target: <span className="text-white">{simResult.recipient_name} ({simResult.phone})</span></p>
                  <p>Department: <span className="text-white">{simResult.department}</span></p>
                  <p>Spam Score Evaluated: <span className="text-amber-400">{simResult.spam_score}/100</span></p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-200 leading-relaxed font-mono">
                  "{simResult.announcement}"
                </div>

                {simStep === 'announcing' && (
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setSimStep('fallback')}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
                    >
                      Press 2 (Decline)
                    </button>
                    <button
                      onClick={() => setSimStep('connected')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                    >
                      Press 1 (Accept & Bridge)
                    </button>
                  </div>
                )}

                {simStep === 'connected' && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Both call legs successfully bridged! Warm transfer completed.
                  </div>
                )}

                {simStep === 'fallback' && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-300 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Recipient declined / high spam score. Executed Voicemail / Review Fallback.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
