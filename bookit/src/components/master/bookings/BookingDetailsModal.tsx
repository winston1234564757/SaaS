'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Clock, Globe, PenLine, Calendar,
  CheckCircle2, XCircle, Star, Loader2, Ban, RotateCcw, ChevronRight,
  TrendingUp, ShoppingBag, CalendarClock, Heart, FlaskConical,
} from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { ClientIdentityHeader } from '@/components/master/clients/ClientIdentityHeader';
import { ClientStatChips, type StatChip } from '@/components/master/clients/ClientStatChips';
import { useConsumablesForBooking } from '@/lib/supabase/hooks/useConsumablesForBooking';
import { useBookingById } from '@/lib/supabase/hooks/useBookingById';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { generateAvailableSlots, scoreSlots, buildSlotRenderItems } from '@/lib/utils/smartSlots';
import type { TimeRange, SlotWithScore, SlotRenderItem } from '@/lib/utils/smartSlots';
import type { WorkingHoursConfig } from '@/types/database';
import { formatPrice } from '@/components/master/services/types';
import { formatDurationFull, getDayOfWeek } from '@/lib/utils/dates';
import { computeEndTime } from '@/lib/utils/bookingEngine';
import {
  updateMasterNotes
} from '@/app/(master)/dashboard/bookings/actions';
import { PricingBadge } from '@/components/shared/PricingBadge';
import type { BookingStatus } from '@/types/database';
import { BOOKING_STATUS_CONFIG } from '@/lib/constants/bookingStatus';
import { statusGlow } from '@/lib/utils/statusGlow';

