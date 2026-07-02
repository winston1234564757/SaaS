'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface ChatHeaderProps {
  /** Avatar node — an <Image>, initials circle, or icon badge. */
  avatar?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  /** Back as a router action (Support) … */
  onBack?: () => void;
  /** … or as a link (DM). `onBack` wins if both are set. */
  backHref?: string;
  /** Right-aligned action(s), e.g. conversation history. */
  action?: ReactNode;
}

/**
 * Pinned chat header shared by every full-screen chat. Owns the safe-area top
 * inset itself so it never slides under the iOS status bar / notch, regardless
 * of how the surrounding layout is padded.
 */
export function ChatHeader({ avatar, title, subtitle, onBack, backHref, action }: ChatHeaderProps) {
  const backClass =
    'flex items-center justify-center size-11 shrink-0 rounded-full border border-border hover:bg-secondary active:scale-[0.95] transition-all';

  return (
    <header className="shrink-0 z-20 border-b border-border bg-background/95 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-3 px-4 py-3">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label="Назад" className={`${backClass} cursor-pointer`}>
            <ChevronLeft className="size-5 text-foreground" />
          </button>
        ) : backHref ? (
          <Link href={backHref} aria-label="Назад" className={backClass}>
            <ChevronLeft className="size-5 text-foreground" />
          </Link>
        ) : null}

        {avatar}

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold leading-tight text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-[11px] font-medium text-foreground/60 truncate">{subtitle}</p>
          )}
        </div>

        {action}
      </div>
    </header>
  );
}
