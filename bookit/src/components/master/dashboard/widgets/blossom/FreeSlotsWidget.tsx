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
      <p className="text-[15px] font-semibold tracking-[0.08em] uppercase mb-4" style={{ color: 'var(--text-secondary)' }}>
        Вільно сьогодні
      </p>

      {/* Count */}
      <div className="flex items-baseline gap-3 mb-5">
        {isLoading ? (
          <div className="skeleton-shimmer h-16 w-20 rounded-xl" />
        ) : (
          <>
            <span
              style={{
                fontFamily:    "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                fontSize:      'clamp(3rem, 9vw, 4.5rem)',
                fontWeight:    300,
                letterSpacing: '-0.01em',
                color:         'var(--text-primary)',
                lineHeight:    1,
              }}
            >
              {count}
            </span>
            <span className="font-service text-[16px]" style={{ color: 'var(--text-secondary)' }}>
              {pluralUk(count, 'слот', 'слоти', 'слотів')}
            </span>
          </>
        )}
      </div>

      {/* Service selector — tactile pill buttons */}
      {!servicesLoading && activeServices.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {activeServices.map((svc: Service) => {
            const isActive = (selectedService?.id ?? activeServices[0]?.id) === svc.id;
            return (
              <button
                key={svc.id}
                onClick={() => setSelectedServiceId(svc.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 active:scale-[0.95] cursor-pointer"
                style={{
                  background: isActive ? 'var(--accent)' : 'var(--surface)',
                  color:      isActive ? 'var(--accent-on)' : 'var(--text-secondary)',
                  border:     `1px solid ${isActive ? 'transparent' : 'var(--border)'}`,
                }}
              >
                {svc.name}
                <span style={{ opacity: isActive ? 0.65 : 0.4, fontSize: '11px' }}>
                  {svc.duration}хв
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Slots grouped by time of day */}
      {!isLoading && count > 0 && (
        <div className="flex flex-col gap-4">
          {groupedSlots.map(group => (
            <div key={group.key}>
              <p
                className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.slots.map(slot => (
                  <span
                    key={slot}
                    className="text-[14px] font-semibold px-3 py-1.5 rounded-full leading-none"
                    style={{
                      background: 'var(--surface)',
                      border:     '1px solid var(--border-strong)',
                      color:      'var(--text-primary)',
                    }}
                  >
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && count === 0 && (
        <p className="text-[15px] italic" style={{ color: 'var(--text-tertiary)' }}>
          Розклад заповнено — чудова робота
        </p>
      )}

      {/* Action buttons — accent, full-width split */}
      <div className="flex gap-2 pt-4 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
        {SLOT_ACTIONS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-150 active:scale-[0.95]"
            style={{ background: 'var(--hero-card-bg)', color: 'var(--accent-on)' }}
          >
            <span style={{ color: 'var(--accent-on)', display: 'flex' }}><Icon size={14} /></span>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
