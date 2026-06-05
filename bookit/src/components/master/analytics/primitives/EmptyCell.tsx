'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

interface EmptyCellProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  icon?: React.ReactNode;
}

export function EmptyCell({
  title,
  description,
  actionLabel,
  actionHref,
  onActionClick,
  icon,
  className,
  ...props
}: EmptyCellProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-6 min-h-[200px] h-full w-full bg-secondary/20 rounded-[20px] border border-dashed border-border-strong',
        className
      )}
      {...props}
    >
      <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
        {icon ?? <Sparkles size={20} />}
      </div>
      
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed mb-4">
        {description}
      </p>

      {actionLabel && (
        <>
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary text-accent-on text-xs font-semibold hover:opacity-90 active:scale-[0.95] transition-all duration-100 shadow-sm cursor-pointer"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onActionClick}
              className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary text-accent-on text-xs font-semibold hover:opacity-90 active:scale-[0.95] transition-all duration-100 shadow-sm cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}
