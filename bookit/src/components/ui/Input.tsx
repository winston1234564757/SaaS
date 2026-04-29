import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3.5 text-muted-foreground pointer-events-none">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-12 px-4 rounded-xl text-base text-foreground placeholder:text-muted-foreground',
              'bg-secondary/70 border border-border backdrop-blur-sm',
              'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
              error && 'border-destructive focus:border-destructive focus:ring-destructive/15',
              prefix && 'pl-10',
              suffix && 'pr-10',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3.5 text-muted-foreground">
              {suffix}
            </div>
          )}
        </div>
        {error && <p id={`${inputId}-error`} className="text-xs text-destructive">{error}</p>}
        {hint && !error && <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
