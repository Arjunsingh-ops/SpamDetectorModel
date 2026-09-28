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
  Shield,
  Activity,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRealtime } from '@/lib/realtime-context';

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  liveBadge?: boolean;
  badgeCount?: (realtime: ReturnType<typeof useRealtime>) => number | null;
  allowedRoles: ('admin' | 'operator' | 'receptionist' | 'viewer')[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Overview', icon: LayoutDashboard, allowedRoles: ['admin', 'operator', 'receptionist', 'viewer'] },
  { href: '/live-calls', label: 'Live Calls', icon: Radio, liveBadge: true, badgeCount: (rt) => rt.activeCalls.length || null, allowedRoles: ['admin', 'operator', 'receptionist', 'viewer'] },
  { href: '/call-history', label: 'Call History', icon: History, allowedRoles: ['admin', 'operator', 'viewer'] },
  { href: '/spam-review', label: 'Spam Review', icon: ShieldAlert, badgeCount: () => 3, allowedRoles: ['admin', 'operator', 'receptionist'] },
  { href: '/call-routing', label: 'Call Routing', icon: PhoneForwarded, allowedRoles: ['admin', 'operator', 'receptionist'] },
  { href: '/recipients', label: 'Recipients', icon: Users, allowedRoles: ['admin', 'operator', 'receptionist'] },
  { href: '/voicemail', label: 'Voicemail Inbox', icon: Voicemail, badgeCount: () => 2, allowedRoles: ['admin', 'operator', 'receptionist'] },
  { href: '/callbacks', label: 'Callback Requests', icon: PhoneCall, badgeCount: () => 2, allowedRoles: ['admin', 'operator', 'receptionist'] },
  { href: '/voice-agent', label: 'Voice Agent', icon: Mic, allowedRoles: ['admin'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, allowedRoles: ['admin', 'operator', 'viewer'] },
  { href: '/reports', label: 'Report Center', icon: FileText, allowedRoles: ['admin', 'operator', 'viewer'] },
  { href: '/users', label: 'Users & Roles', icon: UserCheck, allowedRoles: ['admin'] },
  { href: '/settings', label: 'Settings', icon: Settings, allowedRoles: ['admin', 'operator', 'viewer'] },
];

export function Sidebar({ collapsed = false, onToggleCollapse, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { role, user } = useAuth();
  const realtime = useRealtime();

  const permittedItems = NAV_ITEMS.filter((item) => item.allowedRoles.includes(role));

  return (
    <aside
      className={`bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <Link
          href="/"
          onClick={onCloseMobile}
          className="flex items-center gap-3 group min-w-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
            <PhoneCall className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-semibold text-zinc-100 flex items-center gap-1.5 text-sm tracking-tight truncate">
                AI Call Agent
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </div>
              <p className="text-[11px] text-zinc-400 truncate">Telephony Management</p>
            </div>
          )}
        </Link>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Live System Mode Banner */}
      {!collapsed && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                realtime.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'
              }`}
            />
            {realtime.isConnected ? 'Real-Time WebSocket' : 'Polling Sync Mode'}
          </span>
          <span className="text-[10px] text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded font-mono font-semibold border border-indigo-800/60">
            STAGE 7
          </span>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {permittedItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const badgeVal = item.badgeCount ? item.badgeCount(realtime) : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.liveBadge && realtime.activeCalls.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                  {badgeVal !== null && badgeVal > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
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
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950">
        <div className={`p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div className="truncate min-w-0">
                <p className="text-xs font-semibold text-zinc-200 truncate">{user?.fullName || 'Operator'}</p>
                <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">{role}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
