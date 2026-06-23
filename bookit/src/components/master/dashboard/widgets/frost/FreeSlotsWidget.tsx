'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Zap, Sparkles } from 'lucide-react';
import { ScrollStrip } from '@/components/shared/ScrollStrip';
import { useServices } from '@/lib/supabase/hooks/useServices';
import type { Service } from '@/components/master/services/types';
import { useWizardSchedule } from '@/lib/supabase/hooks/useWizardSchedule';
import { useSlotsFromStore } from '@/lib/supabase/hooks/useSlotsFromStore';
import { useMasterContext } from '@/lib/supabase/context';
import { useToast } from '@/lib/toast/context';
import type { WorkingHoursConfig } from '@/types/database';
import { getNow } from '@/lib/utils/now';
import { pluralUk } from '@/lib/utils/pluralUk';

const SLOT_ACTIONS = [
  { href: '/dashboard/flash',                     label: 'Flash акція', Icon: Zap,      primary: true  },
  { href: '/dashboard/marketing?mode=free_slots', label: 'Сторіс',      Icon: Sparkles, primary: false },
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

interface FreeSlotsWidgetProps {
  onSlotClick?: (time: string, serviceId: string) => void;
}

export function FreeSlotsWidget({ onSlotClick }: FreeSlotsWidgetProps) {
  const now       = getNow();
  const todayStr  = toISO(now);
  const future    = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const futureStr = toISO(future);
  const { profile, masterProfile } = useMasterContext();
  const masterId  = masterProfile?.id ?? profile?.id;
  const { showToast } = useToast();
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

  function handleSlotClick(time: string) {
    if (!selectedService) {
      showToast({ type: 'error', title: 'Послугу не обрано', message: 'Оберіть послугу перед записом' });
      return;
    }
    onSlotClick?.(time, selectedService.id);
  }

  return (
    <div className="bento-card overflow-hidden flex flex-col" data-tour-step="act-0">
      <div className="px-4 pt-4 pb-0">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--text-tertiary)]">
            Вільно сьогодні
          </p>
          {!isLoading && (
            <div className="flex items-baseline gap-1">
              <span className="metric-value text-[1.8rem] font-bold leading-tight text-[var(--text-primary)]">
                {count}
              </span>
              <span className="text-[12px] text-[var(--text-tertiary)]">
                {pluralUk(count, 'слот', 'слоти', 'слотів')}
              </span>
            </div>
          )}
          {isLoading && <div className="skeleton-shimmer h-8 w-12 rounded-lg" />}
        </div>

        {/* Service selector */}
        {!servicesLoading && activeServices.length > 1 && (
          <ScrollStrip wrapperClassName="mb-3" className="flex gap-1.5 pb-0.5">
            {activeServices.map((svc: Service) => {
              const isActive = (selectedService?.id ?? activeServices[0]?.id) === svc.id;
              return (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => setSelectedServiceId(svc.id)}
                  aria-pressed={isActive}
                  className="flex-shrink-0 px-2.5 py-2 rounded-full text-[11px] font-bold tracking-[0.04em] transition-colors duration-150 whitespace-nowrap"
                  style={{
                    background: isActive ? 'var(--accent)' : 'var(--border)',
                    color:      isActive ? 'var(--accent-on)' : 'var(--text-tertiary)',
                    border:     '1px solid transparent',
                  }}
                >
                  {svc.name}
                </button>
              );
            })}
          </ScrollStrip>
        )}
      </div>

      {/* Slots grouped by time of day */}
      {!isLoading && count > 0 && (
        <div className="flex flex-col gap-3 px-4 pb-2">
          {groupedSlots.map(group => (
            <div key={group.key}>
              <p
                className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1.5"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {group.label}
              </p>
              <div className="grid grid-cols-4 gap-[3px]">
                {group.slots.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleSlotClick(t)}
                    aria-label={`Вільний час ${t}`}
                    className="flex items-center justify-center py-2.5 text-[11px] font-bold tabular-nums transition-colors duration-150 active:scale-[0.93] hover:opacity-70"
                    style={{
                      borderRadius: '6px',
                      border:       '1px solid color-mix(in srgb, var(--accent) 12%, transparent)',
                      color:        'var(--text-primary)',
                      background:   'var(--surface)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {!isLoading && count === 0 && (
        <p className="px-4 pb-2 text-[13px] text-[var(--text-tertiary)]">
          Розклад заповнено
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 px-4 pb-4 pt-3 mt-auto" style={{ borderTop: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)' }}>
        {SLOT_ACTIONS.map(({ href, label, Icon, primary }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-center gap-2 h-12 rounded-[14px] font-semibold text-[13px] transition-colors duration-150 active:scale-[0.96]"
            style={primary
              ? { background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 3px 10px color-mix(in srgb, var(--accent) 22%, transparent)' }
              : { background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--text-primary)' }
            }
          >
            <Icon size={15} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
