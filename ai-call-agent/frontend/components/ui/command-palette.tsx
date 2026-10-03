'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
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
  Sun,
  Moon,
  Laptop,
  FileText,
  X,
} from 'lucide-react';
import { useTheme, ThemeMode } from '@/lib/theme-context';
import { useRealtime } from '@/lib/realtime-context';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Theme';
  icon: React.ComponentType<{ className?: string }>;
  perform: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const realtime = useRealtime();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          setQuery('');
          setSelectedIndex(0);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  const commands: CommandItem[] = [
    { id: 'nav-overview', title: 'Go to Overview Dashboard', category: 'Navigation', icon: LayoutDashboard, perform: () => navigate('/') },
    { id: 'nav-live', title: 'Go to Live Calls Monitor', category: 'Navigation', icon: Radio, perform: () => navigate('/live-calls') },
    { id: 'nav-history', title: 'Go to Call History & Logs', category: 'Navigation', icon: History, perform: () => navigate('/call-history') },
    { id: 'nav-spam', title: 'Go to Fraud Shield & Spam Review', category: 'Navigation', icon: ShieldAlert, perform: () => navigate('/spam-review') },
    { id: 'nav-routing', title: 'Go to Smart PSTN Call Routing', category: 'Navigation', icon: PhoneForwarded, perform: () => navigate('/call-routing') },
    { id: 'nav-recipients', title: 'Go to Staff Directory', category: 'Navigation', icon: Users, perform: () => navigate('/recipients') },
    { id: 'nav-voicemail', title: 'Go to Voicemail Inbox', category: 'Navigation', icon: Voicemail, perform: () => navigate('/voicemail') },
    { id: 'nav-callbacks', title: 'Go to Callback Queue', category: 'Navigation', icon: PhoneCall, perform: () => navigate('/callbacks') },
    { id: 'nav-voice', title: 'Go to AI Voice Receptionist Config', category: 'Navigation', icon: Mic, perform: () => navigate('/voice-agent') },
    { id: 'nav-analytics', title: 'Go to Telephony Analytics', category: 'Navigation', icon: BarChart3, perform: () => navigate('/analytics') },
    { id: 'nav-reports', title: 'Go to Audit Reports', category: 'Navigation', icon: FileText, perform: () => navigate('/reports') },
    { id: 'nav-users', title: 'Go to Users & RBAC Roles', category: 'Navigation', icon: UserCheck, perform: () => navigate('/users') },
    { id: 'nav-settings', title: 'Go to System Settings', category: 'Navigation', icon: Settings, perform: () => navigate('/settings') },
    
    { id: 'act-sim', title: 'Trigger Synthetic Test Call', category: 'Actions', icon: PhoneCall, perform: () => { realtime.triggerSimulatedCall(); onClose(); } },

    { id: 'theme-light', title: 'Switch Theme to Light Mode', category: 'Theme', icon: Sun, perform: () => { setTheme('light'); onClose(); } },
    { id: 'theme-dark', title: 'Switch Theme to Dark Mode', category: 'Theme', icon: Moon, perform: () => { setTheme('dark'); onClose(); } },
    { id: 'theme-system', title: 'Switch Theme to System Preference', category: 'Theme', icon: Laptop, perform: () => { setTheme('system'); onClose(); } },
  ];

  const filtered = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDownMenu = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].perform();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4">
      <div className="card-panel w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 border-[var(--border-color)]">
        {/* Search Input Bar */}
        <div className="flex items-center px-3.5 border-b border-[var(--border-color)] bg-[var(--bg-surface-secondary)]">
          <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDownMenu}
            placeholder="Type a command or search page..."
            className="w-full bg-transparent border-0 px-3 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command Options List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)]">
              No matching commands or pages found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.perform}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
                    isSelected
                      ? 'bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`} />
                    <span>{cmd.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)]">
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-3 py-2 bg-[var(--bg-surface-secondary)] border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>Ctrl K</span>
        </div>
      </div>
    </div>
  );
}
