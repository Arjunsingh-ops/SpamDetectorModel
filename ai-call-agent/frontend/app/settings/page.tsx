'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import {
  Phone,
  Shield,
  Save,
  Building,
  Lock,
  CheckCircle2,
} from 'lucide-react';

interface PageProps {
  onOpenMobileNav?: () => void;
}

export default function SettingsPage({ onOpenMobileNav }: PageProps) {
  const [activeSection, setActiveSection] = useState<'general' | 'telephony' | 'spam' | 'privacy'>('general');
  const [businessName, setBusinessName] = useState('AI Call Agent Enterprise');
  const [supportEmail, setSupportEmail] = useState('support@aicallagent.internal');
  const [forwardNumber, setForwardNumber] = useState('+919876543210');
  const [provider, setProvider] = useState('mock');
  const [spamBlockThreshold, setSpamBlockThreshold] = useState(70);
  const [spamUncertainThreshold, setSpamUncertainThreshold] = useState(40);
  const [retentionDays, setRetentionDays] = useState(90);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
      <Header
        title="Unified Application & Telephony Settings"
        subtitle="Manage business profile, telephony adapters, spam screening thresholds, and data retention policies."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveSection('general')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeSection === 'general' ? 'bg-[var(--accent-primary)] text-white shadow-xs' : 'bg-[var(--bg-surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            General & Business Profile
          </button>
          <button
            onClick={() => setActiveSection('telephony')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeSection === 'telephony' ? 'bg-[var(--accent-primary)] text-white shadow-xs' : 'bg-[var(--bg-surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Telephony & Routing
          </button>
          <button
            onClick={() => setActiveSection('spam')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeSection === 'spam' ? 'bg-[var(--accent-primary)] text-white shadow-xs' : 'bg-[var(--bg-surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Spam Shield Thresholds
          </button>
          <button
            onClick={() => setActiveSection('privacy')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeSection === 'privacy' ? 'bg-[var(--accent-primary)] text-white shadow-xs' : 'bg-[var(--bg-surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Privacy & Retention Policy
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {activeSection === 'general' && (
            <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 shadow-xs">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Building className="w-4 h-4 text-[var(--accent-primary)]" />
                Business Profile & Operating Info
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Organization Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Support Contact Email</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'telephony' && (
            <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 shadow-xs">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Phone className="w-4 h-4 text-[var(--accent-primary)]" />
                Telephony Carrier Adapter & Inbound Routing
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Default Forwarding Target (E.164)</label>
                  <input
                    type="text"
                    value={forwardNumber}
                    onChange={(e) => setForwardNumber(e.target.value)}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-medium">Telephony Carrier Adapter Mode</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="mock">Free Browser Call Simulator (Local Dev)</option>
                    <option value="twilio">Twilio Programmable Voice SIP</option>
                    <option value="exotel">Exotel / Indian PSTN Trunk</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'spam' && (
            <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 shadow-xs">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[var(--status-danger)]" />
                Multi-Signal Spam Shield Sensitivity
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[var(--text-secondary)] font-medium">Block Threshold (High Risk)</span>
                    <span className="font-bold text-[var(--status-danger)] font-mono">{spamBlockThreshold} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={spamBlockThreshold}
                    onChange={(e) => setSpamBlockThreshold(Number(e.target.value))}
                    className="w-full accent-[var(--status-danger)]"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[var(--text-secondary)] font-medium">Screening Challenge Threshold</span>
                    <span className="font-bold text-[var(--status-warning)] font-mono">{spamUncertainThreshold} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="60"
                    value={spamUncertainThreshold}
                    onChange={(e) => setSpamUncertainThreshold(Number(e.target.value))}
                    className="w-full accent-[var(--status-warning)]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 shadow-xs">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[var(--status-success)]" />
                Privacy & Data Retention Controls
              </h3>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-medium">Call Recording & Transcript Retention (Days)</label>
                <input
                  type="number"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-full max-w-xs bg-[var(--bg-app)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>
          )}

          {/* Submit Action Row */}
          <div className="flex items-center justify-between pt-2">
            {savedNotice ? (
              <span className="text-xs text-[var(--status-success)] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
              </span>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">Settings changes take effect immediately across all active DIDs.</span>
            )}

            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-[var(--accent-primary)] hover:opacity-90 text-white text-xs font-medium inline-flex items-center gap-2 shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Save Settings
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

