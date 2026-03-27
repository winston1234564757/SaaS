'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Star, Phone, Calendar, TrendingUp, Loader2, Link2, Zap, Instagram } from 'lucide-react';
import { formatPrice } from '@/components/master/services/types';
import { ClientDetailSheet } from './ClientDetailSheet';
import { useClients } from '@/lib/supabase/hooks/useClients';
import type { ClientRow } from '@/lib/supabase/hooks/useClients';

export type { ClientRow };

export interface AutoTag {
  label: string;
  color: string;
  bg: string;
}

export function getAutoTags(client: ClientRow): AutoTag[] {
  const tags: AutoTag[] = [];

  const daysSinceLast = client.last_visit_at
    ? Math.floor((Date.now() - new Date(client.last_visit_at).getTime()) / 86_400_000)
    : null;

  if (client.is_vip) {
    tags.push({ label: 'VIP', color: '#D4935A', bg: '#D4935A15' });
  }
  if (client.total_visits === 1) {
    tags.push({ label: 'Новий', color: '#789A99', bg: '#789A9915' });
  } else if (client.total_visits >= 5) {
    tags.push({ label: 'Постійний', color: '#5C9E7A', bg: '#5C9E7A15' });
  }
  if (client.average_check >= 1500) {
    tags.push({ label: 'Великий чек', color: '#D4935A', bg: '#D4935A15' });
  }

  // Churn prediction
  if (daysSinceLast !== null) {
    if (daysSinceLast >= 120) {
      tags.push({ label: '💤 Спить', color: '#C05B5B', bg: '#C05B5B15' });
    } else if (daysSinceLast >= 60) {
      tags.push({ label: '⚠️ Під ризиком', color: '#D4935A', bg: '#D4935A15' });
    }
  }

  return tags;
}

export function isChurned(client: ClientRow): boolean {
  if (!client.last_visit_at) return false;
  const days = Math.floor((Date.now() - new Date(client.last_visit_at).getTime()) / 86_400_000);
  return days >= 60;
}

export function ClientsPage() {
  const { clients, isLoading } = useClients();
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);

  function handleVipChange(id: string, isVip: boolean) {
    setSelectedClient(prev => prev?.id === id ? { ...prev, is_vip: isVip } : prev);
  }

  const filtered = clients.filter(c =>
    c.client_name.toLowerCase().includes(search.toLowerCase()) ||
    c.client_phone.includes(search)
  );

  const totalRevenue = clients.reduce((s, c) => s + c.total_spent, 0);
  const returning    = clients.filter(c => c.total_visits > 1).length;

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="bento-card p-5">
        <h1 className="heading-serif text-xl text-[#2C1A14] mb-0.5">Клієнти</h1>
        <p className="text-sm text-[#A8928D]">Ваша база клієнтів та CRM</p>
      </div>

      {!isLoading && clients.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Всього',    value: clients.length,        icon: Users,       color: '#789A99' },
            { label: 'Повторних', value: returning,             icon: TrendingUp,  color: '#5C9E7A' },
            { label: 'Виручка',   value: formatPrice(totalRevenue), icon: Star,    color: '#D4935A' },
          ].map(stat => (
            <div key={stat.label} className="bento-card p-3 text-center">
              <stat.icon size={16} className="mx-auto mb-1" style={{ color: stat.color }} />
              <p className="text-sm font-bold text-[#2C1A14]">{stat.value}</p>
              <p className="text-[10px] text-[#A8928D]">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Пошук за ім'ям або телефоном..."
        className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all"
      />

      {isLoading ? (
        <div className="bento-card p-10 flex flex-col items-center gap-3">
          <Loader2 size={24} className="text-[#789A99] animate-spin" />
          <p className="text-sm text-[#A8928D]">Завантаження клієнтів...</p>
        </div>
      ) : filtered.length === 0 ? (
        search ? (
          <div className="bento-card p-10 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-[#F5E8E3] flex items-center justify-center">
              <Users size={26} className="text-[#A8928D]" />
            </div>
            <p className="text-sm font-semibold text-[#2C1A14]">Нічого не знайдено</p>
            <p className="text-xs text-[#A8928D]">Спробуйте інший запит</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bento-card p-6 flex flex-col gap-5"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-3xl bg-[#789A99]/10 flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-[#789A99]" />
              </div>
              <p className="text-base font-bold text-[#2C1A14]">Ваша база клієнтів порожня</p>
              <p className="text-sm text-[#A8928D] mt-1 text-balance">
                Ось як залучити перших клієнтів за 24 години
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {[
                {
                  icon: Link2,
                  color: '#789A99',
                  title: 'Поділіться своєю сторінкою',
                  desc: 'Скопіюйте посилання на публічну сторінку та надішліть у ваш Instagram, Telegram або WhatsApp.',
                  href: '/dashboard/settings',
                  cta: 'Відкрити налаштування',
                },
                {
                  icon: Zap,
                  color: '#D4935A',
                  title: 'Запустіть флеш-акцію',
                  desc: 'Знижка 15–30% на перший запис залучить нових клієнтів моментально. Займає 30 секунд.',
                  href: '/dashboard/flash',
                  cta: 'Створити акцію',
                },
                {
                  icon: Instagram,
                  color: '#C05B5B',
                  title: 'Додайте посилання в bio',
                  desc: 'Одне посилання в bio Instagram — і клієнт одразу потрапляє до вашого онлайн-розкладу.',
                },
              ].map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={i} className="flex gap-3 p-4 rounded-2xl bg-white/50">
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${step.color}15` }}
                    >
                      <StepIcon size={16} style={{ color: step.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#2C1A14]">{step.title}</p>
                      <p className="text-xs text-[#A8928D] mt-0.5 leading-relaxed">{step.desc}</p>
                      {step.href && (
                        <a
                          href={step.href}
                          className="inline-flex mt-2 text-xs font-semibold text-[#789A99] hover:text-[#5C7E7D] transition-colors"
                        >
                          {step.cta} →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bento-card p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedClient(client)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: client.is_vip ? 'rgba(212,147,90,0.15)' : 'rgba(255,210,194,0.4)' }}
                >
                  {client.is_vip ? '⭐' : client.client_name[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#2C1A14] truncate">{client.client_name}</p>
                  <a
                    href={`tel:${client.client_phone}`}
                    className="flex items-center gap-1 text-xs text-[#A8928D] hover:text-[#789A99] transition-colors mt-0.5"
                    onClick={e => e.stopPropagation()}
                  >
                    <Phone size={11} />
                    {client.client_phone}
                  </a>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-[#2C1A14]">{formatPrice(client.total_spent)}</p>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <Calendar size={10} className="text-[#A8928D]" />
                    <span className="text-[11px] text-[#A8928D]">{client.total_visits} візит.</span>
                  </div>
                </div>
              </div>
              {(() => {
                const tags = getAutoTags(client);
                return tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-[#F5E8E3]/60">
                    {tags.map(tag => (
                      <span
                        key={tag.label}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ color: tag.color, background: tag.bg }}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                ) : client.last_visit_at ? (
                  <p className="text-[11px] text-[#A8928D] mt-2 pt-2 border-t border-[#F5E8E3]/60">
                    Остання візита: {new Date(client.last_visit_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
                  </p>
                ) : null;
              })()}
            </motion.div>
          ))}
        </div>
      )}

      <ClientDetailSheet
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onVipChange={handleVipChange}
      />
    </div>
  );
}
