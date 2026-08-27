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
  primary:   'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white shadow-soft-pink hover:shadow-glow-primary border border-primary-400/40 hover:-translate-y-0.5 active:scale-[0.98]',
  secondary: 'bg-white hover:bg-blush-100 text-slate-800 border border-pink-200/70 shadow-sm hover:shadow-card hover:-translate-y-0.5 active:scale-[0.98]',
  danger:    'bg-danger-600 hover:bg-danger-700 text-white shadow-glow-danger/25 hover:shadow-glow-danger hover:-translate-y-0.5 active:scale-[0.98]',
  safe:      'bg-safe-600 hover:bg-safe-700 text-white shadow-glow-safe/25 hover:-translate-y-0.5 active:scale-[0.98]',
  ghost:     'bg-transparent hover:bg-primary-50 text-slate-700 hover:text-primary-700 active:scale-[0.98]',
  outline:   'bg-white/80 hover:bg-primary-50/70 border border-primary-200 text-primary-600 hover:text-primary-700 hover:border-primary-300 shadow-sm hover:-translate-y-0.5 active:scale-[0.98]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-xs rounded-xl font-medium',
  md: 'px-5 py-2.5 text-sm rounded-2xl font-semibold',
  lg: 'px-6.5 py-3.5 text-base rounded-2xl font-bold',
  xl: 'px-8 py-4 text-lg rounded-3xl font-bold',
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
