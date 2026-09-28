'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  Sun,
  Moon,
  Menu,
  User,
  LogOut,
  ShieldCheck,
  Radio,
  Check,
  X,
  Volume2,
  Sparkles,
  PhoneCall,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useRealtime } from '@/lib/realtime-context';
import { UserRole } from '@/types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileNav?: () => void;
}

export function Header({ title, subtitle, onOpenMobileNav }: HeaderProps) {
  const { user, role, switchRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const realtime = useRealtime();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rolesList: { role: UserRole; label: string; desc: string }[] = [
    { role: 'admin', label: 'Administrator', desc: 'Full system configuration, RBAC user provisioning, voice cloning & analytics.' },
    { role: 'operator', label: 'Operator', desc: 'Live call monitoring, warm transfers, recipient management & spam review.' },
    { role: 'receptionist', label: 'Receptionist', desc: 'Live calls, transfers, voicemail, callbacks & call handling.' },
    { role: 'viewer', label: 'Compliance Auditor', desc: 'Read-only access to call logs, transcripts & compliance analytics.' },
  ];

  return (
    <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800 px-4 lg:px-8 py-3 flex items-center justify-between gap-4 select-none">
      {/* Title & Mobile Nav Toggle */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileNav && (
          <button
            onClick={onOpenMobileNav}
            className="md:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            aria-label="Open Mobile Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight truncate flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-zinc-400 truncate max-w-xl hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Global Search & Telephony Diagnostics Bar */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <div className="hidden md:flex items-center relative w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search caller ID, intent, DID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/90 border border-zinc-800/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Real-Time Telephony Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
          <span className={`w-2 h-2 rounded-full ${realtime.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
          <span className="text-zinc-300 font-mono text-[11px]">
            {realtime.isConnected ? 'PSTN / WS Connected' : 'Polling Sync Active'}
          </span>
        </div>

        {/* Quick Simulator Trigger Button */}
        <button
          onClick={() => realtime.triggerSimulatedCall()}
          className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold items-center gap-1.5 transition-colors"
          title="Generate synthetic test call"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Simulate Call</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Notification Bell Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {realtime.unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {realtime.unreadNotificationCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400" />
                  Live Event Notifications ({realtime.notifications.length})
                </h4>
                <button
                  onClick={realtime.clearAllNotifications}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {realtime.notifications.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">No notifications present.</p>
                ) : (
                  realtime.notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => realtime.markNotificationRead(n.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        !n.isRead
                          ? 'bg-zinc-950 border-indigo-800/60 text-zinc-200'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className="text-white text-xs">{n.title}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{n.message}</p>
                      {n.actionUrl && (
                        <Link
                          href={n.actionUrl}
                          className="inline-block mt-2 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          View Details →
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <span className="text-xs font-semibold text-zinc-200 hidden md:block max-w-[100px] truncate">
              {user?.fullName?.split(' ')[0] || 'User'}
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 p-3 space-y-2">
              <div className="p-2 border-b border-zinc-800">
                <p className="text-xs font-bold text-white truncate">{user?.fullName}</p>
                <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40 text-[10px] font-mono font-bold uppercase">
                  Role: {role}
                </span>
              </div>

              <div className="space-y-1 pt-1 text-xs">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowRoleModal(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                  Switch Active Role
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Switcher Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Select Role Persona
              </h3>
              <button onClick={() => setShowRoleModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {rolesList.map((r) => (
                <div
                  key={r.role}
                  onClick={() => {
                    switchRole(r.role);
                    setShowRoleModal(false);
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between ${
                    role === r.role
                      ? 'bg-indigo-950/60 border-indigo-600 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800/50'
                  }`}
                >
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      <span>{r.label}</span>
                      {role === r.role && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
