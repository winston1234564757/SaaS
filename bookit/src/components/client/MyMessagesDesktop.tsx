'use client';

import { useState, useCallback, useTransition } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { LifeBuoy, MessageCircle, Plus, Loader2 } from 'lucide-react';
import { DirectChatPage } from '@/components/shared/messages/DirectChatPage';
import { SupportChatPage } from '@/components/shared/support/SupportChatPage';
import { getOrCreateConversation, type ConversationWithParticipant } from '@/lib/actions/messages';
import type { RailMaster } from '@/components/shared/messages/MastersRail';
import { cn } from '@/lib/utils/cn';

const SPRING = { type: 'spring', stiffness: 320, damping: 30 } as const;

type Selection =
  | { kind: 'support' }
  | { kind: 'dm'; conversationId: string; name: string; avatarUrl: string | null };

interface MyMessagesDesktopProps {
  userId: string;
  conversations: ConversationWithParticipant[];
  /** BookIT support inbox row; null hides it. */
  supportRow: { status: string; hasReply: boolean } | null;
  /** Active support chat ticket to open in the pane; null starts a fresh one. */
  supportInitialTicketId: string | null;
  /** Masters the client has visited but has no conversation with yet. */
  masters: RailMaster[];
}

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'вчора';
  if (diffDays < 7) return d.toLocaleDateString('uk', { weekday: 'short' });
  return d.toLocaleDateString('uk', { day: 'numeric', month: 'short' });
}

function initialsOf(name: string): string {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      <Image src={url} alt="" width={44} height={44} className="size-11 rounded-full object-cover shrink-0" />
    );
  }
  return (
    <div className="size-11 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
      <span className="text-sm font-semibold text-accent">{initialsOf(name)}</span>
    </div>
  );
}

function SupportRow({
  hasReply, selected, onSelect,
}: { hasReply: boolean; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'w-full flex items-center gap-3 px-5 py-3.5 text-left border-b border-border/40 transition-colors duration-150',
        selected ? 'bg-secondary' : 'hover:bg-secondary/40',
      )}
    >
      <div className="relative size-11 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
        <LifeBuoy size={20} className="text-accent" />
        {hasReply && (
          <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-[var(--warning)] ring-2 ring-background" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-foreground truncate">Підтримка BookIT</p>
          {hasReply && <span className="text-[10px] text-accent font-semibold shrink-0">Нова відповідь</span>}
        </div>
        <p className={cn('text-xs mt-0.5 truncate', hasReply ? 'text-foreground/80 font-medium' : 'text-text-sub')}>
          {hasReply ? 'Команда підтримки відповіла тобі' : 'Команда BookIT на звʼязку'}
        </p>
      </div>
    </button>
  );
}

function ConversationRow({
  conv, unread, selected, onSelect,
}: { conv: ConversationWithParticipant; unread: number; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'w-full flex items-center gap-3 px-5 py-3.5 text-left border-b border-border/40 transition-colors duration-150',
        selected ? 'bg-secondary' : 'hover:bg-secondary/40',
      )}
    >
      <div className="relative shrink-0">
        <Avatar url={conv.participant.avatarUrl} name={conv.participant.name} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center px-1 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn('text-sm truncate', unread > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground')}>
            {conv.participant.name}
          </p>
          <span className={cn('text-[10px] shrink-0', unread > 0 ? 'text-accent font-semibold' : 'text-text-sub')}>
            {fmtTime(conv.lastMessageAt)}
          </span>
        </div>
        <p className={cn('text-xs mt-0.5 truncate', unread > 0 ? 'text-foreground/80 font-medium' : 'text-text-sub')}>
          {conv.lastMessage ?? 'Почніть розмову'}
        </p>
      </div>
    </button>
  );
}

function MasterRow({
  master, busy, onSelect,
}: { master: RailMaster; busy: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={busy}
      className="group w-full flex items-center gap-3 px-5 py-3 text-left transition-colors duration-150 hover:bg-secondary/40 disabled:opacity-60"
    >
      <Avatar url={master.avatarUrl} name={master.name} />
      <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">{master.name}</span>
      <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-text-sub shrink-0 transition-colors group-hover:text-foreground">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
      </span>
    </button>
  );
}

function EmptyPane() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="size-16 rounded-full bg-secondary flex items-center justify-center">
        <MessageCircle size={28} className="text-text-sub" />
      </div>
      <div>
        <p className="heading-serif text-xl text-foreground">Оберіть розмову</p>
        <p className="text-sm text-text-sub mt-1 max-w-[280px] leading-relaxed">
          Виберіть діалог ліворуч, щоб продовжити спілкування
        </p>
      </div>
    </div>
  );
}

