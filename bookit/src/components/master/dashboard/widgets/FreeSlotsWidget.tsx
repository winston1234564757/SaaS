'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CalendarPlus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useServices } from '@/lib/supabase/hooks/useServices';
import type { Service } from '@/components/master/services/types';
import { useWizardSchedule } from '@/lib/supabase/hooks/useWizardSchedule';
import { useSlotsFromStore } from '@/lib/supabase/hooks/useSlotsFromStore';
import { useMasterContext } from '@/lib/supabase/context';
import type { WorkingHoursConfig } from '@/types/database';
import { getNow } from '@/lib/utils/now';

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function FreeSlotsWidget() {
  const now      = getNow();
  const todayStr = toISO(now);
  const future   = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const futureStr = toISO(future);
  const { profile, masterProfile } = useMasterContext();
  const masterId = masterProfile?.id ?? profile?.id;
  const { services, isLoading: servicesLoading } = useServices();
  const { data: scheduleStore, isLoading: scheduleLoading } = useWizardSchedule(masterId, todayStr, futureStr);

  const wh        = (masterProfile?.working_hours as Partial<WorkingHoursConfig> | null) ?? {};
  const bufferMin = wh.buffer_time_minutes ?? 0;

  const activeServices = useMemo(
    () => (services ?? []).filter((s: Service) => s.active),
    [services],
  );

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const selectedService = useMemo(() => {
    if (!activeServices.length) return null;
    return activeServices.find(s => s.id === selectedServiceId) ?? activeServices[0];
  }, [activeServices, selectedServiceId]);

  const allSlots = useSlotsFromStore(
    selectedService ? todayStr : null,
    selectedService?.duration ?? 0,
    bufferMin,
    wh,
    scheduleStore,
  );
  const isLoading = servicesLoading || scheduleLoading;
  const count     = allSlots.length;

  return (
    <div className="bento-card overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Вільно сьогодні
            </p>
            <p
              className="mt-0.5 leading-none"
              style={{
                fontFamily: 'var(--font-cormorant, Georgia, serif)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: count > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                letterSpacing: '-0.02em',
              }}
            >
              {isLoading ? '—' : count > 0 ? `${count} слотів` : 'Немає слотів'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Stories redirect — auto-selects 'Вікна' mode */}
            <Link href="/dashboard/marketing?mode=free_slots">
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full cursor-pointer"
                style={{
                  background: 'var(--background-deep)',
                  border: '0.5px solid var(--border-strong)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span><Sparkles size={12} /></span>
                <span className="text-[11px] font-semibold">Сторіс</span>
              </motion.div>
            </Link>

            {/* Flash deal */}
            {count > 0 && (
              <Link href="/dashboard/flash">
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full cursor-pointer"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-on)',
                  }}
                >
                  <span><Zap size={13} /></span>
                  <span className="text-[11px] font-bold">Flash</span>
                </motion.div>
              </Link>
            )}
          </div>
        </div>

        {/* Service selector pills */}
        {!servicesLoading && activeServices.length > 1 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {activeServices.map((svc: Service) => {
              const isActive = (selectedService?.id ?? activeServices[0]?.id) === svc.id;
              return (
                <button
                  key={svc.id}
                  onClick={() => setSelectedServiceId(svc.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                  style={{
                    background: isActive ? 'var(--accent)' : 'var(--background-deep)',
                    color: isActive ? 'var(--accent-on)' : 'var(--text-tertiary)',
                    border: isActive ? 'none' : '0.5px solid var(--border-strong)',
                  }}
                >
                  {svc.emoji && <span>{svc.emoji}</span>}
                  <span>{svc.name}</span>
                  <span style={{ opacity: 0.7 }}>· {svc.duration}хв</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Slot pills */}
        {!isLoading && count > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedService?.id ?? 'default'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap gap-1.5"
            >
              {allSlots.map((t, i) => (
                <motion.span
                  key={t}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: i * 0.04 }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{
                    background: 'var(--background-deep)',
                    border: '0.5px solid var(--border-strong)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <CalendarPlus size={9} />
                  {t}
                </motion.span>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {!isLoading && count === 0 && (
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Розклад заповнено — чудова робота
          </p>
        )}
      </div>
    </div>
  );
}
