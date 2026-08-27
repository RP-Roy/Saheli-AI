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
  safe:    'bg-safe-500/20 text-safe-400 border border-safe-500/30',
  caution: 'bg-caution-500/20 text-caution-400 border border-caution-500/30',
  danger:  'bg-danger-500/20 text-danger-400 border border-danger-500/30',
  primary: 'bg-primary-500/20 text-primary-300 border border-primary-500/30',
  muted:   'bg-white/5 text-slate-400 border border-white/10',
  outline: 'bg-transparent text-slate-300 border border-white/20',
};

const DOT_COLORS: Record<BadgeVariant, string> = {
  safe:    'bg-safe-400',
  caution: 'bg-caution-400',
  danger:  'bg-danger-400',
  primary: 'bg-primary-400',
  muted:   'bg-slate-400',
  outline: 'bg-slate-300',
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
