'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorCellProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: string | Error;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function ErrorCell({
  error,
  onRetry,
  isRetrying = false,
  className,
  ...props
}: ErrorCellProps) {
  const errorMessage = error
    ? typeof error === 'string'
      ? error
      : error.message
    : 'Помилка завантаження даних';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-5 min-h-[180px] h-full w-full bg-destructive/5 rounded-[20px] border border-destructive/20',
        className
      )}
      {...props}
    >
      <div className="size-10 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-3">
        <AlertCircle size={20} />
      </div>

      <p className="text-xs font-semibold text-destructive mb-1">Помилка завантаження</p>
      <p className="text-[11px] text-muted-foreground max-w-[200px] leading-normal mb-4 truncate-2-lines">
        {errorMessage}
      </p>

      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-secondary hover:bg-secondary-hover border border-border-strong text-foreground text-xs font-semibold active:scale-[0.95] disabled:opacity-50 transition-all duration-100 cursor-pointer"
      >
        <RefreshCw size={12} className={isRetrying ? 'animate-spin' : ''} />
        Спробувати знову
      </button>
    </div>
  );
}
