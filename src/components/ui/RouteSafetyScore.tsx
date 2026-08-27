import { cn } from '../../utils/formatters';
import type { RiskLevel } from '../../config/appConfig';

// ─── Journey Confidence Score Gauge ──────────────────────────────────────────

interface RouteSafetyScoreProps {
  score: number;        // 0–100
  riskLevel: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

const SIZE_CONFIG = {
  sm: { viewBox: 120, cx: 60, cy: 60, r: 48, strokeWidth: 8, fontSize: 'text-xl', labelSize: 'text-xs' },
  md: { viewBox: 160, cx: 80, cy: 80, r: 64, strokeWidth: 10, fontSize: 'text-3xl', labelSize: 'text-sm' },
  lg: { viewBox: 200, cx: 100, cy: 100, r: 82, strokeWidth: 12, fontSize: 'text-4xl', labelSize: 'text-base' },
};

const RISK_STROKE: Record<RiskLevel, string> = {
  SAFE:      'stroke-safe-500',
  CAUTION:   'stroke-caution-500',
  HIGH_RISK: 'stroke-danger-500',
};

const RISK_TEXT: Record<RiskLevel, string> = {
  SAFE:      'text-safe-400',
  CAUTION:   'text-caution-400',
  HIGH_RISK: 'text-danger-400',
};

const RISK_GLOW: Record<RiskLevel, string> = {
  SAFE:      'drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]',
  CAUTION:   'drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]',
  HIGH_RISK: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]',
};

export function RouteSafetyScore({
  score,
  riskLevel,
  size = 'md',
  showLabel = true,
  animated = true,
}: RouteSafetyScoreProps) {
  const cfg = SIZE_CONFIG[size];
  const circumference = 2 * Math.PI * cfg.r;
  const progress = Math.max(0, Math.min(100, score));
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <div className="relative inline-flex flex-col items-center gap-2">
      <svg
        width={cfg.viewBox}
        height={cfg.viewBox}
        viewBox={`0 0 ${cfg.viewBox} ${cfg.viewBox}`}
        className={cn('rotate-[-90deg]', animated && riskLevel === 'HIGH_RISK' && 'animate-pulse-slow')}
      >
        {/* Background track */}
        <circle
          cx={cfg.cx}
          cy={cfg.cy}
          r={cfg.r}
          fill="none"
          className="stroke-white/10"
          strokeWidth={cfg.strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={cfg.cx}
          cy={cfg.cy}
          r={cfg.r}
          fill="none"
          className={cn(
            RISK_STROKE[riskLevel],
            RISK_GLOW[riskLevel],
            'transition-all duration-700 ease-out',
          )}
          strokeWidth={cfg.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Score text — centered over SVG */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ top: 0, left: 0 }}
      >
        <span className={cn('font-bold tabular-nums', cfg.fontSize, RISK_TEXT[riskLevel])}>
          {progress}
        </span>
        {showLabel && (
          <span className={cn('text-slate-400 font-medium mt-0.5', cfg.labelSize)}>
            Safety Score
          </span>
        )}
      </div>
    </div>
  );
}
