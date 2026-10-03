'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { UserPlus, ShieldCheck, UserCheck, Eye, Trash2, Lock } from 'lucide-react';
import { fetchUsersApi, createUserApi, deactivateUserApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface PageProps {
  onOpenMobileNav?: () => void;
}

export default function UserManagementPage({ onOpenMobileNav }: PageProps) {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('receptionist');

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetchUsersApi();
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;
    const added = await createUserApi({
      email: newEmail.trim(),
      fullName: newName.trim(),
      role: newRole,
    });
    setUsers([added, ...users]);
    setNewEmail('');
    setNewName('');
    setShowAddModal(false);
  };

  const handleDeactivate = async (id: string) => {
    if (confirm('Deactivate user account access?')) {
      await deactivateUserApi(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: 'inactive', isActive: false } : u))
      );
    }
  };

  const getRoleBadge = (r: string) => {
    if (r === 'admin') return <span className="px-2 py-0.5 rounded-full bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger)]/30 text-[10px] font-semibold uppercase">Admin</span>;
    if (r === 'operator') return <span className="px-2 py-0.5 rounded-full bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 text-[10px] font-semibold uppercase">Operator</span>;
    if (r === 'receptionist') return <span className="px-2 py-0.5 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success)]/30 text-[10px] font-semibold uppercase">Receptionist</span>;
    return <span className="px-2 py-0.5 rounded-full bg-[var(--bg-surface-secondary)] text-[var(--text-muted)] border border-[var(--border-color)] text-[10px] font-semibold uppercase">Auditor</span>;
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
        <Header title="User Access Control" onOpenMobileNav={onOpenMobileNav} />
        <main className="p-12 max-w-xl mx-auto text-center space-y-3">
          <Lock className="w-12 h-12 text-[var(--status-danger)] mx-auto" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Access Forbidden</h3>
          <p className="text-xs text-[var(--text-muted)]">User access management is restricted strictly to Administrator role accounts.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
      <Header
        title="Enterprise User Access & Role Management"
        subtitle="Provision employee accounts, assign granular RBAC roles, and manage system operators."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)] shadow-xs">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">Organization Access Roster</h2>
            <p className="text-xs text-[var(--text-muted)]">Total provisioned operators: {users.length}</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-md bg-[var(--accent-primary)] hover:opacity-90 text-white text-xs font-medium inline-flex items-center gap-2 transition-colors shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Provision Operator Account
          </button>
        </div>

        {/* Users Roster Table */}
        <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs text-[var(--text-secondary)]">
            <thead className="bg-[var(--bg-surface-secondary)] text-[11px] font-semibold uppercase text-[var(--text-muted)] border-b border-[var(--border-color)]">
              <tr>
                <th className="px-5 py-3">Employee Name</th>
                <th className="px-4 py-3">Corporate Email</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[var(--bg-app)] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[var(--text-primary)]">{u.fullName}</td>
                  <td className="px-4 py-3.5 font-mono text-[var(--text-secondary)]">{u.email}</td>
                  <td className="px-4 py-3.5">{getRoleBadge(u.role)}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                        u.isActive !== false ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive !== false ? 'bg-[var(--status-success)]' : 'bg-[var(--status-danger)]'}`} />
                      {u.isActive !== false ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[var(--text-muted)]">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'System Default'}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleDeactivate(u.id)}
                        className="p-1.5 rounded-md hover:bg-[var(--status-danger-bg)] text-[var(--text-muted)] hover:text-[var(--status-danger)] transition-colors"
                        title="Deactivate Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Provision Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleAddUser}
              className="w-full max-w-md rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] p-6 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Provision New Operator</h4>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[var(--text-secondary)] font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Vikramaditya Singh"
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-medium mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="operator@aicallagent.internal"
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-medium mb-1">Role Allocation</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="receptionist">Receptionist (Live Calls & Review)</option>
                    <option value="operator">Operator (Routing & Forwarding)</option>
                    <option value="admin">Administrator (Full Access & Settings)</option>
                    <option value="viewer">Compliance Auditor (Read-Only Metrics)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-md bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] font-medium hover:bg-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md bg-[var(--accent-primary)] hover:opacity-90 text-white font-medium shadow-sm"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

