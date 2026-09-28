import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorScheme?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'sky';
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'indigo',
}: KpiCardProps) {
  const colorMap = {
    indigo: {
      bg: 'from-indigo-950/40 to-zinc-900/60',
      border: 'border-indigo-900/40 hover:border-indigo-700/60',
      iconBg: 'bg-indigo-600/20 text-indigo-400',
    },
    emerald: {
      bg: 'from-emerald-950/40 to-zinc-900/60',
      border: 'border-emerald-900/40 hover:border-emerald-700/60',
      iconBg: 'bg-emerald-600/20 text-emerald-400',
    },
    rose: {
      bg: 'from-rose-950/40 to-zinc-900/60',
      border: 'border-rose-900/40 hover:border-rose-700/60',
      iconBg: 'bg-rose-600/20 text-rose-400',
    },
    amber: {
      bg: 'from-amber-950/40 to-zinc-900/60',
      border: 'border-amber-900/40 hover:border-amber-700/60',
      iconBg: 'bg-amber-600/20 text-amber-400',
    },
    sky: {
      bg: 'from-sky-950/40 to-zinc-900/60',
      border: 'border-sky-900/40 hover:border-sky-700/60',
      iconBg: 'bg-sky-600/20 text-sky-400',
    },
  };

  const scheme = colorMap[colorScheme];

  return (
    <div
      className={`p-5 rounded-2xl bg-gradient-to-br ${scheme.bg} border ${scheme.border} backdrop-blur-md transition-all duration-200 hover:shadow-lg hover:shadow-black/40`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1.5 tracking-tight">{value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-xl ${scheme.iconBg} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        {subtitle && <span className="text-zinc-400">{subtitle}</span>}
        {trend && (
          <span
            className={`font-medium ${
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
