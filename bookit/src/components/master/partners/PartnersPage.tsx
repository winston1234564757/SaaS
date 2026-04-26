'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check, Users, Trash2, ExternalLink, Handshake, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { removePartner, toggleAllianceVisibility } from '@/lib/actions/partners';
import Link from 'next/link';

interface Partner {
  id: string;
  partnerId: string;
  status: 'pending' | 'accepted';
  createdAt: string;
  slug: string;
  name: string;
  emoji: string;
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

  const handleToggleVisibility = async (allianceId: string) => {
    const next = !allianceVisibility[allianceId];
    setAllianceVisibility(prev => ({ ...prev, [allianceId]: next }));
    setTogglingId(allianceId);
    await toggleAllianceVisibility(allianceId, next);
    setTogglingId(null);
  };

  const activePartners = partners.filter(p => p.status === 'accepted');

  return (
    <div className="flex flex-col gap-6">
      {!isDrawer && (
        <div className="bento-card overflow-hidden">
          <div className="bg-[#789A99] p-6 text-white">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="heading-serif text-2xl mb-2">Мережа партнерів (Cartel)</h1>
                <p className="text-sm text-white/80 leading-relaxed max-w-md">
                  Об'єднуйтесь з іншими майстрами (бровисти + манікюрниці і т.д.), щоб рекомендувати один одного клієнтам та рости разом.
                </p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                🤝
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">
                Твоє посилання для запрошення партнерів
              </p>
              <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5 border border-white/20">
                <div className="flex-1 px-3 font-mono text-sm truncate opacity-90">
                  {inviteLink}
                </div>
                <button 
                  onClick={copyLink}
                  className="bg-white text-[#789A99] px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-white/90 active:scale-95 transition-all"
                >
                  {copied ? (
                    <><Check size={14} /> Скопійовано</>
                  ) : (
                    <><Copy size={14} /> Копіювати</>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/50 p-4 border-t border-[#E8D0C8] flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#789A99]/10 flex items-center justify-center text-[#789A99]">
                <Users size={16} />
              </div>
              <div>
                <p className="text-[10px] text-[#A8928D] uppercase tracking-wider">Активні партнери</p>
                <p className="text-sm font-bold text-[#2C1A14]">{activePartners.length}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-[#E8D0C8]" />
            <p className="text-[11px] text-[#6B5750]">
              *Ваші партнери будуть відображатися на вашій публічній сторінці бронювання.
            </p>
          </div>
        </div>
      )}

      {/* Partners List */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-[#2C1A14] uppercase tracking-widest pl-1">
          Зараз у твоїй мережі
        </h2>

        {activePartners.length === 0 ? (
          <div className="bento-card p-12 border-dashed border-2 border-[#E8D0C8] bg-transparent text-center flex flex-col items-center gap-4">
             <div className="w-16 h-16 rounded-full bg-[#F5E8E3] flex items-center justify-center text-3xl">
               🌵
             </div>
             <div>
               <p className="text-sm font-bold text-[#2C1A14]">Поки що партнерів не додано</p>
               <p className="text-xs text-[#A8928D] mt-1 italic">Поділися лінком вище з майстрами-знайомими</p>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activePartners.map((partner) => (
              <motion.div
                key={partner.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bento-card p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                   <div className="w-12 h-12 rounded-2xl bg-[#F5E8E3] flex items-center justify-center text-2xl shrink-0">
                     {partner.emoji}
                   </div>
                   <div className="min-w-0">
                      <p className="text-sm font-bold text-[#2C1A14] truncate">{partner.name}</p>
                      <Link 
                        href={`/${partner.slug}`} 
                        target="_blank"
                        className="text-[10px] text-[#789A99] font-medium flex items-center gap-1 hover:underline"
                      >
                        {partner.slug} <ExternalLink size={10} />
                      </Link>
                   </div>
                </div>

                <button
                  onClick={() => handleDelete(partner.partnerId)}
                  disabled={isDeleting === partner.partnerId}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[#C05B5B] hover:bg-[#C05B5B]/10 active:scale-90 transition-all disabled:opacity-50"
                  title="Видалити партнера"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Alliance Visibility — Referral Network */}
      {alliances.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-[#2C1A14] uppercase tracking-widest pl-1">
            Реферальний альянс
          </h2>
          <p className="text-xs text-[#A8928D] pl-1 -mt-1">
            Майстри з вашої реферальної мережі. Увімкніть видимість — вони з'являться на вашій публічній сторінці.
          </p>
          <div className="flex flex-col gap-2.5">
            {alliances.map((al) => {
              const visible = allianceVisibility[al.id] ?? al.isVisible;
              return (
                <motion.div
                  key={al.id}
                  layout
                  className="bento-card p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#F5E8E3] flex items-center justify-center text-xl flex-shrink-0">
                      {al.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#2C1A14] truncate">{al.name}</p>
                      <Link
                        href={`/${al.slug}`}
                        target="_blank"
                        className="text-[10px] text-[#789A99] font-medium flex items-center gap-1 hover:underline"
                      >
                        {al.slug} <ExternalLink size={9} />
                      </Link>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleVisibility(al.id)}
                    disabled={togglingId === al.id}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95',
                      visible
                        ? 'bg-[#789A99]/12 text-[#789A99]'
                        : 'bg-[#F5E8E3] text-[#A8928D]',
                      togglingId === al.id && 'opacity-50 pointer-events-none',
                    )}
                    title={visible ? 'Прибрати з публічної сторінки' : 'Показати на публічній сторінці'}
                  >
                    {visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    {visible ? 'Видно' : 'Приховано'}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bento-card p-6 bg-[#FDF8F6]">
        <h3 className="text-sm font-bold text-[#2C1A14] mb-3 flex items-center gap-2">
          <Handshake size={18} className="text-[#789A99]" /> Як це працює?
        </h3>
        <ul className="space-y-3">
          {[
            { t: 'Створюй колаборації', d: 'Додавай майстрів суміжних напрямків (напр. манікюр + педикюр + візаж).' },
            { t: 'Бонус для клієнтів', d: 'Клієнти бачать рекомендації на твоїй сторінці та частіше повертаються до "своєї" мережі.' },
            { t: 'Крос-трафік', d: 'Твої партнери так само рекомендують тебе своїм клієнтам.' },
          ].map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#789A99] text-white text-[10px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="text-xs font-bold text-[#2C1A14]">{item.t}</p>
                <p className="text-[11px] text-[#A8928D] leading-relaxed">{item.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
