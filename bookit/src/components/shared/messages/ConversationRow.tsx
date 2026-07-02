import Link from 'next/link';
import Image from 'next/image';

interface ConversationRowProps {
  participantName: string;
  participantAvatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  href: string;
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

export function ConversationRow({
  participantName,
  participantAvatarUrl,
  lastMessage,
  lastMessageAt,
  unreadCount,
  href,
}: ConversationRowProps) {
  const initials = participantName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3.5 border-b border-border/40 last:border-0 active:bg-secondary/60 transition-colors min-h-[72px] ${
        unreadCount > 0 ? 'bg-accent/[0.04]' : ''
      }`}
    >
      <div className="relative shrink-0">
        {participantAvatarUrl ? (
          <Image
            src={participantAvatarUrl}
            alt={participantName}
            width={44}
            height={44}
            className="rounded-full object-cover size-11"
          />
        ) : (
          <div className="size-11 rounded-full bg-accent/15 flex items-center justify-center">
            <span className="text-sm font-semibold text-accent">{initials}</span>
          </div>
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center px-1 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
            {participantName}
          </p>
          <span className={`text-[10px] shrink-0 ${unreadCount > 0 ? 'text-accent font-semibold' : 'text-foreground/45'}`}>
            {fmtTime(lastMessageAt)}
          </span>
        </div>
        <p className={`text-xs mt-0.5 truncate ${unreadCount > 0 ? 'text-foreground/80 font-medium' : 'text-foreground/55'}`}>
          {lastMessage ?? 'Почніть розмову'}
        </p>
      </div>
    </Link>
  );
}
