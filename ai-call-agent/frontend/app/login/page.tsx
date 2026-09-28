'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';
import { ShieldCheck, UserCheck, Eye, Lock, ArrowRight, KeyRound, Mail } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';

interface PageProps {
  onOpenMobileNav?: () => void;
}

export default function LoginPage({ onOpenMobileNav }: PageProps) {
  const router = useRouter();
  const { user, loginWithCredentials, loginAsRole, logout } = useAuth();

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
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        title="Authentication & Session Control"
        subtitle="Enterprise JWT authentication and role-based access control (RBAC)."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-xl w-full mx-auto space-y-6 my-auto">
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-2xl shadow-2xl space-y-6 text-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
            <Lock className="w-6 h-6" />
          </div>

          <div className="text-center">
            <h2 className="text-lg font-bold text-white tracking-tight">Enterprise Operator Sign In</h2>
            <p className="text-zinc-400 mt-1 max-w-sm mx-auto">
              Sign in with corporate JWT credentials or choose a quick role persona below.
            </p>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-3">
            <div>
              <label className="text-zinc-400 font-medium block mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-400 font-medium block mb-1">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-rose-400 text-[11px] font-semibold">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In With JWT'}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-zinc-500 text-[10px] font-mono">OR QUICK SIMULATOR ROLE</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          {/* Quick Role Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleSelectRole('admin')}
              className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-indigo-600 hover:bg-indigo-950/20 transition-all text-left group"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400 mb-1" />
              <h4 className="font-bold text-white text-xs">Administrator</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">Full access & settings</p>
            </button>

            <button
              onClick={() => handleSelectRole('receptionist')}
              className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-600 hover:bg-emerald-950/20 transition-all text-left group"
            >
              <UserCheck className="w-4 h-4 text-emerald-400 mb-1" />
              <h4 className="font-bold text-white text-xs">Receptionist</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">Calls & transfers</p>
            </button>

            <button
              onClick={() => handleSelectRole('viewer')}
              className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-sky-600 hover:bg-sky-950/20 transition-all text-left group"
            >
              <Eye className="w-4 h-4 text-sky-400 mb-1" />
              <h4 className="font-bold text-white text-xs">Auditor</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">Read-only metrics</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
