'use client';

import type { ReactNode } from 'react';
import { useChatViewport } from '@/lib/hooks/useChatViewport';

interface ChatShellProps {
  header: ReactNode;
  composer: ReactNode;
  /** The message list (or history overlay wrapper). */
  children: ReactNode;
}

/**
 * Full-screen chat frame: header (pinned, safe-area) → scrollable body →
 * composer (safe-area). Owns the Telegram-grade viewport engine so the root
 * collapses to the area above the keyboard instead of leaving a dead gap.
 */
export function ChatShell({ header, composer, children }: ChatShellProps) {
  const viewportHeight = useChatViewport();

  return (
    // Pinned to the visual viewport (top-left), height driven by the keyboard
    // engine. `fixed` makes the frame immune to page scroll and any parent
    // padding, so the header safe-area inset is the single source of truth.
    <div
      className="fixed inset-x-0 top-0 z-40 flex flex-col overflow-hidden bg-background text-foreground"
      style={{ height: viewportHeight ? `${viewportHeight}px` : '100dvh' }}
    >
      {header}
      {children}
      {composer}
    </div>
  );
}
