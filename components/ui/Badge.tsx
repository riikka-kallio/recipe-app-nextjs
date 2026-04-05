import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'active';
  onClick?: () => void;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  onClick,
  className,
}) => {
  const variants = {
    default: 'bg-neutral-light text-neutral-text hover:bg-neutral-light/80',
    active: 'bg-forest-600 text-white',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
        'transition-all duration-150',
        onClick && 'cursor-pointer hover:scale-105',
        variants[variant],
        className
      )}
      onClick={onClick}
    >
      {children}
    </span>
  );
};
