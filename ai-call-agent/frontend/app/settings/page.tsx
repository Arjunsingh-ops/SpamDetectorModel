'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import {
  Phone,
  Shield,
  Save,
  AlertCircle,
  Building,
  Clock,
  Mic,
  Sliders,
  Bell,
  Lock,
  FileText,
  UserCheck,
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
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        title="Unified Application & Telephony Settings"
        subtitle="Manage business profile, telephony adapters, spam screening thresholds, and data retention policies."
        onOpenMobileNav={onOpenMobileNav}
      />

      <main className="p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveSection('general')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSection === 'general' ? 'bg-indigo-600 text-white shadow-md' : 'bg-zinc-900/60 text-zinc-400 hover:text-white'
            }`}
          >
            General & Business Profile
          </button>
          <button
            onClick={() => setActiveSection('telephony')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSection === 'telephony' ? 'bg-indigo-600 text-white shadow-md' : 'bg-zinc-900/60 text-zinc-400 hover:text-white'
            }`}
          >
            Telephony & Routing
          </button>
          <button
            onClick={() => setActiveSection('spam')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSection === 'spam' ? 'bg-indigo-600 text-white shadow-md' : 'bg-zinc-900/60 text-zinc-400 hover:text-white'
            }`}
          >
            Spam Shield Thresholds
          </button>
          <button
            onClick={() => setActiveSection('privacy')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSection === 'privacy' ? 'bg-indigo-600 text-white shadow-md' : 'bg-zinc-900/60 text-zinc-400 hover:text-white'
            }`}
          >
            Privacy & Retention Policy
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {activeSection === 'general' && (
            <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-400" />
                Business Profile & Operating Info
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Organization Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Support Contact Email</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'telephony' && (
            <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-400" />
                Telephony Carrier Adapter & Inbound Routing
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Default Forwarding Target (E.164)</label>
                  <input
                    type="text"
                    value={forwardNumber}
                    onChange={(e) => setForwardNumber(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Telephony Carrier Adapter Mode</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-400" />
                Multi-Signal Spam Shield Sensitivity
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-400 font-medium">Block Threshold (High Risk)</span>
                    <span className="font-bold text-rose-400 font-mono">{spamBlockThreshold} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={spamBlockThreshold}
                    onChange={(e) => setSpamBlockThreshold(Number(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-400 font-medium">Screening Challenge Threshold</span>
                    <span className="font-bold text-amber-400 font-mono">{spamUncertainThreshold} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="60"
                    value={spamUncertainThreshold}
                    onChange={(e) => setSpamUncertainThreshold(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Privacy & Data Retention Controls
              </h3>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Call Recording & Transcript Retention (Days)</label>
                <input
                  type="number"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-full max-w-xs bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Submit Action Row */}
          <div className="flex items-center justify-between pt-2">
            {savedNotice ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
              </span>
            ) : (
              <span className="text-xs text-zinc-400">Settings changes take effect immediately across all active DIDs.</span>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
