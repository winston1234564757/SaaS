'use client';

import { cn } from '@/lib/utils/cn';

interface StatusDotProps {
  status?: 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export function StatusDot({ status = 'info', className }: StatusDotProps) {
  return (
    <span className={cn('relative flex size-2', className)}>
      <span
        className={cn(
          'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
          status === 'success' && 'bg-success',
          status === 'warning' && 'bg-warning',
          status === 'error' && 'bg-destructive',
          status === 'info' && 'bg-info'
        )}
      />
      <span
        className={cn(
          'relative inline-flex rounded-full size-2',
          status === 'success' && 'bg-success',
          status === 'warning' && 'bg-warning',
          status === 'error' && 'bg-destructive',
          status === 'info' && 'bg-info'
        )}
      />
    </span>
  );
}
