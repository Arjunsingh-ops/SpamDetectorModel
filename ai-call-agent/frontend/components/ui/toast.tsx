import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description?: string;
}

export function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: (id: string) => void }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
  };

  return (
    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl flex items-start justify-between gap-3 min-w-[280px] max-w-md animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        {icons[toast.type]}
        <div>
          <h5 className="text-xs font-semibold text-white">{toast.title}</h5>
          {toast.description && <p className="text-[11px] text-zinc-400 mt-0.5">{toast.description}</p>}
        </div>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-zinc-500 hover:text-zinc-300 text-xs p-1"
      >
        ✕
      </button>
    </div>
  );
}
