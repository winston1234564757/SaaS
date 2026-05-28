'use client';

import { useMemo, useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { useServices } from '@/lib/supabase/hooks/useServices';
import type { Service } from '@/components/master/services/types';
import { useWizardSchedule } from '@/lib/supabase/hooks/useWizardSchedule';
import { useSlotsFromStore } from '@/lib/supabase/hooks/useSlotsFromStore';
import { useMasterContext } from '@/lib/supabase/context';
import type { WorkingHoursConfig } from '@/types/database';
import { getNow } from '@/lib/utils/now';
import { pluralUk } from '@/lib/utils/pluralUk';

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function FreeSlotsWidget() {
  const now       = getNow();
  const todayStr  = toISO(now);
  const future    = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
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
  const hasSlots  = count > 0;

  return (
    <div className="bento-card overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-0">
          <p className="widget-heading mb-2">Вільно сьогодні</p>
          <div className="flex items-baseline gap-1.5">
            <span
              className="metric-value font-bold leading-none"
              style={{ color: 'var(--text-primary)', fontSize: 'clamp(2rem,6vw,2.6rem)' }}
            >
              {isLoading ? '—' : count}
            </span>
            {!isLoading && (
              <span className="text-[14px]" style={{ color: 'var(--text-tertiary)' }}>
                {pluralUk(count, 'слот', 'слоти', 'слотів')}
              </span>
            )}
          </div>
        </div>

        {/* Service selector pills */}
        {!servicesLoading && activeServices.length > 1 && (
          <div className="flex flex-wrap gap-1.5 px-5 pt-3 pb-0">
            {activeServices.map((svc: Service) => {
              const isActive = (selectedService?.id ?? activeServices[0]?.id) === svc.id;
              return (
                <button
                  key={svc.id}
                  onClick={() => setSelectedServiceId(svc.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-[5px] rounded-full text-[13px] font-medium transition-transform duration-150 whitespace-nowrap cursor-pointer active:scale-[0.95]"
                  style={
                    isActive
                      ? { background: 'var(--accent)', color: 'var(--accent-on)' }
                      : { background: 'var(--border)', color: 'var(--text-secondary)' }
                  }
                >
                  <span>{svc.name}</span>
                  <span style={{ opacity: 0.55 }}>· {svc.duration}хв</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Time slot chips — uniform 4-col grid */}
        {!isLoading && hasSlots && (
          <div className="grid grid-cols-4 gap-1.5 px-5 pt-3 pb-5 min-w-0 overflow-hidden">
            {allSlots.map(t => (
              <span
                key={t}
                className="flex items-center justify-center gap-[3px] py-1.5 rounded-full text-[12px] font-medium min-w-0 overflow-hidden"
                style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <CalendarPlus size={8} style={{ opacity: 0.55, flexShrink: 0 }} />
                <span className="truncate">{t}</span>
              </span>
            ))}
          </div>
        )}

        {!isLoading && !hasSlots && (
          <p className="px-5 pb-5 pt-3 text-[14px] italic" style={{ color: 'var(--text-tertiary)' }}>
            Розклад заповнено — чудова робота
          </p>
        )}
    </div>
  );
}
