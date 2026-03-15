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
          <label htmlFor={inputId} className="text-sm font-medium text-[#2C1A14]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3.5 text-[#A8928D] pointer-events-none">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-12 px-4 rounded-xl text-base text-[#2C1A14] placeholder:text-[#A8928D]',
              'bg-white/75 border border-white/80 backdrop-blur-sm',
              'transition-all duration-200',
              'focus:outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20',
              error && 'border-[#C05B5B] focus:border-[#C05B5B] focus:ring-[#C05B5B]/15',
              prefix && 'pl-10',
              suffix && 'pr-10',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3.5 text-[#A8928D]">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-[#C05B5B]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#A8928D]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
