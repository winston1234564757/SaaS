'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Zap, Sparkles } from 'lucide-react';
import { useServices } from '@/lib/supabase/hooks/useServices';
import type { Service } from '@/components/master/services/types';
import { useWizardSchedule } from '@/lib/supabase/hooks/useWizardSchedule';
import { useSlotsFromStore } from '@/lib/supabase/hooks/useSlotsFromStore';
import { useMasterContext } from '@/lib/supabase/context';
import type { WorkingHoursConfig } from '@/types/database';
import { getNow } from '@/lib/utils/now';
import { pluralUk } from '@/lib/utils/pluralUk';

const SLOT_ACTIONS = [
  { href: '/dashboard/flash',                     label: 'Flash акція', Icon: Zap      },
  { href: '/dashboard/marketing?mode=free_slots', label: 'Сторіс',      Icon: Sparkles },
] as const;

const TIME_GROUPS = [
  { key: 'morning',   label: 'Ранок',  from: 0,  to: 12 },
  { key: 'afternoon', label: 'День',   from: 12, to: 17 },
  { key: 'evening',   label: 'Вечір',  from: 17, to: 24 },
] as const;

function getHour(slot: string) { return parseInt(slot.split(':')[0], 10); }

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function FreeSlotsWidget() {
  const now       = getNow();
  const todayStr  = toISO(now);
  const future    = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const futureStr = toISO(future);
  const { profile, masterProfile } = useMasterContext();
  const masterId  = masterProfile?.id ?? profile?.id;
  const { services, isLoading: servicesLoading } = useServices();
  const { data: scheduleStore, isLoading: scheduleLoading } = useWizardSchedule(masterId, todayStr, futureStr);
  const wh        = (masterProfile?.working_hours as Partial<WorkingHoursConfig> | null) ?? {};
  const bufferMin = wh.buffer_time_minutes ?? 0;

  const activeServices = useMemo(() => (services ?? []).filter((s: Service) => s.active), [services]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const selectedService = useMemo(() => {
    if (!activeServices.length) return null;
    return activeServices.find(s => s.id === selectedServiceId) ?? activeServices[0];
  }, [activeServices, selectedServiceId]);

  const allSlots = useSlotsFromStore(
    selectedService ? todayStr : null,
    selectedService?.duration ?? 0,
    bufferMin, wh, scheduleStore,
  );
  const isLoading = servicesLoading || scheduleLoading;
  const count     = allSlots.length;

  const groupedSlots = useMemo(() => {
    return TIME_GROUPS
      .map(g => ({
        ...g,
        slots: allSlots.filter(s => {
          const h = getHour(s);
          return h >= g.from && h < g.to;
        }),
      }))
      .filter(g => g.slots.length > 0);
  }, [allSlots]);

  return (
    <div className="flex flex-col">
      {/* Header row */}
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[var(--text-tertiary)]">
          Вільно сьогодні
        </p>
        {!isLoading && (
          <span className="metric-value text-[1.4rem] font-bold leading-none text-[var(--text-primary)]">
            {count}
            <span className="text-[12px] font-normal ml-1 text-[var(--text-tertiary)]">
              {pluralUk(count, 'слот', 'слоти', 'слотів')}
            </span>
          </span>
        )}
        {isLoading && <div className="skeleton-shimmer h-7 w-12 rounded-lg" />}
      </div>

      {/* Service selector */}
      {!servicesLoading && activeServices.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {activeServices.map((svc: Service) => {
            const isActive = (selectedService?.id ?? activeServices[0]?.id) === svc.id;
            return (
              <button type="button"
                key={svc.id}
                onClick={() => setSelectedServiceId(svc.id)}
                className="px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] uppercase transition-all duration-150 cursor-pointer"
                style={{
                  color:        isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                  background:   isActive ? 'rgba(211,163,118,0.12)' : 'transparent',
                  border:       `1px solid ${isActive ? 'rgba(211,163,118,0.30)' : 'transparent'}`,
                  borderRadius: '4px',
                }}
              >
                {svc.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Slots grouped by time of day — monospace Studio style */}
      {!isLoading && count > 0 && (
        <div className="flex flex-col gap-3">
          {groupedSlots.map(group => (
            <div key={group.key}>
              <p
                className="font-mono text-[9px] font-bold tracking-[0.2em] uppercase mb-1.5"
                style={{ color: 'var(--text-tertiary)', opacity: 0.6 }}
              >
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1">
                {group.slots.map(t => (
                  <span
                    key={t}
                    className="font-mono text-[12px] px-2 py-1 rounded-[4px]"
                    style={{
                      background: 'var(--border)',
                      color:      'var(--text-secondary)',
                      border:     '1px solid var(--border-strong)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && count === 0 && (
        <p className="font-mono text-[13px] tracking-[0.04em] uppercase" style={{ color: 'var(--text-tertiary)' }}>
          Повний розклад
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 pt-3 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
        {SLOT_ACTIONS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all duration-150 active:scale-[0.94]"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
          >
            <span style={{ color: 'var(--accent-on)', display: 'flex' }}><Icon size={13} /></span>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
