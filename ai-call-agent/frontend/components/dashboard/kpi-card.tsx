import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

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
      iconStyle: 'bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] border border-[var(--border-color)]',
      stroke: 'var(--accent-primary)',
    },
    emerald: {
      iconStyle: 'bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success-bg)]',
      stroke: 'var(--status-success)',
    },
    rose: {
      iconStyle: 'bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger-bg)]',
      stroke: 'var(--status-danger)',
    },
    amber: {
      iconStyle: 'bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-bg)]',
      stroke: 'var(--status-warning)',
    },
    sky: {
      iconStyle: 'bg-[var(--status-info-bg)] text-[var(--status-info)] border border-[var(--status-info-bg)]',
      stroke: 'var(--status-info)',
    },
  };

  const scheme = colorMap[colorScheme];

  return (
    <div className="card-panel card-panel-hover p-4 relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-mono">{value}</h3>
        </div>
        <div className={`w-8 h-8 rounded ${scheme.iconStyle} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Mini SVG Sparkline */}
      <div className="my-2 h-5 w-full opacity-50 group-hover:opacity-80 transition-opacity">
        <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
          <path
            d="M0,18 Q20,6 40,13 T70,7 T100,11"
            fill="none"
            stroke={scheme.stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[var(--border-color)]">
        {subtitle && <span className="text-[var(--text-muted)] text-[11px] truncate max-w-[170px]">{subtitle}</span>}
        {trend && (
          <span
            className={`font-medium text-[11px] flex items-center gap-1 shrink-0 ${
              trend.isPositive ? 'text-[var(--status-success)]' : 'text-[var(--text-muted)]'
            }`}
          >
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
