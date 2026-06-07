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
        'flex flex-col items-center justify-center text-center p-6 min-h-[200px] h-full w-full bg-secondary/30 backdrop-blur-sm rounded-[24px] border border-white/40 shadow-sm relative overflow-hidden',
        className
      )}
      {...props}
    >
      {/* М'який декоративний глоу на фоні клітинки */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none" />

      <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 drop-shadow-sm border border-primary/20 relative z-10">
        {icon ?? <Sparkles size={24} />}
      </div>
      
      <p className="text-base font-bold text-foreground mb-1.5 relative z-10">{title}</p>
      <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed mb-5 relative z-10">
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
