'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Star, Phone, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { formatPrice } from '@/components/master/services/types';
import { ClientDetailSheet } from './ClientDetailSheet';

export interface ClientRow {
  id: string;          // client_phone as stable id
  client_id: string | null; // auth user id (for push/telegram reminders)
  client_name: string;
  client_phone: string;
  total_visits: number;
  total_spent: number;
  average_check: number;
  last_visit_at: string | null;
  is_vip: boolean;
  relation_id: string | null; // id у client_master_relations (для VIP toggle)
}

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
  const { masterProfile } = useMasterContext();
  const supabase = createClient();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);

  useEffect(() => {
    if (!masterProfile?.id) return;

    async function load() {
      // 1. Всі завершені/підтверджені/очікуючі записи
      const { data: bookings } = await supabase
        .from('bookings')
        .select('client_name, client_phone, total_price, date, status, client_id')
        .eq('master_id', masterProfile!.id)
        .neq('status', 'cancelled');

      // 2. CRM-метадані для VIP-статусу (може бути порожньо)
      const { data: relations } = await supabase
        .from('client_master_relations')
        .select('id, is_vip, client_id')
        .eq('master_id', masterProfile!.id);

      const vipByClientId = new Map<string, { id: string; is_vip: boolean }>();
      for (const r of relations ?? []) {
        if (r.client_id) vipByClientId.set(r.client_id, { id: r.id, is_vip: r.is_vip });
      }

      // 3. Агрегуємо по телефону
      const map = new Map<string, ClientRow>();

      for (const b of bookings ?? []) {
        const phone = b.client_phone ?? '—';
        const name  = b.client_name  ?? 'Клієнт';
        const price = Number(b.total_price ?? 0);
        const date  = b.date as string;
        const clientId = b.client_id as string | null;

        const existing = map.get(phone);
        const crm = clientId ? vipByClientId.get(clientId) : undefined;

        if (existing) {
          existing.total_visits  += 1;
          existing.total_spent   += price;
          if (!existing.last_visit_at || date > existing.last_visit_at) {
            existing.last_visit_at = date;
          }
          existing.average_check = existing.total_spent / existing.total_visits;
          if (crm) {
            existing.is_vip      = crm.is_vip;
            existing.relation_id = crm.id;
          }
          if (!existing.client_id && clientId) existing.client_id = clientId;
        } else {
          map.set(phone, {
            id:             phone,
            client_id:      clientId,
            client_name:    name,
            client_phone:   phone,
            total_visits:   1,
            total_spent:    price,
            average_check:  price,
            last_visit_at:  date,
            is_vip:         crm?.is_vip ?? false,
            relation_id:    crm?.id     ?? null,
          });
        }
      }

      const result = Array.from(map.values()).sort(
        (a, b) => b.total_visits - a.total_visits
      );
      setClients(result);
      setIsLoading(false);
    }

    load();
  }, [masterProfile?.id]);

  function handleVipChange(id: string, isVip: boolean) {
    setClients(prev => prev.map(c => c.id === id ? { ...c, is_vip: isVip } : c));
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
        <div className="bento-card p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-[#F5E8E3] flex items-center justify-center">
            <Users size={26} className="text-[#A8928D]" />
          </div>
          <p className="text-sm font-semibold text-[#2C1A14]">
            {search ? 'Нічого не знайдено' : 'Клієнтів ще немає'}
          </p>
          <p className="text-xs text-[#A8928D]">
            {search ? 'Спробуйте інший запит' : 'Клієнти з\'являться після перших записів'}
          </p>
        </div>
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
