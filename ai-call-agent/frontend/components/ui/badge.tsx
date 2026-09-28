import React from 'react';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'info';
  children: React.ReactNode;
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-zinc-800 text-zinc-100 border-zinc-700',
    success: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
    warning: 'bg-amber-950/70 text-amber-300 border-amber-700/60',
    destructive: 'bg-rose-950/70 text-rose-300 border-rose-700/60',
    outline: 'bg-transparent text-zinc-300 border-zinc-700',
    info: 'bg-sky-950/70 text-sky-300 border-sky-700/60',
  };

  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
