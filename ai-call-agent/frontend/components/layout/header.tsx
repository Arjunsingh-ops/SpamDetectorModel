'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  Sun,
  Moon,
  Laptop,
  Menu,
  User,
  LogOut,
  ShieldCheck,
  Radio,
  Check,
  X,
  PhoneCall,
  Activity,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme, ThemeMode } from '@/lib/theme-context';
import { useRealtime } from '@/lib/realtime-context';
import { UserRole } from '@/types';
import { CommandPalette } from '@/components/ui/command-palette';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileNav?: () => void;
}

export function Header({ title, subtitle, onOpenMobileNav }: HeaderProps) {
  const { user, role, switchRole, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const realtime = useRealtime();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showCmdPalette, setShowCmdPalette] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
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
    <>
      <header className="sticky top-0 z-20 bg-[var(--bg-surface)] border-b border-[var(--border-color)] px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4 select-none">
        {/* Title & Mobile Nav Toggle */}
        <div className="flex items-center gap-3 min-w-0">
          {onOpenMobileNav && (
            <button
              onClick={onOpenMobileNav}
              className="md:hidden p-1.5 rounded-md bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] tracking-tight truncate flex items-center gap-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-[var(--text-muted)] truncate max-w-xl hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Global Search & Telephony Diagnostics Bar */}
        <div className="flex items-center gap-2.5">
          {/* Global Search / Command Palette Trigger */}
          <button
            onClick={() => setShowCmdPalette(true)}
            className="hidden md:flex items-center justify-between w-64 bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-xs text-[var(--text-muted)] hover:border-[var(--border-color-hover)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Search commands, calls...</span>
            </div>
            <kbd className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border-color)] pointer-events-none">
              Ctrl K
            </kbd>
          </button>

          {/* Real-Time Telephony Status Badge */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-xs">
            <span className={`live-dot ${realtime.isConnected ? 'bg-[var(--status-success)]' : 'bg-[var(--status-warning)]'}`} />
            <span className="text-[var(--text-secondary)] font-mono text-[11px]">
              {realtime.isConnected ? 'PSTN Connected' : 'Polling Sync'}
            </span>
          </div>

          {/* Quick Simulator Trigger Button */}
          <button
            onClick={() => realtime.triggerSimulatedCall()}
            className="hidden sm:inline-flex px-3 py-1.5 rounded-md bg-[var(--accent-primary-subtle)] hover:bg-[var(--accent-primary)] hover:text-white text-[var(--accent-primary)] border border-[var(--border-color)] text-xs font-medium items-center gap-1.5 transition-colors"
            title="Generate synthetic test call"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Simulate Call</span>
          </button>

          {/* Theme Selector Popover (Light / Dark / System) */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-1.5 rounded-md bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
              title="Theme settings"
            >
              {resolvedTheme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-blue-600" />}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-40 card-panel bg-[var(--bg-surface)] p-1 shadow-lg z-50 text-xs">
                <p className="px-2 py-1 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Appearance</p>
                <button
                  onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md ${
                    theme === 'light' ? 'bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light Mode</span>
                  </div>
                  {theme === 'light' && <Check className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md ${
                    theme === 'dark' ? 'bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark Mode</span>
                  </div>
                  {theme === 'dark' && <Check className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => { setTheme('system'); setShowThemeMenu(false); }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md ${
                    theme === 'system' ? 'bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>System Theme</span>
                  </div>
                  {theme === 'system' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Notification Bell Popover */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded-md bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors relative"
              title="System Notifications"
            >
              <Bell className="w-4 h-4" />
              {realtime.unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--status-danger)] text-white text-[9px] font-bold flex items-center justify-center">
                  {realtime.unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 card-panel bg-[var(--bg-surface)] p-3 shadow-xl z-50 text-xs">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 mb-2">
                  <span className="font-semibold text-[var(--text-primary)]">Notifications</span>
                  <button
                    onClick={() => realtime.clearAllNotifications()}
                    className="text-[10px] text-[var(--accent-primary)] hover:underline"
                  >
                    Clear all
                  </button>

                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {realtime.notifications.length === 0 ? (
                    <p className="text-[var(--text-muted)] text-center py-4">No recent notifications</p>
                  ) : (
                    realtime.notifications.map((n, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-md bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] flex items-start gap-2"
                      >
                        <Activity className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[var(--text-primary)] font-medium text-[11px]">{n.title}</p>
                          <p className="text-[var(--text-muted)] text-[10px] mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Role Switcher */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-md bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] hover:border-[var(--border-color-hover)] transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center text-xs font-semibold">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
              <span className="text-xs font-medium text-[var(--text-primary)] hidden sm:inline-block">
                {user?.fullName || 'Lead Administrator'}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 card-panel bg-[var(--bg-surface)] p-2 shadow-xl z-50 text-xs space-y-1">
                <div className="px-2 py-1.5 border-b border-[var(--border-color)]">
                  <p className="font-semibold text-[var(--text-primary)]">{user?.fullName || 'Lead Administrator'}</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">{user?.email || 'admin@telephony.internal'}</p>
                  <span className="inline-block mt-1 badge-pill badge-info uppercase text-[9px] tracking-wider">
                    Role: {role}
                  </span>
                </div>

                <button
                  onClick={() => { setShowProfileMenu(false); setShowRoleModal(true); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)]"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Switch Role (RBAC Demo)</span>
                </button>

                <button
                  onClick={() => { setShowProfileMenu(false); logout(); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-panel bg-[var(--bg-surface)] p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="font-semibold text-[var(--text-primary)]">RBAC Role Switcher</h3>
              </div>
              <button onClick={() => setShowRoleModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              Select an active user role to simulate permission scope enforcement across the dashboard.
            </p>

            <div className="space-y-2">
              {rolesList.map((r) => (
                <button
                  key={r.role}
                  onClick={() => { switchRole(r.role); setShowRoleModal(false); }}
                  className={`w-full p-3 rounded-md border text-left transition-colors ${
                    role === r.role
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-subtle)]'
                      : 'border-[var(--border-color)] bg-[var(--bg-surface-secondary)] hover:border-[var(--border-color-hover)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[var(--text-primary)] text-xs">{r.label}</span>
                    {role === r.role && <Check className="w-4 h-4 text-[var(--accent-primary)]" />}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette isOpen={showCmdPalette} onClose={() => setShowCmdPalette(false)} />
    </>
  );
}