const UA_MONTHS = [
  'січня','лютого','березня','квітня','травня','червня',
  'липня','серпня','вересня','жовтня','листопада','грудня',
];
const UA_DAYS_SHORT = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${UA_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Час+дата для status_changed_at (timestamptz ISO). Напр.: «12 червня, 14:30». */
function formatDateTime(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${UA_MONTHS[d.getMonth()]}, ${hh}:${mm}`;
}

function toISOLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

interface ScheduleStore {
  templates: Record<string, { start_time: string; end_time: string; break_start: string | null; break_end: string | null }>;
  exceptions: Record<string, { is_day_off: boolean; start_time: string | null; end_time: string | null }>;
  bookingsByDate: Record<string, TimeRange[]>;
}

interface ReschedulePanelProps {
  masterId: string;
  currentBookingId: string;
  durationMinutes: number;
  workingHours: WorkingHoursConfig | null;
  onConfirm: (date: string, startTime: string, endTime: string) => void;
  onCancel: () => void;
  isSaving: boolean;
  saveError: string | null;
}

function ReschedulePanel({
  masterId, currentBookingId, durationMinutes, workingHours,
  onConfirm, onCancel, isSaving, saveError,
}: ReschedulePanelProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  const rangeFrom = toISOLocal(days[0]);
  const rangeTo   = toISOLocal(days[days.length - 1]);

  const scheduleQuery = useQuery({
    queryKey: ['reschedule-store', masterId, rangeFrom, currentBookingId],
    queryFn: async () => {
      const supabase = createClient();
      const [tplRes, excRes, bookRes] = await Promise.all([
        supabase
          .from('schedule_templates')
          .select('day_of_week, is_working, start_time, end_time, break_start, break_end')
          .eq('master_id', masterId),
        supabase
          .from('schedule_exceptions')
          .select('date, is_day_off, start_time, end_time')
          .eq('master_id', masterId)
          .gte('date', rangeFrom)
          .lte('date', rangeTo),
        supabase
          .from('bookings')
          .select('date, start_time, end_time')
          .eq('master_id', masterId)
          .gte('date', rangeFrom)
          .lte('date', rangeTo)
          .neq('status', 'cancelled')
          .neq('id', currentBookingId),
      ]);

      if (tplRes.error) throw tplRes.error;
      if (excRes.error) throw excRes.error;
      if (bookRes.error) throw bookRes.error;

      const templates: ScheduleStore['templates'] = {};
      for (const t of tplRes.data ?? []) {
        if (t.is_working) {
          templates[t.day_of_week as string] = {
            start_time:  (t.start_time  as string).slice(0, 5),
            end_time:    (t.end_time    as string).slice(0, 5),
            break_start: t.break_start ? (t.break_start as string).slice(0, 5) : null,
            break_end:   t.break_end   ? (t.break_end   as string).slice(0, 5) : null,
          };
        }
      }

      const exceptions: ScheduleStore['exceptions'] = {};
      for (const e of excRes.data ?? []) {
        exceptions[e.date as string] = {
          is_day_off:  e.is_day_off  as boolean,
          start_time:  e.start_time  ? (e.start_time  as string).slice(0, 5) : null,
          end_time:    e.end_time    ? (e.end_time    as string).slice(0, 5) : null,
        };
      }

      const bookingsByDate: ScheduleStore['bookingsByDate'] = {};
      for (const b of bookRes.data ?? []) {
        const dk = b.date as string;
        if (!bookingsByDate[dk]) bookingsByDate[dk] = [];
        bookingsByDate[dk].push({
          start: (b.start_time as string).slice(0, 5),
          end:   (b.end_time   as string).slice(0, 5),
        });
      }

      return { templates, exceptions, bookingsByDate } as ScheduleStore;
    },
    enabled: !!masterId,
    staleTime: 60_000,
  });

  const store = scheduleQuery.data ?? null;

  const getBreaks = useCallback((d: Date): TimeRange[] => {
    if (!store) return [];
    const tpl = store.templates[getDayOfWeek(d)];
    if (!tpl) return [];
    const breaks: TimeRange[] = [];
    if (tpl.break_start && tpl.break_end) breaks.push({ start: tpl.break_start, end: tpl.break_end });
    if (workingHours?.breaks?.length) breaks.push(...workingHours.breaks);
    return breaks;
  }, [store, workingHours]);

  const getSlotsForDate = useCallback((d: Date): SlotWithScore[] => {
    if (!store || durationMinutes <= 0) return [];
    const dateStr = toISOLocal(d);
    const tpl = store.templates[getDayOfWeek(d)];
    if (!tpl) return [];
    const exc = store.exceptions[dateStr];
    if (exc?.is_day_off) return [];
    const workStart = exc?.start_time ?? tpl.start_time;
    const workEnd   = exc?.end_time   ?? tpl.end_time;
    const raw = generateAvailableSlots({
      workStart, workEnd,
      bookings:          store.bookingsByDate[dateStr] ?? [],
      breaks:            getBreaks(d),
      bufferMinutes:     workingHours?.buffer_time_minutes ?? 0,
      requestedDuration: durationMinutes,
      stepMinutes:       15,
      selectedDate:      d,
    });
    return scoreSlots(raw, {});
  }, [store, durationMinutes, workingHours, getBreaks]);

  const isDayOff = useCallback((d: Date): boolean => {
    if (!store) return false;
    if (!store.templates[getDayOfWeek(d)]) return true;
    return store.exceptions[toISOLocal(d)]?.is_day_off ?? false;
  }, [store]);

  const fullyBookedDates = useMemo(() => {
    if (!store || durationMinutes <= 0) return new Set<string>();
    return new Set(
      days
        .filter(d => !isDayOff(d))
        .filter(d => !getSlotsForDate(d).some(s => s.available))
        .map(d => toISOLocal(d))
    );
  }, [store, days, durationMinutes, isDayOff, getSlotsForDate]);

  const hasAutoSelected = useRef(false);
  useEffect(() => {
    if (hasAutoSelected.current || !store) return;
    const first = days.find(d => !isDayOff(d) && !fullyBookedDates.has(toISOLocal(d)));
    if (first) { setSelectedDate(first); hasAutoSelected.current = true; }
  }, [store, days, isDayOff, fullyBookedDates]);

  const dateStr    = selectedDate ? toISOLocal(selectedDate) : null;
  const slots      = useMemo(() => selectedDate ? getSlotsForDate(selectedDate) : [], [selectedDate, getSlotsForDate]);
  const renderItems: SlotRenderItem[] = useMemo(
    () => buildSlotRenderItems(slots, selectedDate ? getBreaks(selectedDate) : []),
    [slots, selectedDate, getBreaks],
  );

  const handleConfirm = () => {
    if (!selectedDate || !selectedSlot) return;
    onConfirm(toISOLocal(selectedDate), selectedSlot, computeEndTime(selectedSlot, durationMinutes));
  };

  const currentDayOff     = selectedDate ? isDayOff(selectedDate) : false;
  const hasAvailableSlots = renderItems.some(i => i.kind === 'slot' && i.slot.available);

  return (
    <div className="flex flex-col gap-3">
      {/* Date strip */}
      <div>
        <p className="text-[11px] text-muted-foreground/60 mb-2">Оберіть нову дату</p>
        {scheduleQuery.isLoading ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 size={14} className="animate-spin text-primary" />
            <span className="text-xs text-muted-foreground/60">Завантаження розкладу...</span>
          </div>
        ) : (
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {days.map(d => {
              const iso        = toISOLocal(d);
              const isSelected = dateStr === iso;
              const off        = isDayOff(d);
              const full       = !off && fullyBookedDates.has(iso);
              const disabled   = off || full;
              return (
                <button
                  type="button"
                  key={iso}
                  onClick={() => { if (!disabled) { setSelectedDate(d); setSelectedSlot(null); } }}
                  disabled={disabled}
                  className={`flex-shrink-0 flex flex-col items-center w-11 py-2 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-md'
                      : off
                      ? 'bg-secondary/40 border border-dashed border-secondary/80 opacity-40 cursor-not-allowed'
                      : full
                      ? 'bg-destructive/8 border border-dashed border-destructive/30 cursor-not-allowed'
                      : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <span className={`text-[10px] font-semibold leading-none ${isSelected ? 'text-white/80' : 'text-muted-foreground/60'}`} aria-hidden="true">
                    {UA_DAYS_SHORT[d.getDay()]}
                  </span>
                  <span className="text-sm font-bold leading-none mt-1">{d.getDate()}</span>
                  {full && <span className="text-[8px] text-destructive leading-none mt-0.5">зайнято</span>}
                  {off  && <span className="text-[8px] text-muted-foreground/60 leading-none mt-0.5">вих.</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Slots */}
      {selectedDate && !scheduleQuery.isLoading && (
        <div>
          <p className="text-[11px] text-muted-foreground/60 mb-2">Доступні слоти</p>
          {currentDayOff ? (
            <p className="text-xs text-muted-foreground/60 py-2">Майстер не працює цього дня</p>
          ) : !hasAvailableSlots ? (
            <p className="text-xs text-muted-foreground/60 py-2">Немає вільних слотів</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {renderItems.map((item, idx) =>
                item.kind === 'break' ? (
                  <div key={`brk-${idx}`} className="col-span-3 flex items-center gap-2 py-0.5">
                    <div className="flex-1 h-px bg-secondary" />
                    <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">
                      {item.label} · {item.start}–{item.end}
                    </span>
                    <div className="flex-1 h-px bg-secondary" />
                  </div>
                ) : (
                  <button
                    type="button"
                    key={item.slot.time}
                    onClick={() => setSelectedSlot(item.slot.time)}
                    className={`relative py-2.5 rounded-xl text-center text-xs font-semibold transition-all ${
                      selectedSlot === item.slot.time
                        ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
                        : item.slot.isSuggested
                        ? 'bg-primary/10 border border-primary/30 text-foreground'
                        : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {item.slot.isSuggested && selectedSlot !== item.slot.time && (
                      <span className="absolute -top-1 -right-0.5 size-3 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                        <Star size={6} className="fill-white text-white" />
                      </span>
                    )}
                    <span className="block font-bold">{item.slot.time}</span>
                    <span className={`block text-[10px] font-normal mt-0.5 ${selectedSlot === item.slot.time ? 'text-white/70' : 'text-muted-foreground/60'}`}>
                      {computeEndTime(item.slot.time, durationMinutes)}
                    </span>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}

      {saveError && <p className="text-xs text-destructive">{saveError}</p>}

      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSaving || !selectedDate || !selectedSlot}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 active:scale-[0.95] transition-all"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CalendarClock size={14} />}
          Зберегти перенесення
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl bg-secondary text-muted-foreground/60 text-sm font-semibold hover:bg-secondary/80 active:scale-[0.88] transition-all"
        >
          Скасувати
        </button>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export function BookingDetailsModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const { masterProfile } = useMasterContext();
  const qc = useQueryClient();
  const {
    booking, isLoading,
    clientLtv,
    updateStatus, isUpdatingStatus,
    saveMasterNotes, saveMasterNotesAsync, isSavingNotes,
    reschedule, isRescheduling, rescheduleError,
  } = useBookingById(bookingId);

  // PERSISTENCE LOGIC: Keep the booking data visible while the modal is closing
  const [lastBooking, setLastBooking] = useState<any>(null);
  const [lastLtv, setLastLtv] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  useEffect(() => {
    if (booking) {
      setLastBooking(booking);
      setNotes(booking.master_notes ?? '');
      setNotesDirty(false);
      setShowReschedule(false);
    }
    if (clientLtv) {
      setLastLtv(clientLtv);
    }
  }, [booking, clientLtv]);

  const displayBooking = booking || lastBooking;
  const displayLtv = clientLtv || lastLtv;

  // LIFECYCLE: Local open state to decouple animation from URL
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (bookingId) {
      setIsModalOpen(true);
    }
  }, [bookingId]);

  const handleClose = () => {
    setIsModalOpen(false);
    // Wait for animation to finish (approx 400ms) before changing URL
    setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('bookingId');
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
    }, 400);
  };

  // AUTO-SAVE LOGIC
  useEffect(() => {
    if (!notesDirty) return;

    const timer = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        await saveMasterNotesAsync(notes);
      } finally {
        setNotesDirty(false);
        setIsAutoSaving(false);
      }
    }, 500); // Faster debounce for "instant" feel

    return () => clearTimeout(timer);
  }, [notes, notesDirty, saveMasterNotesAsync]);

  const canAct = displayBooking && ['pending', 'confirmed'].includes(displayBooking.status);
  const isTerminal = !!displayBooking && ['completed', 'cancelled', 'no_show'].includes(displayBooking.status);
  const clientId = displayBooking?.client_id ?? null;
  const cfg = displayBooking ? BOOKING_STATUS_CONFIG[displayBooking.status as BookingStatus] : undefined;
  const statusColor = cfg?.color ?? '#789A99';

  const UNIT_LABEL_MODAL: Record<'pcs' | 'ml' | 'g', string> = { pcs: 'шт', ml: 'мл', g: 'г' };
  const { data: bookingConsumables = [] } = useConsumablesForBooking(
    displayBooking?.status === 'confirmed' ? (bookingId ?? null) : null
  );
  const durationMinutes = displayBooking?.services.reduce((acc: number, s: any) => acc + s.duration, 0) || 0;

  // «Записати знову» — переюз UrlActionBus (BookingsPage підписаний на booking:create).
  // Одна навігація: прибирає bookingId і тригерить майстер запису з pre-fill клієнта.
  const handleRebook = () => {
    setIsModalOpen(false);
    const params = new URLSearchParams();
    params.set('_action', 'booking:create');
    if (clientId) params.set('clientId', clientId);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleOpenProfile = () => {
    if (!displayBooking) return;
    setIsModalOpen(false);
    router.push(`/dashboard/clients?clientPhone=${encodeURIComponent(displayBooking.client_phone)}`);
  };

  return (
    <Sheet
      open={isModalOpen}
      onOpenChange={(v) => !v && handleClose()}
      title="Деталі запису"
    >
      {isLoading && !displayBooking ? (
        <div className="flex flex-col gap-4 animate-pulse" aria-busy="true">
          <div className="h-20 rounded-3xl bg-secondary/50" />
          <div className="h-56 rounded-3xl bg-secondary/50" />
          <div className="h-24 rounded-3xl bg-secondary/50" />
        </div>
      ) : !displayBooking ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground/60">
          <CalendarClock size={30} className="opacity-25" />
          <p className="text-sm font-medium">Запис не знайдено</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Identity Header (спільний ClientIdentityHeader — M-CLI-06) */}
          <ClientIdentityHeader
            name={displayBooking.client_name}
            phone={displayBooking.client_phone}
            statusPill={
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0"
                style={{ color: statusColor, background: cfg?.bg || '#789A9910' }}
              >
                {cfg?.label || displayBooking.status}
              </span>
            }
          />

          {/* RECEIPT — bold hero (дата/час/статус) + склад замовлення + total */}
          <div className="bento-card overflow-hidden">
            {/* Hero band */}
            <div className="px-5 pt-5 pb-4" style={{ backgroundImage: statusGlow(statusColor) }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-1.5">Запис на</p>
                  <p className="heading-serif text-[26px] leading-[1.05] text-foreground">{formatDate(displayBooking.date)}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-sm font-bold text-foreground">
                    <Clock size={14} className="text-primary opacity-70 shrink-0" />
                    <span className="tabular-nums">{displayBooking.start_time} — {displayBooking.end_time}</span>
                    {durationMinutes > 0 && (
                      <span className="text-muted-foreground/60 font-medium">· {formatDurationFull(durationMinutes)}</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  {displayBooking.source === 'manual' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/70 bg-secondary/60 px-2.5 py-1 rounded-full">
                      <PenLine size={11} /> Вручну
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      <Globe size={11} /> Онлайн
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Line items */}
            {(displayBooking.services.length > 0 || (displayBooking.products && displayBooking.products.length > 0)) && (
              <>
                <div className="border-t border-dashed border-border/70 mx-5" />
                <div className="px-5 py-4 flex flex-col gap-3">
                  {displayBooking.services.map((s: any, i: number) => (
                    <div key={`s-${i}`} className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Clock size={14} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{s.name}</p>
                          <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">{formatDurationFull(s.duration)}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-foreground shrink-0 tabular-nums">{formatPrice(s.price)}</span>
                    </div>
                  ))}

                  {(displayBooking.products ?? []).length > 0 && (
                    <>
                      <div className="border-t border-dashed border-border/50 my-0.5" />
                      {displayBooking.products!.map((p: any, i: number) => (
                        <div key={`p-${i}`} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="size-8 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
                              <ShoppingBag size={14} className="text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                              <p className="text-[10px] font-medium text-muted-foreground/60">× {p.quantity}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-foreground shrink-0 tabular-nums">{formatPrice(p.price * p.quantity)}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </>
            )}

            {/* Total */}
            <div className="px-5 pb-5 pt-4 border-t-2 border-dashed border-border/70">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">Разом</span>
                <span className="heading-serif text-3xl text-foreground tabular-nums">{formatPrice(displayBooking.total_price)}</span>
              </div>
              {displayBooking.dynamic_pricing_label && (
                <div className="mt-3">
                  {displayBooking.dynamic_pricing_label.includes('Бартерна') ? (
                    <div className="flex items-center gap-2 text-[11px] font-bold text-sage bg-sage/10 px-3 py-2 rounded-xl border border-sage/20 leading-tight">
                      <Heart size={14} className="fill-primary text-primary shrink-0" />
                      <span>
                        Знижка Ambassador: <span className="text-primary">{displayBooking.client_name}</span> запросив тебе у Bookit <Heart size={10} className="inline-block fill-primary text-primary ml-0.5 mb-0.5" />
                      </span>
                    </div>
                  ) : (
                    <PricingBadge dynamicLabel={displayBooking.dynamic_pricing_label} size="md" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Підсумок статусу (термінальні): коли + причина (дані з useBookingById) */}
          {isTerminal && (
            <div
              className="rounded-3xl p-4 flex items-start gap-3"
              style={{ background: `${statusColor}0F`, border: `1px solid ${statusColor}22` }}
            >
              <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${statusColor}1A` }}>
                <span style={{ color: statusColor }}>
                  {displayBooking.status === 'completed'
                    ? <CheckCircle2 size={16} />
                    : displayBooking.status === 'cancelled'
                    ? <Ban size={16} />
                    : <XCircle size={16} />}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-foreground">
                    {displayBooking.status === 'completed'
                      ? 'Завершено'
                      : displayBooking.status === 'cancelled'
                      ? 'Скасовано'
                      : 'Клієнт не прийшов'}
                  </p>
                  {displayBooking.status_changed_at && (
                    <span className="text-[11px] font-medium text-muted-foreground/60">
                      {formatDateTime(displayBooking.status_changed_at)}
                    </span>
                  )}
                </div>
                {displayBooking.status === 'cancelled' && displayBooking.cancellation_reason && (
                  <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                    <span className="text-muted-foreground/60">Причина: </span>
                    {displayBooking.cancellation_reason}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Профіль клієнта (спільний ClientStatChips — M-CLI-06) */}
          {displayLtv && (
            <div className="bento-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-primary opacity-60" />
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">Профіль клієнта</p>
                </div>
                {clientId && (
                  <button
                    type="button"
                    onClick={handleOpenProfile}
                    className="flex items-center gap-0.5 text-[11px] font-bold text-primary hover:text-primary/80 active:scale-95 transition-all"
                  >
                    Відкрити <ChevronRight size={13} />
                  </button>
                )}
              </div>
              <ClientStatChips
                chips={[
                  { icon: Calendar, label: 'Візити', value: displayLtv.total_visits, color: '#0F766E' },
                  { icon: TrendingUp, label: 'Виручка', value: formatPrice(displayLtv.total_spent), color: '#15803D' },
                  { icon: Star, label: 'Сер. чек', value: formatPrice(displayLtv.average_check), color: '#B45309' },
                ] satisfies StatChip[]}
              />
            </div>
          )}

          {/* Consumables */}
          {bookingConsumables.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <FlaskConical size={14} className="text-muted-foreground/60" />
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Матеріали сеансу</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {bookingConsumables.map(c => (
                  <div key={c.product_id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/40 border border-border/40">
                    <span className="text-xs font-medium text-foreground">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground/60">{c.total_qty} {UNIT_LABEL_MODAL[c.unit]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-3">
            {displayBooking.notes && (
              <div className="bg-primary/5 rounded-3xl p-4 border border-primary/10">
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1.5">Коментар клієнта</p>
                <p className="text-sm text-foreground/80 italic font-medium leading-relaxed">&laquo;{displayBooking.notes}&raquo;</p>
              </div>
            )}

            <div className="bg-secondary/40 rounded-3xl p-5 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">Нотатки майстра</p>
                {isAutoSaving && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary animate-pulse uppercase tracking-widest">
                    <Loader2 size={10} className="animate-spin" />
                    Зберігаємо...
                  </span>
                )}
              </div>
              <textarea
                aria-label="Нотатки майстра"
                value={notes}
                onChange={e => { setNotes(e.target.value); setNotesDirty(true); }}
                placeholder="Додайте нотатки, видимі лише вам..."
                rows={3}
                className="w-full text-sm text-foreground placeholder-text-mute/40 bg-secondary/60 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 resize-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Active management actions */}
          {canAct && (
            <div className="bg-secondary/40 rounded-3xl p-5 border border-border shadow-sm">
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-4">Керування записом</p>

              {showReschedule ? (
                masterProfile?.id ? (
                  <ReschedulePanel
                    masterId={masterProfile.id}
                    currentBookingId={displayBooking.id}
                    durationMinutes={durationMinutes}
                    workingHours={masterProfile.working_hours ?? null}
                    onConfirm={(date, startTime, endTime) => {
                      reschedule({ date, startTime, endTime });
                      setShowReschedule(false);
                    }}
                    onCancel={() => setShowReschedule(false)}
                    isSaving={isRescheduling}
                    saveError={rescheduleError}
                  />
                ) : null
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {displayBooking.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => updateStatus('confirmed')}
                      disabled={isUpdatingStatus}
                      className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary/10 text-primary hover:bg-primary/15 text-sm font-bold transition-all disabled:opacity-50 active:scale-[0.95]"
                    >
                      {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Підтвердити
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => updateStatus('completed')}
                    disabled={isUpdatingStatus}
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-success/10 text-success hover:bg-success/15 text-sm font-bold transition-all disabled:opacity-50 active:scale-[0.95]"
                  >
                    {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                    Завершити
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReschedule(true)}
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-warning/10 text-warning hover:bg-warning/15 text-sm font-bold transition-all active:scale-[0.95]"
                  >
                    <CalendarClock size={16} />
                    Перенести
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus('cancelled')}
                    disabled={isUpdatingStatus}
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/15 text-sm font-bold transition-all disabled:opacity-50 active:scale-[0.95]"
                  >
                    {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                    Скасувати
                  </button>
                  {displayBooking.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => updateStatus('no_show')}
                      disabled={isUpdatingStatus}
                      className="col-span-2 flex items-center justify-center gap-2 py-4 rounded-xl bg-secondary/60 border border-border text-muted-foreground/60 hover:text-muted-foreground text-sm font-bold transition-all disabled:opacity-50 active:scale-[0.95]"
                    >
                      Клієнт не прийшов
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Terminal-status next steps — заміна «глухого кута» */}
          {isTerminal && (
            <div className={`grid gap-2.5 ${clientId ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <button
                type="button"
                onClick={handleRebook}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-white text-sm font-bold transition-all hover:bg-primary/90 active:scale-[0.95]"
              >
                <RotateCcw size={16} />
                Записати знову
              </button>
              {clientId && (
                <button
                  type="button"
                  onClick={handleOpenProfile}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-secondary/60 border border-border text-foreground text-sm font-bold transition-all hover:bg-secondary active:scale-[0.95]"
                >
                  Профіль клієнта
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
