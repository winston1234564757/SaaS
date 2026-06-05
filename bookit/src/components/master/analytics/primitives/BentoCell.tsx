'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { ProUpgradeCard } from './ProUpgradeCard';

interface BentoCellProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: 'tall' | 'wide' | 'square' | 'flat';
  isProGate?: boolean;
}

export function BentoCell({
  children,
  className,
  variant = 'square',
  isProGate = false,
  ...props
}: BentoCellProps) {
  if (isProGate) {
    return (
      <div
        className={cn(
          'col-span-1',
          variant === 'tall' && 'row-span-2 md:col-span-4 lg:col-span-4',
          variant === 'wide' && 'md:col-span-6 lg:col-span-8',
          variant === 'square' && 'md:col-span-6 lg:col-span-6',
          variant === 'flat' && 'md:col-span-12 lg:col-span-12',
          className
        )}
      >
        <ProUpgradeCard />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bento-card p-5 relative overflow-hidden flex flex-col',
        variant === 'tall' && 'row-span-2 md:col-span-4 lg:col-span-4 min-h-[360px]',
        variant === 'wide' && 'md:col-span-6 lg:col-span-8 min-h-[220px]',
        variant === 'square' && 'md:col-span-6 lg:col-span-6 min-h-[220px]',
        variant === 'flat' && 'md:col-span-12 lg:col-span-12 min-h-[140px]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
