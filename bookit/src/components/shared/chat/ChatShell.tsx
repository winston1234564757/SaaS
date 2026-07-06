'use client';

import type { ReactNode } from 'react';
import { useChatViewport } from '@/lib/hooks/useChatViewport';

interface ChatShellProps {
  header: ReactNode;
  composer: ReactNode;
  /** The message list (or history overlay wrapper). */
  children: ReactNode;
  /**
   * Contained mode (desktop 2-pane): fill the parent pane with `h-full`
   * instead of a fixed full-screen frame, and skip the keyboard viewport
   * engine (no body-scroll lock). Default `false` keeps the mobile /
   * master-zone full-screen behaviour byte-identical.
   */
  contained?: boolean;
}

/**
 * Chat frame: header (pinned) → scrollable body → composer.
 *
 * Full-screen (default): fixed to the visual viewport, owns the Telegram-grade
 * keyboard engine so the root collapses above the keyboard instead of leaving a
 * dead gap. Contained: fills a bounded pane (desktop master-detail), no fixed
 * positioning, no scroll lock.
 */
export function ChatShell({ header, composer, children, contained = false }: ChatShellProps) {
  const { height, offsetTop } = useChatViewport(!contained);

  if (contained) {
    return (
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
        {header}
        {children}
        {composer}
      </div>
    );
  }

  return (
    // Pinned to the visual viewport (top-left), height driven by the keyboard
    // engine. `fixed` makes the frame immune to page scroll and any parent
    // padding, so the header safe-area inset is the single source of truth.
    // translateY(offsetTop) compensates the iOS keyboard pan so the text caret
    // stays inside the input instead of floating above it.
    <div
      className="fixed inset-x-0 top-0 z-40 flex flex-col overflow-hidden bg-background text-foreground"
      style={{
        height: height ? `${height}px` : '100dvh',
        transform: `translateY(${offsetTop}px)`,
      }}
    >
      {header}
      {children}
      {composer}
    </div>
  );
}
