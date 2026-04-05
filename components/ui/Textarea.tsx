import React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, fullWidth = false, className, ...props }, ref) => {
    return (
      <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-medium text-neutral-heading">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'px-4 py-2 border border-neutral-light rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent',
            'placeholder:text-neutral-text/50',
            'transition-all duration-150',
            'resize-vertical min-h-[100px]',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
