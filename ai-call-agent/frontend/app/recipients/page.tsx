'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  X,
  Sliders,
  AlertCircle,
  Eye,
  EyeOff,
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
  const { hasPermission, role } = useAuth();
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
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        title="Recipient Directory & Forwarding Destinations"
        subtitle="Manage verified human operators, departments, backup routing policies, and operating hours."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Action Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Verified Routing Destinations</h2>
            <p className="text-xs text-zinc-400">Total active E.164 forwarding endpoints: {recipients.length}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setHidePhoneNumbers(!hidePhoneNumbers)}
              className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              {hidePhoneNumbers ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-amber-400" />}
              {hidePhoneNumbers ? 'Show Numbers' : 'Mask PSTN Numbers'}
            </button>

            {canManage && (
              <button
                onClick={openAddModal}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Add Recipient Profile
              </button>
            )}
          </div>
        </div>

        {/* Recipients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipients.map((rec) => (
            <div key={rec.id} className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{rec.display_name}</h4>
                  <p className="text-xs text-indigo-400 font-medium">{rec.role_title || rec.department} ({rec.department})</p>
                </div>

                <span
                  onClick={() => canManage && handleToggleStatus(rec.id, rec.availability_status)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase cursor-pointer transition-all ${
                    rec.availability_status === 'available'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : rec.availability_status === 'busy'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                  title="Click to toggle availability status"
                >
                  ● {rec.availability_status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-300 font-mono bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Destination:</span>
                  <span className="font-semibold text-white">{formatPhone(rec.phone_number)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Business Hours:</span>
                  <span>{rec.business_hours_start} - {rec.business_hours_end}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Routing Priority:</span>
                  <span className="text-indigo-300">#{rec.routing_priority}</span>
                </div>
              </div>

              {canManage && (
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <button
                    onClick={() => openEditModal(rec)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(rec.id)}
                    className="p-1.5 rounded-xl bg-zinc-800 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 transition-colors"
                    title="Disable Recipient"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add/Edit Recipient Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleSave}
              className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white">
                  {editingRecipient ? 'Edit Recipient Configuration' : 'Add New Recipient Destination'}
                </h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Full Display Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Vikram Mehta"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 block mb-1">Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Sales">Sales</option>
                      <option value="Support">Customer Support</option>
                      <option value="Billing">Billing & Accounts</option>
                      <option value="Executive">Executive Leadership</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Role Title</label>
                    <input
                      type="text"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      placeholder="e.g. Sales Director"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Forwarding Telephone Number (E.164)</label>
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 block mb-1">Hours Start</label>
                    <input
                      type="time"
                      value={hoursStart}
                      onChange={(e) => setHoursStart(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Hours End</label>
                    <input
                      type="time"
                      value={hoursEnd}
                      onChange={(e) => setHoursEnd(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Routing Priority (1 = Highest)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={routingPriority}
                    onChange={(e) => setRoutingPriority(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
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