/**
 * Desktop (lg+) two-pane messenger for the client zone. Left: selectable inbox
 * (support + conversations + "написати майстру"). Right: the active thread,
 * rendered contained via `inPane`. Selection is client-side (no route change)
 * and mirrored into `?c=` so a thread is deep-linkable and survives refresh.
 * Mobile keeps list→route and is rendered separately (`lg:hidden`).
 */
export function MyMessagesDesktop({
  userId, conversations, supportRow, supportInitialTicketId, masters,
}: MyMessagesDesktopProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const [selection, setSelection] = useState<Selection | null>(() => {
    const c = searchParams.get('c');
    if (!c) return null;
    if (c === 'support') return supportRow ? { kind: 'support' } : null;
    const conv = conversations.find(x => x.id === c);
    return conv
      ? { kind: 'dm', conversationId: conv.id, name: conv.participant.name, avatarUrl: conv.participant.avatarUrl }
      : null;
  });
  // Conversations opened this session → unread cleared optimistically (the DB
  // is cleared by the thread's markConversationRead; this keeps the list honest
  // without a refetch).
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const setParam = useCallback((c: string | null) => {
    const sp = new URLSearchParams(Array.from(searchParams.entries()));
    if (c) sp.set('c', c); else sp.delete('c');
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const selectSupport = () => {
    setSelection({ kind: 'support' });
    setParam('support');
  };

  const selectConversation = (conv: ConversationWithParticipant) => {
    setSelection({ kind: 'dm', conversationId: conv.id, name: conv.participant.name, avatarUrl: conv.participant.avatarUrl });
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(conv.id);
      return next;
    });
    setParam(conv.id);
  };

  const writeToMaster = (master: RailMaster) => {
    if (creatingId) return;
    setCreatingId(master.id);
    startTransition(async () => {
      const conv = await getOrCreateConversation(master.id);
      setCreatingId(null);
      if (!conv) return;
      setSelection({ kind: 'dm', conversationId: conv.id, name: master.name, avatarUrl: master.avatarUrl });
      setParam(conv.id);
      // Refresh so the new conversation joins the list and the master leaves the
      // "написати майстру" section. Client state (selection) survives a refresh.
      router.refresh();
    });
  };

  const paneKey = selection === null
    ? 'empty'
    : selection.kind === 'support' ? 'support' : `dm:${selection.conversationId}`;

  const hasList = !!supportRow || conversations.length > 0 || masters.length > 0;

  return (
    <div className="hidden lg:grid lg:grid-cols-[minmax(320px,380px)_1fr] h-[100dvh] overflow-hidden bg-background">
      {/* LEFT - inbox */}
      <aside className="flex min-h-0 flex-col border-r border-border bg-background">
        <div className="shrink-0 px-5 pt-6 pb-4 border-b border-border">
          <h1 className="heading-serif text-2xl text-foreground">Повідомлення</h1>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          {supportRow && (
            <SupportRow
              hasReply={supportRow.hasReply}
              selected={selection?.kind === 'support'}
              onSelect={selectSupport}
            />
          )}

          {conversations.map(conv => {
            const unread = readIds.has(conv.id) ? 0 : conv.unreadCount;
            return (
              <ConversationRow
                key={conv.id}
                conv={conv}
                unread={unread}
                selected={selection?.kind === 'dm' && selection.conversationId === conv.id}
                onSelect={() => selectConversation(conv)}
              />
            );
          })}

          {masters.length > 0 && (
            <div className="pt-2 pb-4">
              <p className="px-5 pt-3 pb-1.5 text-xs font-semibold text-text-sub">Написати майстру</p>
              {masters.map(m => (
                <MasterRow key={m.id} master={m} busy={creatingId === m.id} onSelect={() => writeToMaster(m)} />
              ))}
            </div>
          )}

          {!hasList && (
            <div className="flex flex-col items-center gap-3 px-8 pt-16 text-center">
              <div className="size-14 rounded-full bg-secondary flex items-center justify-center">
                <MessageCircle size={24} className="text-text-sub" />
              </div>
              <p className="text-sm font-semibold text-foreground">Поки що жодних розмов</p>
              <p className="text-xs text-text-sub max-w-[220px] leading-relaxed">
                Запишіться до майстра, щоб почати спілкування
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT - active thread */}
      <section className="relative min-w-0 min-h-0">
        <motion.div
          key={paneKey}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="h-full"
        >
          {selection === null ? (
            <EmptyPane />
          ) : selection.kind === 'support' ? (
            <SupportChatPage
              user={{ id: userId }}
              userRole="client"
              initialTicketId={supportInitialTicketId}
              inPane
            />
          ) : (
            <DirectChatPage
              conversationId={selection.conversationId}
              userId={userId}
              participantName={selection.name}
              participantAvatarUrl={selection.avatarUrl}
              userRole="client"
              backHref="/my/messages"
              inPane
            />
          )}
        </motion.div>
      </section>
    </div>
  );
}
