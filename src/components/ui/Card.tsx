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
        glass ? 'glass-card' : 'bg-white rounded-3xl border border-primary-100 shadow-card',
        hover && 'glass-card-hover cursor-pointer hover:border-primary-300 hover:shadow-card-hover',
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
    <div className={cn('px-6 pt-6 pb-3', className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 pb-6', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 pb-6 pt-4 border-t border-primary-100/70', className)}>
      {children}
    </div>
  );
}
