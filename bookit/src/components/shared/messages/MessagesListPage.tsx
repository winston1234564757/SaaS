import Link from 'next/link';
import { MessageCircle, LifeBuoy } from 'lucide-react';
import { ConversationRow } from './ConversationRow';
import { NewConversationButton } from '@/components/shared/chat/NewConversationButton';
import type { ConversationWithParticipant } from '@/lib/actions/messages';

interface MessagesListPageProps {
  conversations: ConversationWithParticipant[];
  userRole: 'client' | 'master';
  basePath: string;
  /** Support conversation state for the pinned row; null hides it. */
  supportRow?: { status: string; hasReply: boolean } | null;
  supportHref?: string;
}

export function MessagesListPage({
  conversations,
  userRole,
  basePath,
  supportRow = null,
  supportHref = '/dashboard/support/chat',
}: MessagesListPageProps) {
  const hasConversations = conversations.length > 0;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 pt-5 pb-4 flex items-center justify-between gap-3">
        <h1 className="heading-serif text-2xl text-foreground">Повідомлення</h1>
        <NewConversationButton basePath={basePath} />
      </div>

      {/* Pinned support row — always available inbox entry to the BookIT team */}
      {supportRow && (
        <Link
          href={supportHref}
          className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40 active:bg-secondary/60 transition-colors min-h-[72px] bg-accent/[0.03]"
        >
          <div className="relative size-11 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
            <LifeBuoy size={20} className="text-accent" />
            {supportRow.hasReply && (
              <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-[var(--warning)] ring-2 ring-background" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-foreground truncate">Підтримка BookIT</p>
              {supportRow.hasReply && (
                <span className="text-[10px] text-accent font-semibold shrink-0">Нова відповідь</span>
              )}
            </div>
            <p className={`text-xs mt-0.5 truncate ${supportRow.hasReply ? 'text-foreground/80 font-medium' : 'text-foreground/55'}`}>
              {supportRow.hasReply ? 'Команда підтримки відповіла тобі' : 'Команда BookIT на звʼязку'}
            </p>
          </div>
        </Link>
      )}

      {!hasConversations && !supportRow ? (
        <div className="flex flex-col items-center gap-4 pt-16 px-8 text-center">
          <div className="size-16 rounded-full bg-accent/10 flex items-center justify-center">
            <MessageCircle size={28} className="text-accent/60" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {userRole === 'client' ? 'Поки що жодних розмов' : 'Клієнти ще не написали'}
          </p>
          <p className="text-xs text-muted-foreground/60 max-w-[220px]">
            {userRole === 'client'
              ? 'Запишіться до майстра і почніть спілкування'
              : 'Ваші розмови з клієнтами з\'являться тут'}
          </p>
          {userRole === 'client' && (
            <Link
              href="/my/bookings"
              className="h-11 px-5 rounded-full bg-accent text-accent-foreground text-sm font-semibold flex items-center"
            >
              Мої записи
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          {conversations.map(conv => (
            <ConversationRow
              key={conv.id}
              participantName={conv.participant.name}
              participantAvatarUrl={conv.participant.avatarUrl}
              lastMessage={conv.lastMessage}
              lastMessageAt={conv.lastMessageAt}
              unreadCount={conv.unreadCount}
              href={`${basePath}/${conv.id}`}
            />
          ))}
          {!hasConversations && supportRow && (
            <p className="text-center text-xs text-foreground/50 py-10 px-8">
              {userRole === 'client'
                ? 'Запишись до майстра, щоб почати розмову'
                : 'Розмови з клієнтами з\'являться тут'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
