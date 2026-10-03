'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  fetchRecipients,
  createRecipientApi,
  updateRecipientApi,
  updateRecipientAvailability,
  deleteRecipientApi,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface PageProps {
  onOpenMobileNav?: () => void;
}

export default function RecipientsPage({ onOpenMobileNav }: PageProps) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('recipients_manage');

  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hidePhoneNumbers, setHidePhoneNumbers] = useState<boolean>(false);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingRecipient, setEditingRecipient] = useState<any | null>(null);

  // Form Fields
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('Sales');
  const [roleTitle, setRoleTitle] = useState('Director');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [routingPriority, setRoutingPriority] = useState(1);
  const [hoursStart, setHoursStart] = useState('09:00');
  const [hoursEnd, setHoursEnd] = useState('18:00');
  const [backupRecipient, setBackupRecipient] = useState('');

  const loadRecipients = async () => {
    setLoading(true);
    const data = await fetchRecipients();
    setRecipients(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadRecipients();
  }, []);

  const openAddModal = () => {
    setEditingRecipient(null);
    setDisplayName('');
    setDepartment('Sales');
    setRoleTitle('Executive');
    setPhoneNumber('+91');
    setRoutingPriority(1);
    setHoursStart('09:00');
    setHoursEnd('18:00');
    setBackupRecipient('');
    setShowModal(true);
  };

  const openEditModal = (rec: any) => {
    setEditingRecipient(rec);
    setDisplayName(rec.display_name || rec.displayName);
    setDepartment(rec.department || 'Sales');
    setRoleTitle(rec.role_title || rec.roleTitle || 'Executive');
    setPhoneNumber(rec.phone_number || rec.phoneNumber || '');
    setRoutingPriority(rec.routing_priority || rec.routingPriority || 1);
    setHoursStart(rec.business_hours_start || '09:00');
    setHoursEnd(rec.business_hours_end || '18:00');
    setBackupRecipient(rec.backup_recipient || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !phoneNumber) return;

    const payload = {
      display_name: displayName,
      department,
      role_title: roleTitle,
      phone_number: phoneNumber,
      routing_priority: Number(routingPriority),
      business_hours_start: hoursStart,
      business_hours_end: hoursEnd,
      backup_recipient: backupRecipient,
      time_zone: 'Asia/Kolkata',
    };

    if (editingRecipient) {
      await updateRecipientApi(editingRecipient.id, payload);
    } else {
      await createRecipientApi(payload);
    }
    setShowModal(false);
    loadRecipients();
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextMap: Record<string, string> = {
      available: 'busy',
      busy: 'away',
      away: 'dnd',
      dnd: 'offline',
      offline: 'available',
    };
    const nextStatus = nextMap[currentStatus] || 'available';
    await updateRecipientAvailability(id, nextStatus);
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, availability_status: nextStatus } : r))
    );
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to disable this recipient from active routing?')) {
      await deleteRecipientApi(id);
      setRecipients((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const formatPhone = (num: string) => {
    if (!hidePhoneNumbers) return num;
    if (!num || num.length < 6) return '••••••••';
    return num.slice(0, 3) + '••••' + num.slice(-4);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
      <Header
        title="Recipient Directory & Forwarding Destinations"
        subtitle="Manage verified human operators, departments, backup routing policies, and operating hours."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Action Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)]">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">Verified Routing Destinations</h2>
            <p className="text-xs text-[var(--text-muted)]">Total active E.164 forwarding endpoints: {recipients.length}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setHidePhoneNumbers(!hidePhoneNumbers)}
              className="px-3 py-1.5 rounded-md bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[var(--border-color)] transition-colors"
            >
              {hidePhoneNumbers ? <Eye className="w-3.5 h-3.5 text-[var(--status-success)]" /> : <EyeOff className="w-3.5 h-3.5 text-[var(--status-warning)]" />}
              {hidePhoneNumbers ? 'Show Numbers' : 'Mask PSTN Numbers'}
            </button>

            {canManage && (
              <button
                onClick={openAddModal}
                className="px-3 py-1.5 rounded-md bg-[var(--accent-primary)] hover:opacity-90 text-white text-xs font-medium inline-flex items-center gap-2 transition-all shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Recipient Profile
              </button>
            )}
          </div>
        </div>

        {/* Recipients Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] animate-pulse" />
            ))}
          </div>
        ) : recipients.length === 0 ? (
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] p-8 text-center space-y-3">
            <Users className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
            <p className="text-sm font-medium text-[var(--text-primary)]">No Recipients Configured</p>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Add human agents or call center destinations to handle live call transfers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipients.map((rec) => (
              <div key={rec.id} className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 shadow-sm hover:border-[var(--accent-primary-subtle)] transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)] text-sm">{rec.display_name}</h4>
                    <p className="text-xs text-[var(--accent-primary)] font-medium">{rec.role_title || rec.department} ({rec.department})</p>
                  </div>

                  <button
                    onClick={() => canManage && handleToggleStatus(rec.id, rec.availability_status)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase transition-all ${
                      rec.availability_status === 'available'
                        ? 'bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success)]/30'
                        : rec.availability_status === 'busy'
                        ? 'bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger)]/30'
                        : 'bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning)]/30'
                    }`}
                    title="Click to toggle availability status"
                  >
                    ● {rec.availability_status}
                  </button>
                </div>

                <div className="space-y-1 text-xs text-[var(--text-secondary)] font-mono bg-[var(--bg-surface-secondary)] p-3 rounded-md border border-[var(--border-color)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Destination:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{formatPhone(rec.phone_number)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Business Hours:</span>
                    <span>{rec.business_hours_start} - {rec.business_hours_end}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Routing Priority:</span>
                    <span className="text-[var(--accent-primary)] font-bold">#{rec.routing_priority}</span>
                  </div>
                </div>

                {canManage && (
                  <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
                    <button
                      onClick={() => openEditModal(rec)}
                      className="px-3 py-1 rounded-md bg-[var(--bg-surface-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="p-1.5 rounded-md hover:bg-[var(--status-danger-bg)] text-[var(--text-muted)] hover:text-[var(--status-danger)] transition-colors"
                      title="Disable Recipient"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Recipient Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleSave}
              className="w-full max-w-md rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] p-6 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {editingRecipient ? 'Edit Recipient Configuration' : 'Add New Recipient Destination'}
                </h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[var(--text-secondary)] font-medium block mb-1">Full Display Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Vikram Mehta"
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[var(--text-secondary)] font-medium block mb-1">Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    >
                      <option value="Sales">Sales</option>
                      <option value="Support">Customer Support</option>
                      <option value="Billing">Billing & Accounts</option>
                      <option value="Executive">Executive Leadership</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[var(--text-secondary)] font-medium block mb-1">Role Title</label>
                    <input
                      type="text"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      placeholder="e.g. Sales Director"
                      className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[var(--text-secondary)] font-medium block mb-1">Forwarding Telephone Number (E.164)</label>
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[var(--text-secondary)] font-medium block mb-1">Hours Start</label>
                    <input
                      type="time"
                      value={hoursStart}
                      onChange={(e) => setHoursStart(e.target.value)}
                      className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-[var(--text-secondary)] font-medium block mb-1">Hours End</label>
                    <input
                      type="time"
                      value={hoursEnd}
                      onChange={(e) => setHoursEnd(e.target.value)}
                      className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[var(--text-secondary)] font-medium block mb-1">Routing Priority (1 = Highest)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={routingPriority}
                    onChange={(e) => setRoutingPriority(Number(e.target.value))}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-md bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] font-medium hover:bg-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md bg-[var(--accent-primary)] hover:opacity-90 text-white font-medium shadow-sm"
                >
                  Save Recipient
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

