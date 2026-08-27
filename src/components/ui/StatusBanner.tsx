import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '../../utils/formatters';
import type { RiskLevel } from '../../config/appConfig';

// ─── Status Banner ────────────────────────────────────────────────────────────

interface StatusBannerProps {
  riskLevel: RiskLevel;
  primaryReason?: string;
  isActive?: boolean;
  className?: string;
}

const BANNER_CONFIG: Record<RiskLevel, {
  bg: string;
  border: string;
  icon: React.ElementType;
  iconColor: string;
  textColor: string;
  label: string;
  glow: string;
}> = {
  SAFE: {
    bg: 'bg-safe-500/10',
    border: 'border-safe-500/30',
    icon: ShieldCheck,
    iconColor: 'text-safe-400',
    textColor: 'text-safe-300',
    label: 'Safe',
    glow: '',
  },
  CAUTION: {
    bg: 'bg-caution-500/10',
    border: 'border-caution-500/30',
    icon: AlertTriangle,
    iconColor: 'text-caution-400',
    textColor: 'text-caution-300',
    label: 'Caution',
    glow: '',
  },
  HIGH_RISK: {
    bg: 'bg-danger-500/15',
    border: 'border-danger-500/40',
    icon: ShieldAlert,
    iconColor: 'text-danger-400',
    textColor: 'text-danger-300',
    label: 'High Risk',
    glow: 'shadow-glow-danger',
  },
};

export function StatusBanner({ riskLevel, primaryReason, isActive = true, className }: StatusBannerProps) {
  const cfg = BANNER_CONFIG[riskLevel];
  const Icon = cfg.icon;

  if (!isActive) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border',
        cfg.bg,
        cfg.border,
        riskLevel === 'HIGH_RISK' && 'animate-pulse-slow',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0', cfg.iconColor)} />
      <div className="flex-1 min-w-0">
        <span className={cn('font-semibold text-sm', cfg.textColor)}>
          {cfg.label}
        </span>
        {primaryReason && (
          <p className="text-slate-400 text-xs mt-0.5 truncate">{primaryReason}</p>
        )}
      </div>
    </div>
  );
}
