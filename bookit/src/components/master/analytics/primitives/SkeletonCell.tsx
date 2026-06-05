'use client';

import { cn } from '@/lib/utils/cn';

interface SkeletonCellProps {
  variant?: 'tall' | 'wide' | 'square' | 'flat' | 'ticker';
  className?: string;
}

export function SkeletonCell({ variant = 'square', className }: SkeletonCellProps) {
  if (variant === 'ticker') {
    return (
      <div className={cn('flex gap-3 overflow-x-hidden py-1', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-12 w-32 rounded-full skeleton-shimmer flex-shrink-0 opacity-80"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bento-card p-5 relative overflow-hidden flex flex-col justify-between',
        variant === 'tall' && 'row-span-2 md:col-span-4 lg:col-span-4 min-h-[360px]',
        variant === 'wide' && 'md:col-span-6 lg:col-span-8 min-h-[220px]',
        variant === 'square' && 'md:col-span-6 lg:col-span-6 min-h-[220px]',
        variant === 'flat' && 'md:col-span-12 lg:col-span-12 min-h-[140px]',
        className
      )}
    >
      <div className="flex flex-col gap-3 w-full">
        {/* Заголовок */}
        <div className="h-4 w-1/4 rounded-md skeleton-shimmer" />
        
        {/* Вміст */}
        <div className="h-24 w-full rounded-xl skeleton-shimmer mt-2" />
      </div>

      {/* Футер */}
      <div className="h-3 w-1/3 rounded-md skeleton-shimmer mt-4" />
    </div>
  );
}
