'use client';

import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--btn-primary-bg)] text-[var(--accent-on)] hover:opacity-90 active:opacity-80 btn-primary-shadow',
  secondary:
    'bg-transparent text-[var(--text-secondary)] border border-[var(--border-strong)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]',
  ghost:
    'bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
  danger:
    'bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/18',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9  px-5  text-[11px] tracking-[0.08em] uppercase font-semibold rounded-lg gap-1.5',
  md: 'h-11 px-6  text-[12px] tracking-[0.09em] uppercase font-semibold rounded-lg gap-2',
  lg: 'h-14 px-8  text-[13px] tracking-[0.09em] uppercase font-semibold rounded-lg gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        data-state={isLoading ? 'loading' : undefined}
        className={cn(
          'inline-flex items-center justify-center cursor-pointer select-none',
          'transition-all duration-200',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
