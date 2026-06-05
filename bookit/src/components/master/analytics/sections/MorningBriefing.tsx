'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Users, Sparkles, Coffee } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { formatPrice } from '@/lib/utils/currency';
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
  dnaTags: string[];
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
      
      // Сьогоднішня дата в локальному часовому поясі
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Отримуємо сьогоднішні записи
      const { data: bookings, error: bError } = await supabase
        .from('bookings')
        .select(`
          id,
          client_name,
          client_phone,
          slot_time,
          start_time,
          total_price,
          client_id
        `)
        .eq('master_id', masterId!)
        .eq('date', todayStr)
        .in('status', ['confirmed', 'completed', 'pending'])
        .order('start_time', { ascending: true });

      if (bError) throw bError;
      if (!bookings || bookings.length === 0) return [];

      const bookingIds = bookings.map((b: any) => b.id);

      // 2. Отримуємо назви послуг для цих записів
      const { data: bookingServices, error: sError } = await supabase
        .from('booking_services')
        .select('booking_id, service_name')
        .in('booking_id', bookingIds);

      if (sError) throw sError;

      // 3. Отримуємо CRM-відносини для клієнтів (health_notes, tags, VIP)
      const clientIds = bookings.map((b: any) => b.client_id).filter(Boolean) as string[];
      
      let relations: any[] = [];
      if (clientIds.length > 0) {
        const { data: rels } = await supabase
          .from('client_master_relations')
          .select('client_id, is_vip, total_visits, health_notes, medical_notes')
          .eq('master_id', masterId!)
          .in('client_id', clientIds);
        relations = rels ?? [];
      }

      // Мапимо все в єдиний BriefingItem
      return bookings.map((b: any) => {
        const servicesForBooking = bookingServices?.filter((s: any) => s.booking_id === b.id) ?? [];
        const serviceName = servicesForBooking.map((s: any) => s.service_name).join(', ') || 'Послуга';
        
        const rel = relations.find(r => r.client_id === b.client_id);
        const dnaTags: string[] = [];
        
        if (rel?.is_vip) dnaTags.push('👑 VIP');
        if (rel?.total_visits >= 5) dnaTags.push('🔥 Постійний');
        
        // Розпарсимо каву або інші уподобання з health_notes
        const notes = rel?.health_notes?.toLowerCase() ?? '';
        if (notes.includes('кава') || notes.includes('кокос')) {
          dnaTags.push('☕ Кокосовий лате');
        } else if (notes.includes('тиш') || notes.includes('мовчати')) {
          dnaTags.push('🤫 Любить тишу');
        } else {
          dnaTags.push('💬 Товариська');
        }

        if (rel?.medical_notes) {
          dnaTags.push('⚠️ Чутливість');
        }

        // AI підказки допродажів
        let aiTip = 'Запропонуйте записатися на наступний візит наприкінці сеансу.';
        if (rel?.total_visits === 1) {
          aiTip = 'Перший візит! Розкажіть про нашу реферальну програму та знижку на другий сеанс.';
        } else if (serviceName.toLowerCase().includes('фарбування')) {
          aiTip = '💡 Порадьте кондиціонер або маску для захисту кольору Kerastase.';
        } else if (serviceName.toLowerCase().includes('ламінування')) {
          aiTip = '💡 Запропонуйте спеціальну олію для домашнього догляду за віями.';
        }

        // Форматування часу
        const timeFormatted = b.start_time ? b.start_time.substring(0, 5) : '00:00';

        return {
          bookingId: b.id,
          clientName: b.client_name || 'Гість',
          clientPhone: b.client_phone || '',
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
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Ранковий брифінг на сьогодні</h3>
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
                <span className="text-xs font-bold text-foreground">{item.time}</span>
                <span className="text-[10px] text-muted-foreground/60 truncate max-w-[120px]">{item.serviceName}</span>
              </div>
              <h4 className="text-sm font-bold text-foreground truncate">{item.clientName}</h4>
              
              {/* DNA Tags */}
              <div className="flex flex-wrap gap-1 mt-2">
                {item.dnaTags.map((tag, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-border/10">
              <p className="text-[10px] text-muted-foreground/80 leading-normal italic">
                {item.aiTip}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
