'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { UserPlus, ShieldCheck, UserCheck, Eye, Trash2, Lock, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { fetchUsersApi, createUserApi, deactivateUserApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface PageProps {
  onOpenMobileNav?: () => void;
}

export default function UserManagementPage({ onOpenMobileNav }: PageProps) {
  const { hasPermission, role } = useAuth();
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
    if (r === 'admin') return <Badge variant="destructive"><ShieldCheck className="w-3 h-3" /> Admin</Badge>;
    if (r === 'operator') return <Badge variant="info"><UserCheck className="w-3 h-3" /> Operator</Badge>;
    if (r === 'receptionist') return <Badge variant="success"><UserCheck className="w-3 h-3" /> Receptionist</Badge>;
    return <Badge variant="outline"><Eye className="w-3 h-3" /> Auditor</Badge>;
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
        <Header title="User Access Control" onOpenMobileNav={onOpenMobileNav} />
        <main className="p-12 max-w-xl mx-auto text-center space-y-3">
          <Lock className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">Access Forbidden</h3>
          <p className="text-xs text-zinc-400">User access management is restricted strictly to Administrator role accounts.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        title="Enterprise User Access & Role Management"
        subtitle="Provision employee accounts, assign granular RBAC roles, and manage system operators."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Organization Access Roster</h2>
            <p className="text-xs text-zinc-400">Total provisioned operators: {users.length}</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
          >
            <UserPlus className="w-4 h-4" />
            Provision Operator Account
          </button>
        </div>

        {/* Users Roster Table */}
        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden backdrop-blur-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 font-medium">
              <tr>
                <th className="px-5 py-3">Employee Name</th>
                <th className="px-4 py-3">Corporate Email</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-white">{u.fullName}</td>
                  <td className="px-4 py-3.5 font-mono text-zinc-300">{u.email}</td>
                  <td className="px-4 py-3.5">{getRoleBadge(u.role)}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                        u.isActive !== false ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive !== false ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {u.isActive !== false ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-zinc-400">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'System Default'}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleDeactivate(u.id)}
                        className="p-1.5 rounded-xl bg-zinc-800 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 transition-colors"
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
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleAddUser}
              className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h4 className="text-sm font-bold text-white">Provision New Operator</h4>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Vikramaditya Singh"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="operator@aicallagent.internal"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Role Allocation</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="receptionist">Receptionist (Live Calls & Review)</option>
                    <option value="operator">Operator (Routing & Forwarding)</option>
                    <option value="admin">Administrator (Full Access & Settings)</option>
                    <option value="viewer">Compliance Auditor (Read-Only Metrics)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
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
