'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Send, Loader2, UserPlus, Link2 } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import {
  getMessageableContacts,
  getOrCreateConversation,
  type MessageableContact,
  type MessageableContacts,
} from '@/lib/actions/messages';

interface NewConversationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where a started conversation opens, e.g. /dashboard/messages or /my/messages */
  basePath: string;
}

function inviteMessage(link: string): string {
  return `Привіт! Це запрошення в BookIT: тут ти бачиш свої записи, нагадування й бонуси. Приєднуйся: ${link}`;
}

function Avatar({ contact }: { contact: MessageableContact }) {
  const initials = contact.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  return contact.avatarUrl ? (
    <Image src={contact.avatarUrl} alt={contact.name} width={40} height={40} className="size-10 rounded-full object-cover shrink-0" />
  ) : (
    <div className="size-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
      <span className="text-xs font-semibold text-accent">{initials}</span>
    </div>
  );
}

export function NewConversationSheet({ open, onOpenChange, basePath }: NewConversationSheetProps) {
  const router = useRouter();
  const [data, setData] = useState<MessageableContacts | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [pending, start] = useTransition();
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getMessageableContacts()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [open]);

  const openConversation = (userId: string) => {
    setOpeningId(userId);
    start(async () => {
      const conv = await getOrCreateConversation(userId);
      if (conv) {
        onOpenChange(false);
        router.push(`${basePath}/${conv.id}`);
      } else {
        setOpeningId(null);
      }
    });
  };

  const invite = async (contact: MessageableContact) => {
    const link = `${window.location.origin}/register`;
    const text = inviteMessage(link);
    // Prefer native share; fall back to Telegram deep-link by phone; then clipboard.
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch { /* cancelled */ }
    }
    if (contact.phone) {
      const digits = contact.phone.replace(/\D/g, '');
      window.open(`https://t.me/+${digits}`, '_blank');
      navigator.clipboard?.writeText(text).catch(() => {});
      return;
    }
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  const q = query.trim().toLowerCase();
  const match = (c: MessageableContact) => !q || c.name.toLowerCase().includes(q);
  const contacts = (data?.contacts ?? []).filter(match);
  const invitable = (data?.invitable ?? []).filter(match);
  const isMaster = data?.role === 'master';

  const contactsHeader = isMaster ? 'Твої клієнти в BookIT' : 'Майстри, до яких ти звертався';
  const emptyText = isMaster
    ? 'Тут з\'являться клієнти, коли вони запишуться'
    : 'Запишись до майстра, щоб почати розмову';

  const nothing = !loading && contacts.length === 0 && invitable.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Нова розмова" variant="adaptive" maxWidth="md">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-sub" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Пошук за іменем"
            aria-label="Пошук за іменем"
            className="w-full h-11 pl-10 pr-4 text-sm bg-secondary border border-border rounded-2xl outline-none focus:ring-2 focus:ring-accent/25 text-foreground placeholder:text-text-sub"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-accent" />
          </div>
        ) : nothing ? (
          <p className="text-center text-sm text-text-sub py-10 px-6">
            {q ? 'Нічого не знайшлося' : emptyText}
          </p>
        ) : (
          <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto scrollbar-hide">
            {/* Account contacts → open a DM */}
            {contacts.length > 0 && (
              <section className="flex flex-col gap-1">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-sub px-1 pb-1">{contactsHeader}</h3>
                {contacts.map(c => (
                  <button
                    key={c.userId}
                    type="button"
                    disabled={pending}
                    onClick={() => c.userId && openConversation(c.userId)}
                    className="flex items-center gap-3 p-2 rounded-2xl hover:bg-secondary active:scale-[0.99] transition text-left disabled:opacity-60"
                  >
                    <Avatar contact={c} />
                    <span className="flex-1 text-sm font-semibold text-foreground truncate">{c.name}</span>
                    {openingId === c.userId
                      ? <Loader2 size={16} className="animate-spin text-accent" />
                      : <Send size={15} className="text-text-sub" />}
                  </button>
                ))}
              </section>
            )}

            {/* Invite candidates (master only) → share / telegram */}
            {isMaster && invitable.length > 0 && (
              <section className="flex flex-col gap-1">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-sub px-1 pb-1">Запросити в BookIT</h3>
                {invitable.map((c, i) => (
                  <div key={`${c.phone}-${i}`} className="flex items-center gap-3 p-2 rounded-2xl">
                    <div className="size-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <UserPlus size={17} className="text-text-sub" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                      <p className="text-[11px] text-text-sub truncate">Немає акаунта. Надішли запрошення</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => invite(c)}
                      className="flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-full bg-accent/10 text-accent text-xs font-bold active:scale-[0.95] transition"
                    >
                      <Link2 size={13} /> Запросити
                    </button>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
