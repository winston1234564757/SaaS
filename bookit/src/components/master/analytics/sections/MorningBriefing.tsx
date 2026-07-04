'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Crown, Flame, AlertTriangle, MessageCircle, Coffee, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { formatPrice } from '@/lib/utils/currency';
import { getNow } from '@/lib/utils/now';
import { format } from 'date-fns';
import { SkeletonCell } from '../primitives/SkeletonCell';

interface MorningBriefingProps {
  onOpenClient: (name: string, phone: string) => void;
}

interface BriefingItem {
  bookingId: string;
  clientName: string;
  clientPhone: string;
  time: string;
  serviceName: string;
  dnaTags: { icon: React.ReactNode; label: string }[];
  aiTip: string;
}

export function MorningBriefing({ onOpenClient }: MorningBriefingProps) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  const { data: briefingItems = [], isLoading } = useQuery({
    queryKey: ['morning-briefing-today', masterId],
    enabled: !!masterId,
    staleTime: 5 * 60_000, // 5 min
    queryFn: async (): Promise<BriefingItem[]> => {
      const supabase = createClient();

      type TodayBookingRow = {
        id: string;
        client_name: string;
        client_phone: string;
        slot_time: string | null;
        start_time: string | null;
        total_price: number;
        client_id: string | null;
      };

      // Використовуємо getNow() для підтримки debug clock override через cookie
      const todayStr = format(getNow(), 'yyyy-MM-dd');

      // 1. Отримуємо сьогоднішні записи
      const { data: rawBookings, error: bError } = await supabase
        .from('bookings')
        .select('id, client_name, client_phone, slot_time, start_time, total_price, client_id')
        .eq('master_id', masterId!)
        .eq('date', todayStr)
        .in('status', ['confirmed', 'completed', 'pending'])
        .order('start_time', { ascending: true });

      const bookings = (rawBookings ?? []) as TodayBookingRow[];

      if (bError) throw bError;
      if (bookings.length === 0) return [];

      const bookingIds = bookings.map((b) => b.id as string);

      // 2. Отримуємо назви послуг для цих записів
      type BookingServiceRow = { booking_id: string; service_name: string };
      const { data: rawServices, error: sError } = await supabase
        .from('booking_services')
        .select('booking_id, service_name')
        .in('booking_id', bookingIds);
      const bookingServices = (rawServices ?? []) as BookingServiceRow[];

      if (sError) throw sError;

      // 3. Отримуємо CRM-відносини для клієнтів (health_notes, tags, VIP)
      const clientIds = bookings
        .map((b) => b.client_id as string | null)
        .filter((id): id is string => id !== null);

      let relations: {
        client_id: string;
        is_vip: boolean;
        total_visits: number;
        health_notes: string | null;
        medical_notes: string | null;
      }[] = [];

      if (clientIds.length > 0) {
        const { data: rels } = await supabase
          .from('client_master_relations')
          .select('client_id, is_vip, total_visits, health_notes, medical_notes')
          .eq('master_id', masterId!)
          .in('client_id', clientIds);
        relations = rels ?? [];
      }

      // Мапимо все в єдиний BriefingItem
      return bookings.map((b) => {
        const servicesForBooking =
          bookingServices?.filter((s) => s.booking_id === b.id) ?? [];
        const serviceName =
          servicesForBooking.map((s) => s.service_name as string).join(', ') || 'Послуга';

        const rel = relations.find((r) => r.client_id === b.client_id);
        const dnaTags: { icon: React.ReactNode; label: string }[] = [];

        // No-Emoji Policy: використовуємо Lucide icons замість emoji
        if (rel?.is_vip) {
          dnaTags.push({ icon: <Crown size={9} />, label: 'VIP' });
        }
        if ((rel?.total_visits ?? 0) >= 5) {
          dnaTags.push({ icon: <Flame size={9} />, label: 'Постійний' });
        }

        const notes = rel?.health_notes?.toLowerCase() ?? '';
        if (notes.includes('кава') || notes.includes('кокос')) {
          dnaTags.push({ icon: <Coffee size={9} />, label: 'Кокосовий лате' });
        } else if (notes.includes('тиш') || notes.includes('мовчати')) {
          dnaTags.push({ icon: <Sparkles size={9} />, label: 'Любить тишу' });
        } else {
          dnaTags.push({ icon: <MessageCircle size={9} />, label: 'Товариська' });
        }

        if (rel?.medical_notes) {
          dnaTags.push({ icon: <AlertTriangle size={9} />, label: 'Чутливість' });
        }

        // AI підказки допродажів
        let aiTip = 'Запропонуйте записатися на наступний візит наприкінці сеансу.';
        if (rel?.total_visits === 1) {
          aiTip = 'Перший візит! Розкажіть про реферальну програму та знижку на другий сеанс.';
        } else if (serviceName.toLowerCase().includes('фарбування')) {
          aiTip = 'Порадьте кондиціонер або маску для захисту кольору Kerastase.';
        } else if (serviceName.toLowerCase().includes('ламінування')) {
          aiTip = 'Запропонуйте спеціальну олію для домашнього догляду за віями.';
        }

        const timeFormatted = b.start_time
          ? (b.start_time as string).substring(0, 5)
          : '00:00';

        return {
          bookingId: b.id as string,
          clientName: (b.client_name as string | null) || 'Гість',
          clientPhone: (b.client_phone as string | null) || '',
          time: timeFormatted,
          serviceName,
          dnaTags,
          aiTip,
        };
      });
    },
  });

  if (isLoading) return <SkeletonCell variant="ticker" />;
  if (briefingItems.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="size-4 text-primary animate-pulse" />
        <h3 className="text-xs font-semibold text-foreground">
          Ранковий брифінг на сьогодні
        </h3>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x select-none">
        {briefingItems.map((item) => (
          <button
            key={item.bookingId}
            type="button"
            onClick={() => onOpenClient(item.clientName, item.clientPhone)}
            className="text-left flex-shrink-0 w-[280px] bento-card p-4 bg-secondary/30 hover:bg-secondary/50 border border-border/5 snap-start cursor-pointer transition-all active:scale-[0.97] flex flex-col justify-between min-h-[140px]"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="metric-value text-xs text-foreground">{item.time}</span>
                <span className="text-[10px] text-text-sub truncate max-w-[120px]">
                  {item.serviceName}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-foreground truncate">{item.clientName}</h4>

              {/* DNA Tags — Lucide icons, No-Emoji */}
              <div className="flex flex-wrap gap-1 mt-2">
                {item.dnaTags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                  >
                    {tag.icon}
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-border/10">
              <p className="text-[10px] text-text-sub leading-normal italic">
                {item.aiTip}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
