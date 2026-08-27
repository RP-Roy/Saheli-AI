import React from 'react';
import { cn } from '../../utils/formatters';

// ─── Button Component ─────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'safe';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:   'bg-primary-600 hover:bg-primary-500 text-white shadow-glow-primary/30 hover:shadow-glow-primary',
  secondary: 'bg-surface-600 hover:bg-surface-500 text-slate-200 border border-white/10',
  danger:    'bg-danger-600 hover:bg-danger-500 text-white shadow-glow-danger/30 hover:shadow-glow-danger',
  safe:      'bg-safe-600 hover:bg-safe-500 text-white shadow-glow-safe/30 hover:shadow-glow-safe',
  ghost:     'bg-transparent hover:bg-white/5 text-slate-300 hover:text-white',
  outline:   'bg-transparent border border-primary-500/50 hover:border-primary-400 text-primary-300 hover:text-primary-200',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
  xl: 'px-8 py-4 text-lg rounded-2xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'btn font-semibold transition-all duration-200',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        (loading || disabled) && 'opacity-60 cursor-not-allowed pointer-events-none',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
