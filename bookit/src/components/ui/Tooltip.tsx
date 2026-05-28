'use client';

import * as RadixTooltip from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils/cn';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}

export function Tooltip({ content, children, position = 'top', className, delay = 200 }: TooltipProps) {
  // Skip portal entirely when there's no content — avoid empty DOM nodes
  if (!content) {
    return <div className={cn('inline-flex', className)}>{children}</div>;
  }

  return (
    <RadixTooltip.Provider delayDuration={delay} skipDelayDuration={100}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          <div className={cn('inline-flex', className)}>
            {children}
          </div>
        </RadixTooltip.Trigger>

        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={position}
            sideOffset={8}
            collisionPadding={16}
            className={cn(
              'z-[9999] pointer-events-none select-none',
              // Glassmorphism
              'bg-white/90 backdrop-blur-xl',
              'border border-white/70',
              'shadow-[0_8px_30px_rgb(0,0,0,0.14)]',
              'text-foreground rounded-2xl p-4',
              // Radix animations
              'origin-[--radix-tooltip-content-transform-origin]',
              'data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            )}
          >
            {content}
            <RadixTooltip.Arrow className="fill-white/90" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
