'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import {
  PhoneForwarded,
  Users,
  Voicemail,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Play,
  AlertCircle,
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

  // Transfer Simulator States
  const [simUtterance, setSimUtterance] = useState('I need to speak to Sales regarding a product pricing quote');
  const [simSpamScore, setSimSpamScore] = useState(15);
  const [simStep, setSimStep] = useState<'idle' | 'routing' | 'announcing' | 'connected' | 'fallback'>('idle');
  const [simResult, setSimResult] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
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
    await acceptTransferApi(transferId);
    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, transfer_status: 'CONNECTED' } : t))
    );
  };

  const handleDeclineTransfer = async (transferId: string) => {
    await declineTransferApi(transferId);
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
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] select-none">
      <Header
        title="Stage 6: Smart Call Forwarding & Intelligent Routing"
        subtitle="Provider-independent routing engine, warm transfers, availability directory, voicemail & callbacks."
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded card-panel">
            <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Directory Recipients</p>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-1 font-mono">{recipients.length}</p>
            <span className="text-[10px] text-[var(--text-muted)]">Active E.164 destinations</span>
          </div>

          <div className="p-4 rounded card-panel">
            <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Active Warm Transfers</p>
            <p className="text-xl font-bold text-[var(--accent-primary)] mt-1 font-mono">{transfers.length}</p>
            <span className="text-[10px] text-[var(--accent-primary)]">Real-time state machine</span>
          </div>

          <div className="p-4 rounded card-panel">
            <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Voicemail Messages</p>
            <p className="text-xl font-bold text-[var(--status-warning)] mt-1 font-mono">{voicemails.length}</p>
            <span className="text-[10px] text-[var(--status-warning)]">Recorded fallback inbox</span>
          </div>

          <div className="p-4 rounded card-panel">
            <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Pending Callbacks</p>
            <p className="text-xl font-bold text-[var(--status-success)] mt-1 font-mono">{callbacks.length}</p>
            <span className="text-[10px] text-[var(--status-success)]">Caller return requests</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2.5">
          <button
            onClick={() => setActiveTab('recipients')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'recipients'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-secondary)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Recipient Directory ({recipients.length})
          </button>

          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'transfers'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-secondary)]'
            }`}
          >
            <PhoneForwarded className="w-3.5 h-3.5" />
            Warm Transfers ({transfers.length})
          </button>

          <button
            onClick={() => setActiveTab('voicemail')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'voicemail'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-secondary)]'
            }`}
          >
            <Voicemail className="w-3.5 h-3.5" />
            Voicemail Inbox ({voicemails.length})
          </button>

          <button
            onClick={() => setActiveTab('callbacks')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'callbacks'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-secondary)]'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Callback Requests ({callbacks.length})
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'simulator'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-secondary)]'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-[var(--status-success)]" />
            Transfer Simulator
          </button>
        </div>

        {/* TAB 1: RECIPIENT DIRECTORY */}
        {activeTab === 'recipients' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recipients.map((rec) => (
              <div key={rec.id} className="p-4 rounded card-panel space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] text-xs">{rec.display_name}</h4>
                    <p className="text-[11px] text-[var(--accent-primary)] font-medium">{rec.role_title || rec.department}</p>
                  </div>
                  <span
                    onClick={() => handleStatusToggle(rec.id, rec.availability_status)}
                    className={`badge-pill cursor-pointer capitalize ${
                      rec.availability_status === 'available'
                        ? 'badge-success'
                        : rec.availability_status === 'busy'
                        ? 'badge-danger'
                        : 'badge-warning'
                    }`}
                  >
                    ● {rec.availability_status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-[var(--text-muted)] font-mono">
                  <p>Destination: {rec.phone_number}</p>
                  <p>Hours: {rec.business_hours_start} - {rec.business_hours_end} ({rec.time_zone})</p>
                </div>

                <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Priority: #{rec.routing_priority}</span>
                  <span>Click status to toggle</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: WARM TRANSFERS */}
        {activeTab === 'transfers' && (
          <div className="space-y-3">
            {transfers.map((t) => (
              <div key={t.id} className="p-4 rounded card-panel space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] text-xs">Target: {t.target_name}</h4>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">{t.target_phone_number} ({t.department})</p>
                  </div>
                  <span className="badge-pill badge-info font-mono">
                    {t.transfer_status}
                  </span>
                </div>

                <p className="p-2.5 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] font-mono">
                  &quot;{t.announcement_text}&quot;
                </p>

                {t.transfer_status === 'AWAITING_ACCEPTANCE' && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleDeclineTransfer(t.id)}
                      className="btn-secondary text-xs inline-flex items-center gap-1 text-[var(--status-danger)]"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Decline
                    </button>
                    <button
                      onClick={() => handleAcceptTransfer(t.id)}
                      className="btn-primary text-xs inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Accept & Bridge
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: VOICEMAIL INBOX */}
        {activeTab === 'voicemail' && (
          <div className="space-y-3">
            {voicemails.map((vm) => (
              <div key={vm.id} className="p-4 rounded card-panel space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[var(--text-primary)]">{vm.caller_name || 'Unknown Caller'}</span>
                  <span className="font-mono text-[var(--text-muted)]">{vm.caller_number}</span>
                </div>
                <p className="p-2.5 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] italic">
                  &quot;{vm.transcript}&quot;
                </p>
                <div className="text-[10px] text-[var(--text-muted)] flex justify-between">
                  <span>Duration: {vm.duration_seconds}s</span>
                  <span>Received: {new Date(vm.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: CALLBACK REQUESTS */}
        {activeTab === 'callbacks' && (
          <div className="space-y-3">
            {callbacks.map((cb) => (
              <div key={cb.id} className="p-4 rounded card-panel space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[var(--text-primary)]">{cb.caller_name} ({cb.caller_number})</span>
                  <span className="badge-pill badge-success">{cb.status}</span>
                </div>
                <p className="text-[var(--text-muted)]">Department: {cb.requested_department}</p>
                <p className="p-2.5 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]">{cb.purpose}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: TRANSFER SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="p-5 rounded card-panel space-y-4">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-[var(--status-success)]" />
              Call Forwarding & Warm Transfer Simulator
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[var(--text-muted)] block mb-1">Simulated Caller Utterance / Purpose</label>
                <input
                  type="text"
                  value={simUtterance}
                  onChange={(e) => setSimUtterance(e.target.value)}
                  className="input-control w-full text-xs"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] block mb-1">Simulated Stage 5 Spam Score (0 - 100)</label>
                <input
                  type="number"
                  value={simSpamScore}
                  onChange={(e) => setSimSpamScore(Number(e.target.value))}
                  className="input-control w-full text-xs font-mono"
                />
              </div>
            </div>

            <button
              onClick={runSimulation}
              className="btn-primary text-xs inline-flex items-center gap-1.5"
            >
              <PhoneForwarded className="w-3.5 h-3.5" />
              Simulate Warm Transfer Flow
            </button>

            {simResult && (
              <div className="p-4 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)]">Simulation Output State: {simStep.toUpperCase()}</span>
                  <span className="badge-pill badge-info font-mono">Action: {simResult.action}</span>
                </div>

                <div className="space-y-1 font-mono text-[var(--text-muted)]">
                  <p>Resolved Target: <span className="text-[var(--text-primary)]">{simResult.recipient_name} ({simResult.phone})</span></p>
                  <p>Department: <span className="text-[var(--text-primary)]">{simResult.department}</span></p>
                  <p>Spam Score Evaluated: <span className="text-[var(--status-warning)]">{simResult.spam_score}/100</span></p>
                </div>

                <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)] font-mono">
                  &quot;{simResult.announcement}&quot;
                </div>

                {simStep === 'announcing' && (
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setSimStep('fallback')}
                      className="btn-secondary text-xs text-[var(--status-danger)]"
                    >
                      Press 2 (Decline)
                    </button>
                    <button
                      onClick={() => setSimStep('connected')}
                      className="btn-primary text-xs"
                    >
                      Press 1 (Accept & Bridge)
                    </button>
                  </div>
                )}

                {simStep === 'connected' && (
                  <div className="p-2.5 rounded badge-success font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Both call legs successfully bridged! Warm transfer completed.
                  </div>
                )}

                {simStep === 'fallback' && (
                  <div className="p-2.5 rounded badge-warning font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
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
