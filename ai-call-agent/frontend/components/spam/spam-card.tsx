'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { CallRecord, SpamAssessment } from '@/types';
import { submitSpamReviewDecision } from '@/lib/api';

interface SpamCardProps {
  call: CallRecord;
  assessment: SpamAssessment;
  onReviewed?: (callId: string, decision: string) => void;
}

export function SpamCard({ call, assessment, onReviewed }: SpamCardProps) {
  const [submitReport, setSubmitReport] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [decisionResult, setDecisionResult] = useState<string | null>(null);

  const handleDecision = async (decision: 'confirmed_spam' | 'false_positive') => {
    setIsSubmitting(true);
    const res = await submitSpamReviewDecision(call.id, {
      decision,
      submitTelecomReport: submitReport,
      notes,
    });
    setIsSubmitting(false);
    setDecisionResult(res.message);
    if (onReviewed) onReviewed(call.id, decision);
  };

  return (
    <div className="p-4 rounded card-panel space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-[var(--text-primary)] text-xs">{call.callerName || 'Unknown Caller'}</h4>
            <span className="badge-pill badge-danger font-mono">Risk Score: {assessment.compositeScore}/100</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">{call.callerNumber}</p>
        </div>
        <div className="text-right text-[11px] text-[var(--text-muted)]">
          <span>Logged: {new Date(call.createdAt).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* 3 Pillars Score Gauge */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)]">
          <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Reputation</p>
          <p className="text-sm font-bold text-[var(--status-warning)] font-mono mt-0.5">{assessment.reputationScore}%</p>
          <span className="text-[9px] text-[var(--text-muted)]">Carrier / DND</span>
        </div>
        <div className="p-2 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)]">
          <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Semantic</p>
          <p className="text-sm font-bold text-[var(--status-danger)] font-mono mt-0.5">{assessment.semanticScore}%</p>
          <span className="text-[9px] text-[var(--text-muted)]">Lexical / Scam</span>
        </div>
        <div className="p-2 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)]">
          <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Behavioral</p>
          <p className="text-sm font-bold text-[var(--accent-primary)] font-mono mt-0.5">{assessment.behavioralScore}%</p>
          <span className="text-[9px] text-[var(--text-muted)]">Cadence / Audio</span>
        </div>
      </div>

      {/* Detected Triggers */}
      <div className="space-y-2 text-xs">
        <div>
          <span className="text-[var(--text-muted)] font-medium">Detected Triggers:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {assessment.detectedTriggers.map((trig, idx) => (
              <span
                key={idx}
                className="badge-pill badge-danger font-mono text-[10px]"
              >
                {trig}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[var(--text-muted)] font-medium">AI Rationale:</span>
          <p className="mt-1 p-2 rounded bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-[11px] leading-relaxed">
            {assessment.aiRationale}
          </p>
        </div>
      </div>

      {/* Decision Outcome or Action Form */}
      {decisionResult ? (
        <div className="p-2.5 rounded bg-[var(--status-success-bg)] border border-[var(--status-success-bg)] text-[var(--status-success)] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{decisionResult}</span>
        </div>
      ) : (
        <div className="pt-2.5 border-t border-[var(--border-color)] space-y-2.5">
          {/* Regulatory Submission Checkbox */}
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={submitReport}
              onChange={(e) => setSubmitReport(e.target.checked)}
              className="rounded border-[var(--border-color)] text-[var(--accent-primary)]"
            />
            <span className="text-[11px] text-[var(--text-muted)]">
              Submit official telecom fraud report (Requires authorized human signoff)
            </span>
          </label>

          <input
            type="text"
            placeholder="Optional review notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-control w-full text-xs"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleDecision('false_positive')}
              disabled={isSubmitting}
              className="btn-secondary text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />
              Mark False Positive
            </button>

            <button
              onClick={() => handleDecision('confirmed_spam')}
              disabled={isSubmitting}
              className="btn-primary text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Confirm Spam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
