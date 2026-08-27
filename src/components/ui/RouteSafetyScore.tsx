import { useState, useEffect } from 'react';
import { cn } from '../../utils/formatters';
import type { RiskLevel } from '../../config/appConfig';

// ─── Route Safety Score Circular Gauge ──────────────────────────────────────────

interface RouteSafetyScoreProps {
  score: number;        // 0–100
  riskLevel?: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { viewBox: 90, cx: 45, cy: 45, r: 36, strokeWidth: 6, fontSize: 'text-lg', labelSize: 'text-[10px]' },
  md: { viewBox: 130, cx: 65, cy: 65, r: 52, strokeWidth: 8, fontSize: 'text-2xl', labelSize: 'text-xs' },
  lg: { viewBox: 170, cx: 85, cy: 85, r: 68, strokeWidth: 10, fontSize: 'text-3xl', labelSize: 'text-sm' },
};

export function RouteSafetyScore({
  score,
  riskLevel = 'SAFE',
  size = 'md',
  showLabel = true,
  animated = true,
  className,
}: RouteSafetyScoreProps) {
  const cfg = SIZE_CONFIG[size];
  const circumference = 2 * Math.PI * cfg.r;
  const targetScore = Math.max(0, Math.min(100, score));

  // Animated counter
  const [displayScore, setDisplayScore] = useState(animated ? 0 : targetScore);
  const [dashOffset, setDashOffset] = useState(animated ? circumference : circumference * (1 - targetScore / 100));

  useEffect(() => {
    if (!animated) {
      setDisplayScore(targetScore);
      setDashOffset(circumference * (1 - targetScore / 100));
      return;
    }

    let start = 0;
    const duration = 900;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(start + (targetScore - start) * ease);

      setDisplayScore(currentScore);
      setDashOffset(circumference * (1 - (targetScore * ease) / 100));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const handle = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(handle);
  }, [targetScore, animated, circumference]);

  // Rose-toned elegant status coloring
  const getStrokeColor = () => {
    if (targetScore >= 80) return 'stroke-primary-500';
    if (targetScore >= 60) return 'stroke-rose-400';
    return 'stroke-danger-500';
  };

  const getTextColor = () => {
    if (targetScore >= 80) return 'text-primary-700';
    if (targetScore >= 60) return 'text-rose-600';
    return 'text-danger-600';
  };

  return (
    <div className={cn('relative inline-flex flex-col items-center justify-center select-none', className)}>
      <svg
        width={cfg.viewBox}
        height={cfg.viewBox}
        viewBox={`0 0 ${cfg.viewBox} ${cfg.viewBox}`}
        className="rotate-[-90deg] transition-all duration-300"
      >
        <defs>
          <linearGradient id="scoreRoseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB7185" />
            <stop offset="100%" stopColor="#E85D75" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={cfg.cx}
          cy={cfg.cy}
          r={cfg.r}
          fill="none"
          stroke="#FCE4EC"
          strokeWidth={cfg.strokeWidth}
        />

        {/* Progress arc */}
        <circle
          cx={cfg.cx}
          cy={cfg.cy}
          r={cfg.r}
          fill="none"
          stroke="url(#scoreRoseGradient)"
          strokeWidth={cfg.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>

      {/* Centered Score details */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline justify-center">
          <span className={cn('font-extrabold tracking-tight', cfg.fontSize, getTextColor())}>
            {displayScore}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold ml-0.5">/100</span>
        </div>
        {showLabel && (
          <span className={cn('text-slate-500 font-medium tracking-tight', cfg.labelSize)}>
            Safety Score
          </span>
        )}
      </div>
    </div>
  );
}
