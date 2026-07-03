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

/**
 * Button — канонічна кнопка дизайн-мови (DESIGN_LANGUAGE.md).
 * Ієрархія дій: `primary` = темний slate-домінант (одна на поверхню) · `secondary` = hairline
 * тиха · `ghost` = майже невидима · `danger` = деструктив тінтом. Sentence-case (не uppercase),
 * rounded-xl, тактильний whileTap. Радіус узгоджено з картками (не pill — pill лишається пілам/чіпам).
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--btn-primary-bg)] text-[var(--accent-on)] shadow-sm hover:opacity-90 active:opacity-80',
  secondary:
    'bg-secondary/60 border border-border text-foreground hover:bg-secondary',
  ghost:
    'bg-transparent text-text-sub hover:text-foreground hover:bg-secondary/50',
  danger:
    'bg-destructive/10 text-destructive hover:bg-destructive/16',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-10 px-4  text-[13px] rounded-lg  gap-1.5',
  md: 'h-12 px-5  text-sm    rounded-xl  gap-2',
  lg: 'h-14 px-6  text-sm    rounded-xl  gap-2.5',
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
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        data-state={isLoading ? 'loading' : undefined}
        className={cn(
          'inline-flex items-center justify-center cursor-pointer select-none font-bold',
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
          <span className="inline-block size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
