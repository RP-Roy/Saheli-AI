import React from 'react';
import { cn } from '../../utils/formatters';

// ─── Card Component ───────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  hover?: boolean;
  onClick?: () => void;
  as?: React.ElementType;
}

export function Card({ children, className, glass = true, hover = false, onClick, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      onClick={onClick}
      className={cn(
        glass ? 'glass-card' : 'bg-surface-800 rounded-2xl border border-white/10',
        hover && 'hover:border-primary-500/30 hover:shadow-glow-primary/10 transition-all duration-300 cursor-pointer',
        onClick && 'cursor-pointer',
        'animate-fade-in',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

// ─── Card subcomponents ───────────────────────────────────────────────────────

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 pt-5 pb-3', className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 pb-5', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 pb-5 pt-3 border-t border-white/10', className)}>
      {children}
    </div>
  );
}
