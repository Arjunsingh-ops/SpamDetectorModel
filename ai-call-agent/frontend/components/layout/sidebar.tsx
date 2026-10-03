'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Radio,
  History,
  ShieldAlert,
  PhoneForwarded,
  Users,
  Voicemail,
  PhoneCall,
  Mic,
  BarChart3,
  UserCheck,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRealtime } from '@/lib/realtime-context';

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

interface NavCategory {
  category: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  liveBadge?: boolean;
  badgeCount?: (realtime: ReturnType<typeof useRealtime>) => number | null;
  allowedRoles: ('admin' | 'operator' | 'receptionist' | 'viewer')[];
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    category: 'PERSONAL CALL ASSISTANT',
    items: [
      { href: '/', label: 'Home (Call Screener)', icon: LayoutDashboard, allowedRoles: ['admin', 'operator', 'receptionist', 'viewer'] },
      { href: '/live-calls', label: 'Calls & Live Screening', icon: Radio, liveBadge: true, badgeCount: (rt) => rt.activeCalls.length || null, allowedRoles: ['admin', 'operator', 'receptionist', 'viewer'] },
      { href: '/call-history', label: 'Call History', icon: History, allowedRoles: ['admin', 'operator', 'viewer'] },
      { href: '/spam-review', label: 'Protection & Spam Shield', icon: ShieldAlert, badgeCount: () => 3, allowedRoles: ['admin', 'operator', 'receptionist'] },
      { href: '/voice-agent', label: 'Assistant Persona & Voice', icon: Mic, allowedRoles: ['admin'] },
      { href: '/settings', label: 'Settings & Forwarding', icon: Settings, allowedRoles: ['admin', 'operator', 'viewer'] },
    ],
  },
  {
    category: 'ADVANCED TELEPHONY & SYSTEM',
    items: [
      { href: '/call-routing', label: 'Smart PSTN Routing', icon: PhoneForwarded, allowedRoles: ['admin', 'operator', 'receptionist'] },
      { href: '/recipients', label: 'Staff Directory', icon: Users, allowedRoles: ['admin', 'operator', 'receptionist'] },
      { href: '/voicemail', label: 'Voicemail Inbox', icon: Voicemail, badgeCount: () => 2, allowedRoles: ['admin', 'operator', 'receptionist'] },
      { href: '/callbacks', label: 'Callback Queue', icon: PhoneCall, badgeCount: () => 2, allowedRoles: ['admin', 'operator', 'receptionist'] },
      { href: '/analytics', label: 'Telephony Analytics', icon: BarChart3, allowedRoles: ['admin', 'operator', 'viewer'] },
      { href: '/reports', label: 'Audit Reports', icon: FileText, allowedRoles: ['admin', 'operator', 'viewer'] },
      { href: '/users', label: 'Users & Roles (RBAC)', icon: UserCheck, allowedRoles: ['admin'] },
    ],
  },
];

export function Sidebar({ collapsed = false, onToggleCollapse, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { role, user } = useAuth();
  const realtime = useRealtime();

  return (
    <aside
      className={`bg-[var(--bg-surface)] border-r border-[var(--border-color)] flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="p-3.5 border-b border-[var(--border-color)] flex items-center justify-between">
        <Link
          href="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group min-w-0"
        >
          <div className="w-7 h-7 rounded bg-[var(--accent-primary)] flex items-center justify-center text-white shrink-0">
            <PhoneCall className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1 text-xs tracking-tight truncate">
                AI Call Agent
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              </div>
              <p className="text-[9px] font-mono text-[var(--text-muted)] truncate tracking-wide uppercase">ENTERPRISE EDITION</p>
            </div>
          )}
        </Link>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Telephony Connection Engine Status */}
      {!collapsed && (
        <div className="mx-2.5 mt-2.5 px-2.5 py-1.5 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <span
              className={`live-dot ${
                realtime.isConnected ? 'bg-[var(--status-success)]' : 'bg-[var(--status-warning)]'
              }`}
            />
            {realtime.isConnected ? 'WebSocket Stream' : 'Polling Sync'}
          </span>
          <span className="text-[10px] text-[var(--status-success)] bg-[var(--status-success-bg)] px-1.5 py-0.5 rounded font-mono font-semibold border border-[var(--status-success-bg)]">
            ONLINE
          </span>
        </div>
      )}

      {/* Categorized Navigation List */}
      <nav className="flex-1 p-2.5 space-y-3.5 overflow-y-auto custom-scrollbar">
        {NAV_CATEGORIES.map((cat) => {
          const permittedInCat = cat.items.filter((item) => item.allowedRoles.includes(role));
          if (permittedInCat.length === 0) return null;

          return (
            <div key={cat.category} className="space-y-0.5">
              {!collapsed && (
                <p className="px-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  {cat.category}
                </p>
              )}
              {permittedInCat.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const badgeVal = item.badgeCount ? item.badgeCount(realtime) : null;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors group relative ${
                      isActive
                        ? 'bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] font-medium border-l-2 border-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!collapsed && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.liveBadge && realtime.activeCalls.length > 0 && (
                          <span className="live-dot" />
                        )}
                        {badgeVal !== null && badgeVal > 0 && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                              isActive
                                ? 'bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)]'
                                : 'bg-[var(--bg-surface-secondary)] text-[var(--text-muted)] border border-[var(--border-color)]'
                            }`}
                          >
                            {badgeVal}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-2.5 border-t border-[var(--border-color)] bg-[var(--bg-surface)]">
        <div className={`p-1.5 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[var(--accent-primary-subtle)] border border-[var(--accent-primary)] text-[var(--accent-primary)] flex items-center justify-center font-semibold text-xs shrink-0">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            {!collapsed && (
              <div className="truncate min-w-0">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">{user?.fullName || 'Arjun Sharma'}</p>
                <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">{role}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
