'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { CallRecord, SpamAssessment } from '@/types';
import { Badge } from '@/components/ui/badge';
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
    <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-white text-sm">{call.callerName || 'Unknown Caller'}</h4>
            <Badge variant="destructive">Risk Score: {assessment.compositeScore}/100</Badge>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">{call.callerNumber}</p>
        </div>
        <div className="text-right text-xs text-zinc-400">
          <span>Logged: {new Date(call.createdAt).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* 3 Pillars Score Gauge */}
      <div className="grid grid-cols-3 gap-2 my-4 text-center">
        <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Reputation</p>
          <p className="text-base font-bold text-amber-400 mt-1">{assessment.reputationScore}%</p>
          <span className="text-[9px] text-zinc-400">Carrier / DND</span>
        </div>
        <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Semantic</p>
          <p className="text-base font-bold text-rose-400 mt-1">{assessment.semanticScore}%</p>
          <span className="text-[9px] text-zinc-400">Lexical / Scam</span>
        </div>
        <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Behavioral</p>
          <p className="text-base font-bold text-indigo-400 mt-1">{assessment.behavioralScore}%</p>
          <span className="text-[9px] text-zinc-400">Cadence / Audio</span>
        </div>
      </div>

      {/* Detected Triggers */}
      <div className="space-y-2 mb-4 text-xs">
        <div>
          <span className="text-zinc-400 font-medium">Detected Triggers:</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {assessment.detectedTriggers.map((trig, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-rose-950/40 text-rose-300 border border-rose-800/40 text-[11px]"
              >
                {trig}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="text-zinc-400 font-medium">AI Rationale:</span>
          <p className="mt-1 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px] leading-relaxed">
            {assessment.aiRationale}
          </p>
        </div>
      </div>

      {/* Decision Outcome or Action Form */}
      {decisionResult ? (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{decisionResult}</span>
        </div>
      ) : (
        <div className="pt-3 border-t border-zinc-800/80 space-y-3">
          {/* Regulatory Submission Checkbox */}
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={submitReport}
              onChange={(e) => setSubmitReport(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-0"
            />
            <span className="text-zinc-400">
              Submit official telecom fraud report (Requires authorized human signoff)
            </span>
          </label>

          <input
            type="text"
            placeholder="Optional review notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleDecision('false_positive')}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Mark False Positive
            </button>

            <button
              onClick={() => handleDecision('confirmed_spam')}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
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
