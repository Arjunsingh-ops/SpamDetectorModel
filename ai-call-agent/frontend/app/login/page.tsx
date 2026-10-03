'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';
import { ShieldCheck, UserCheck, Eye, Lock, KeyRound, Mail } from 'lucide-react';
import { Header } from '@/components/layout/header';

interface PageProps {
  onOpenMobileNav?: () => void;
}

export default function LoginPage({ onOpenMobileNav }: PageProps) {
  const router = useRouter();
  const { loginWithCredentials, loginAsRole } = useAuth();

  const [email, setEmail] = useState('admin@aicallagent.internal');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    const success = await loginWithCredentials(email, password);
    setIsSubmitting(false);
    if (success) {
      router.push('/');
    } else {
      setErrorMsg('Invalid email address or password. Try admin@aicallagent.internal / admin123');
    }
  };

  const handleSelectRole = (role: UserRole) => {
    loginAsRole(role);
    router.push('/');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
      <Header
        title="Authentication & Session Control"
        subtitle="Enterprise JWT authentication and role-based access control (RBAC)."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-lg w-full mx-auto space-y-5 my-auto">
        <div className="card-panel p-6 sm:p-8 space-y-5 text-xs shadow-lg">
          <div className="w-10 h-10 rounded bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] flex items-center justify-center mx-auto border border-[var(--border-color)]">
            <Lock className="w-5 h-5" />
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">Enterprise Operator Sign In</h2>
            <p className="text-[var(--text-muted)] max-w-sm mx-auto">
              Sign in with corporate credentials or choose a quick role persona below.
            </p>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-3">
            <div>
              <label className="text-[var(--text-muted)] font-medium block mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-control w-full pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-[var(--text-muted)] font-medium block mb-1">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-control w-full pl-9"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-[var(--status-danger)] text-[11px] font-medium">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In With Credentials'}
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[var(--border-color)]"></div>
            <span className="flex-shrink mx-3 text-[var(--text-muted)] text-[10px] font-mono uppercase">QUICK SIMULATOR ROLE</span>
            <div className="flex-grow border-t border-[var(--border-color)]"></div>
          </div>

          {/* Quick Role Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => handleSelectRole('admin')}
              className="p-3 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] hover:border-[var(--border-color-hover)] transition-colors text-left"
            >
              <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)] mb-1" />
              <h4 className="font-semibold text-[var(--text-primary)] text-xs">Admin</h4>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Full configuration</p>
            </button>

            <button
              onClick={() => handleSelectRole('receptionist')}
              className="p-3 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] hover:border-[var(--border-color-hover)] transition-colors text-left"
            >
              <UserCheck className="w-4 h-4 text-[var(--status-success)] mb-1" />
              <h4 className="font-semibold text-[var(--text-primary)] text-xs">Receptionist</h4>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Calls & transfers</p>
            </button>

            <button
              onClick={() => handleSelectRole('viewer')}
              className="p-3 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] hover:border-[var(--border-color-hover)] transition-colors text-left"
            >
              <Eye className="w-4 h-4 text-[var(--status-info)] mb-1" />
              <h4 className="font-semibold text-[var(--text-primary)] text-xs">Auditor</h4>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Read-only metrics</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
