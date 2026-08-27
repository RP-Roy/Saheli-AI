import React from 'react';
import { cn } from '../../utils/formatters';
import type { RiskLevel } from '../../config/appConfig';

// ─── Badge Component ──────────────────────────────────────────────────────────

export type BadgeVariant = 'safe' | 'caution' | 'danger' | 'primary' | 'muted' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  safe:    'bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-sm',
  caution: 'bg-amber-50 text-amber-800 border border-amber-200/90 shadow-sm',
  danger:  'bg-rose-50 text-rose-700 border border-rose-200/90 shadow-sm',
  primary: 'bg-primary-50 text-primary-700 border border-primary-200/90 shadow-sm',
  muted:   'bg-white/90 text-slate-600 border border-pink-200/60 shadow-sm',
  outline: 'bg-transparent text-slate-700 border border-pink-300',
};

const DOT_COLORS: Record<BadgeVariant, string> = {
  safe:    'bg-emerald-500',
  caution: 'bg-amber-500',
  danger:  'bg-rose-500',
  primary: 'bg-primary-500',
  muted:   'bg-slate-400',
  outline: 'bg-slate-500',
};

export function Badge({ variant = 'muted', children, className, dot = false, pulse = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        BADGE_VARIANTS[variant],
        className,
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', DOT_COLORS[variant], pulse && 'animate-pulse')} />
      )}
      {children}
    </span>
  );
}

// ─── Risk Level Badge ─────────────────────────────────────────────────────────

const RISK_TO_VARIANT: Record<RiskLevel, BadgeVariant> = {
  SAFE: 'safe',
  CAUTION: 'caution',
  HIGH_RISK: 'danger',
};

const RISK_LABELS: Record<RiskLevel, string> = {
  SAFE: 'Safe',
  CAUTION: 'Caution',
  HIGH_RISK: 'High Risk',
};

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
  showDot?: boolean;
}

export function RiskBadge({ level, className, showDot = true }: RiskBadgeProps) {
  return (
    <Badge
      variant={RISK_TO_VARIANT[level]}
      dot={showDot}
      pulse={level === 'HIGH_RISK'}
      className={className}
    >
      {RISK_LABELS[level]}
    </Badge>
  );
}
