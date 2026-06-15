import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { ConversationRow } from './ConversationRow';
import type { ConversationWithParticipant } from '@/lib/actions/messages';

interface MessagesListPageProps {
  conversations: ConversationWithParticipant[];
  userRole: 'client' | 'master';
  basePath: string;
}

export function MessagesListPage({ conversations, userRole, basePath }: MessagesListPageProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 pt-5 pb-4">
        <h1 className="heading-serif text-2xl text-foreground">Повідомлення</h1>
      </div>

      {conversations.length === 0 ? (
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
        </div>
      )}
    </div>
  );
}
