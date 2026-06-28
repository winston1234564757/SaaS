'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Users, Trash2, ExternalLink, Handshake, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { removePartner, togglePartnerVisibility, toggleAllianceVisibility } from '@/lib/actions/partners';
import Link from 'next/link';

interface Partner {
  id: string;
  partnerId: string;
  status: 'pending' | 'accepted';
  createdAt: string;
  slug: string;
  name: string;
  emoji: string;
  isVisible: boolean;
}

interface Alliance {
  id: string;
  isVisible: boolean;
  otherId: string;
  slug: string;
  name: string;
  emoji: string;
}

interface Props {
  partners: Partner[];
  inviteLink: string;
  alliances?: Alliance[];
  isDrawer?: boolean;
}

export function PartnersPage({ partners, inviteLink, alliances = [], isDrawer }: Props) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [partnerVisibility, setPartnerVisibility] = useState<Record<string, boolean>>(
    () => Object.fromEntries(partners.map(p => [p.id, p.isVisible]))
  );
  const [allianceVisibility, setAllianceVisibility] = useState<Record<string, boolean>>(
    () => Object.fromEntries(alliances.map(a => [a.id, a.isVisible]))
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (partnerId: string) => {
    if (!confirm('Видалити майстра з мережі партнерів?')) return;
    setIsDeleting(partnerId);
    await removePartner(partnerId);
    setIsDeleting(null);
  };

  const handleTogglePartnerVisibility = async (partnerRowId: string) => {
    const next = !partnerVisibility[partnerRowId];
    setPartnerVisibility(prev => ({ ...prev, [partnerRowId]: next }));
    setTogglingId(partnerRowId);
    await togglePartnerVisibility(partnerRowId, next);
    setTogglingId(null);
  };

  const handleToggleAllianceVisibility = async (allianceId: string) => {
    const next = !allianceVisibility[allianceId];
    setAllianceVisibility(prev => ({ ...prev, [allianceId]: next }));
    setTogglingId(allianceId);
    await toggleAllianceVisibility(allianceId, next);
    setTogglingId(null);
  };

  const activePartners = partners.filter(p => p.status === 'accepted');

  // M-GROW-02: партнери + альянси = одна мережа звʼязків. Partner removable, alliance immutable.
  type Conn = {
    rowId: string; otherId: string; name: string; slug: string; emoji: string;
    isVisible: boolean; origin: 'partner' | 'alliance';
  };
  const connections: Conn[] = [
    ...activePartners.map((p): Conn => ({
      rowId: p.id, otherId: p.partnerId, name: p.name, slug: p.slug, emoji: p.emoji,
      isVisible: partnerVisibility[p.id] ?? p.isVisible, origin: 'partner',
    })),
    ...alliances.map((a): Conn => ({
      rowId: a.id, otherId: a.otherId, name: a.name, slug: a.slug, emoji: a.emoji,
      isVisible: allianceVisibility[a.id] ?? a.isVisible, origin: 'alliance',
    })),
  ];

  const toggleConn = (c: Conn) =>
    c.origin === 'partner'
      ? handleTogglePartnerVisibility(c.rowId)
      : handleToggleAllianceVisibility(c.rowId);

  return (
    <div className="flex flex-col gap-6">
      {!isDrawer && (
        <div className="bento-card overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="heading-serif text-2xl mb-2">Мережа партнерів (Cartel)</h1>
                <p className="text-sm text-primary-foreground/80 leading-relaxed max-w-md">
                  Об'єднуйтесь з іншими майстрами (бровисти + манікюрниці і т.д.), щоб рекомендувати один одного клієнтам та рости разом.
                </p>
              </div>
              <div className="size-14 bg-primary-foreground/20 rounded-2xl flex items-center justify-center text-primary-foreground">
                <Handshake size={24} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70">
                Твоє посилання для запрошення партнерів
              </p>
              <div className="flex items-center gap-2 bg-primary-foreground/10 rounded-xl p-2.5 border border-primary-foreground/20">
                <div className="flex-1 px-3 font-mono text-sm truncate opacity-90 min-w-0">
                  {inviteLink}
                </div>
                <button
                  type="button"
                  onClick={copyLink}
                  className="bg-primary-foreground text-primary px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-primary-foreground/90 active:scale-[0.95] transition-colors duration-150"
                >
                  {copied ? (
                    <><Check size={14} /> Скопійовано</>
                  ) : (
                    <><Copy size={14} /> Скопіювати</>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-secondary/50 p-4 border-t border-border flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Users size={16} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">У твоїй мережі</p>
                <p className="text-sm font-bold text-foreground">{activePartners.length + alliances.length}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-border" />
            <p className="text-[11px] text-muted-foreground">
              *Партнери з увімкненою видимістю з'являться на вашій публічній сторінці.
            </p>
          </div>
        </div>
      )}

      {/* M-GROW-02: Обʼєднана мережа — партнери (cross-promo) + альянси (реферали) */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest pl-1">
          Зараз у твоїй мережі
        </h2>

        {connections.length === 0 ? (
          <div className="bento-card p-12 border-dashed border-2 border-border bg-transparent text-center flex flex-col items-center gap-4">
            <div className="size-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <Users size={32} className="text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Поки що мережа порожня</p>
              <p className="text-xs text-muted-foreground/60 mt-1 italic">Поділися лінком вище з майстрами-знайомими</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {connections.map((c) => (
              <motion.div
                key={c.rowId}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bento-card p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0 font-bold text-sm">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{c.name}</p>
                      <span className={cn(
                        'shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md',
                        c.origin === 'partner' ? 'bg-primary/15 text-[#3F5C5B]' : 'bg-accent/15 text-accent',
                      )}>
                        {c.origin === 'partner' ? 'Партнер' : 'Реферал'}
                      </span>
                    </div>
                    <Link
                      href={`/${c.slug}`}
                      target="_blank"
                      className="text-[10px] text-primary font-medium flex items-center gap-1 hover:underline"
                    >
                      {c.slug} <ExternalLink size={10} />
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    aria-pressed={c.isVisible}
                    aria-label={c.isVisible ? 'Прибрати з публічної сторінки' : 'Показати на публічній сторінці'}
                    onClick={() => toggleConn(c)}
                    disabled={togglingId === c.rowId}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 active:scale-[0.95]',
                      c.isVisible
                        ? 'bg-primary/12 text-[#3F5C5B] hover:bg-primary/20'
                        : 'bg-secondary text-muted-foreground/60 hover:bg-secondary/80',
                      togglingId === c.rowId && 'opacity-50 pointer-events-none',
                    )}
                  >
                    {c.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                    {c.isVisible ? 'Видно' : 'Приховано'}
                  </button>

                  {c.origin === 'partner' && (
                    <button
                      type="button"
                      aria-label="Видалити партнера"
                      onClick={() => handleDelete(c.otherId)}
                      disabled={isDeleting === c.otherId}
                      className="size-9 rounded-xl flex items-center justify-center text-destructive hover:bg-destructive/10 active:scale-[0.88] transition-colors duration-150 disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bento-card p-6 bg-secondary/40 border border-border">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Handshake size={18} className="text-primary" /> Як це працює?
        </h3>
        <ul className="space-y-3">
          {[
            { t: 'Створюй колаборації', d: 'Додавай майстрів суміжних напрямків (напр. манікюр + педикюр + візаж).' },
            { t: 'Бонус для клієнтів', d: 'Клієнти бачать рекомендації на твоїй сторінці та частіше повертаються до "своєї" мережі.' },
            { t: 'Крос-трафік', d: 'Твої партнери так само рекомендують тебе своїм клієнтам.' },
          ].map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="text-xs font-bold text-foreground">{item.t}</p>
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed">{item.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
