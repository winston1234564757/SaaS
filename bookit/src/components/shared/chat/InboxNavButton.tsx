'use client';

import { useEffect, useState, useCallback, useId } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { getInboxSummary } from '@/lib/actions/messages';
import { createClient } from '@/lib/supabase/client';

type Variant = 'icon' | 'fab' | 'row';

interface InboxNavButtonProps {
  href: string;
  variant?: Variant;
  label?: string;
  className?: string;
}

/**
 * Unified-inbox nav entry (DM + support) with a live unread badge.
 * Reused across master (topbar / hub), client (navbar / mobile) surfaces.
 * The badge re-fetches on any direct/support message change and on window focus.
 */
export function InboxNavButton({ href, variant = 'icon', label = 'Повідомлення', className = '' }: InboxNavButtonProps) {
  const [count, setCount] = useState(0);
  const channelId = useId();

  const refresh = useCallback(() => {
    getInboxSummary().then(s => setCount(s.total)).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const supabase = createClient();
    const channel = supabase
      .channel(`inbox-summary-${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, refresh)
      .subscribe();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh, channelId]);

  const badge = count > 0 ? (count > 9 ? '9+' : String(count)) : null;

  if (variant === 'row') {
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-3.5 rounded-[var(--card-radius)] border bg-[var(--surface)] border-[var(--border-strong)] hover:border-[var(--accent)] transition-colors active:scale-95 ${className}`}
      >
        <div className="relative size-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
          <MessageCircle size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <span className="flex-1 text-sm font-semibold text-[var(--text-primary)]">{label}</span>
        {badge && (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--accent)] text-[var(--accent-on)] text-[10px] font-bold flex items-center justify-center">
            {badge}
          </span>
        )}
      </Link>
    );
  }

  if (variant === 'fab') {
    return (
      <Link
        href={href}
        aria-label={label}
        className={`relative flex items-center justify-center size-12 rounded-full bg-[var(--surface)] border border-[var(--border-strong)] shadow-lg backdrop-blur-xl active:scale-90 transition-transform ${className}`}
      >
        <MessageCircle size={20} className="text-foreground" />
        {badge && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent)] text-[var(--accent-on)] text-[9px] font-bold flex items-center justify-center ring-2 ring-background">
            {badge}
          </span>
        )}
      </Link>
    );
  }

  // icon (default) — for top bars / navbars
  return (
    <Link
      href={href}
      aria-label={label}
      className={`relative flex items-center justify-center size-9 rounded-xl hover:bg-secondary/60 active:scale-[0.95] transition-all ${className}`}
    >
      <MessageCircle size={18} className="text-text-sub" />
      {badge && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--accent)] text-[var(--accent-on)] text-[9px] font-bold flex items-center justify-center ring-2 ring-[var(--surface)]">
          {badge}
        </span>
      )}
    </Link>
  );
}
