'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X, Clock, Phone, Globe, PenLine,
  CheckCircle2, XCircle, Star, Save, Loader2,
  TrendingUp, ShoppingBag, CalendarClock, Heart,
} from 'lucide-react';
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

const UA_MONTHS = [
  'січня','лютого','березня','квітня','травня','червня',
  'липня','серпня','вересня','жовтня','листопада','грудня',
];
const UA_DAYS_SHORT = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${UA_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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
      for (const t of (tplRes.data ?? []) as any[]) {
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
      for (const e of (excRes.data ?? []) as any[]) {
        exceptions[e.date as string] = {
          is_day_off:  e.is_day_off  as boolean,
          start_time:  e.start_time  ? (e.start_time  as string).slice(0, 5) : null,
          end_time:    e.end_time    ? (e.end_time    as string).slice(0, 5) : null,
        };
      }

      const bookingsByDate: ScheduleStore['bookingsByDate'] = {};
      for (const b of (bookRes.data ?? []) as any[]) {
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
                  key={iso}
                  onClick={() => { if (!disabled) { setSelectedDate(d); setSelectedSlot(null); } }}
                  disabled={disabled}
                  className={`flex-shrink-0 flex flex-col items-center w-11 py-2 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-md'
                      : off
                      ? 'bg-white/40 border border-dashed border-secondary/80 opacity-40 cursor-not-allowed'
                      : full
                      ? 'bg-destructive/8 border border-dashed border-destructive/30 cursor-not-allowed'
                      : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <span className={`text-[10px] font-semibold leading-none ${isSelected ? 'text-white/80' : 'text-muted-foreground/60'}`}>
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
                    key={item.slot.time}
                    onClick={() => setSelectedSlot(item.slot.time)}
                    className={`relative py-2.5 rounded-xl text-center text-xs font-semibold transition-all ${
                      selectedSlot === item.slot.time
                        ? 'bg-primary text-white shadow-sm ring-2 ring-[#789A99]/30'
                        : item.slot.isSuggested
                        ? 'bg-primary/10 border border-primary/30 text-foreground'
                        : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {item.slot.isSuggested && selectedSlot !== item.slot.time && (
                      <span className="absolute -top-1 -right-0.5 text-[7px] bg-primary text-white rounded-full px-1 py-0.5 font-bold leading-none">★</span>
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
          onClick={handleConfirm}
          disabled={isSaving || !selectedDate || !selectedSlot}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 active:scale-95 transition-all"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CalendarClock size={14} />}
          Зберегти перенесення
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl bg-secondary text-muted-foreground/60 text-sm font-semibold hover:bg-[#EBCFC7] transition-colors active:scale-95 transition-all"
        >
          Скасувати
        </button>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

import { BottomSheet } from '@/components/ui/BottomSheet';

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

  const [notes, setNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

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
  const durationMinutes = displayBooking?.services.reduce((acc: number, s: any) => acc + s.duration, 0) || 0;

  return (
    <BottomSheet 
      isOpen={isModalOpen} 
      onClose={handleClose}
      title="Деталі запису"
    >
      {isLoading && !displayBooking ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 size={24} className="text-primary animate-spin" />
        </div>
      ) : !displayBooking ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground/60">
          <Loader2 size={20} className="animate-spin opacity-20" />
          <p className="text-xs font-medium">Дані не знайдено</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Identity Header (Matching ClientDetailSheet style) */}
          <div className="flex items-center gap-4 bg-white/60 p-4 rounded-3xl border border-white/80 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-peach to-white flex items-center justify-center text-peach-foreground text-xl font-black shadow-sm shrink-0">
              {displayBooking.client_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-black text-foreground leading-tight truncate">{displayBooking.client_name}</h3>
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0"
                  style={{ color: BOOKING_STATUS_CONFIG[displayBooking.status as BookingStatus]?.color || '#789A99', background: BOOKING_STATUS_CONFIG[displayBooking.status as BookingStatus]?.bg || '#789A9910' }}
                >
                  {BOOKING_STATUS_CONFIG[displayBooking.status as BookingStatus]?.label || displayBooking.status}
                </span>
              </div>
              <p className="text-xs font-bold text-muted-foreground/60 mt-0.5">{displayBooking.client_phone}</p>
            </div>
          </div>

          {/* Time & Info card */}
          <div className="bg-white/40 rounded-3xl p-5 border border-white/60 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Дата та час</p>
                <p className="text-sm font-bold text-foreground">{formatDate(displayBooking.date)}</p>
              </div>
              <div className="text-right flex flex-col gap-1">
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Вікно</p>
                <div className="flex items-center gap-1.5 font-bold text-foreground text-sm">
                  <Clock size={14} className="text-primary opacity-60" />
                  {displayBooking.start_time} — {displayBooking.end_time}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-dashed border-white/60">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Джерело</p>
                {displayBooking.source === 'manual' ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-mute/60">
                    <PenLine size={12} /> Ручний запис
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-primary">
                    <Globe size={12} /> Онлайн запис
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 items-end">
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Зв'язок</p>
                <a
                  href={`tel:${displayBooking.client_phone}`}
                  className="flex items-center gap-1.5 text-primary font-bold hover:text-primary/90 transition-colors text-sm"
                >
                  <Phone size={14} /> Зателефонувати
                </a>
              </div>
            </div>
          </div>

          {/* LTV клієнта */}
          {displayLtv && (
            <div className="bg-white/40 rounded-3xl p-5 border border-white/60 shadow-sm">
              <div className="flex items-center gap-1.5 mb-4">
                <TrendingUp size={14} className="text-primary opacity-60" />
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Профіль клієнта</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter mb-1">Візитів</p>
                  <p className="text-xl font-black text-foreground">{displayLtv.total_visits}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter mb-1">Виручка</p>
                  <p className="text-xl font-black text-foreground">{formatPrice(displayLtv.total_spent)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter mb-1">Сер. чек</p>
                  <p className="text-xl font-black text-foreground">{formatPrice(displayLtv.average_check)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Order details */}
          {(displayBooking.services.length > 0 || (displayBooking.products && displayBooking.products.length > 0)) && (
            <div className="bg-white/40 rounded-3xl p-5 border border-white/60 shadow-sm">
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-4">Склад замовлення</p>

              <div className="flex flex-col gap-3">
                {displayBooking.services.map((s: any, i: number) => (
                  <div key={i} className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock size={14} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{s.name}</p>
                        <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">{formatDurationFull(s.duration)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-foreground shrink-0">{formatPrice(s.price)}</span>
                  </div>
                ))}

                {(displayBooking.products ?? []).length > 0 && (
                  <>
                    <div className="border-t border-dashed border-white/60 my-1" />
                    {displayBooking.products!.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-secondary/40 flex items-center justify-center shrink-0">
                            <ShoppingBag size={14} className="text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                            <p className="text-[10px] font-medium text-muted-foreground/60">Кількість: {p.quantity}</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-foreground shrink-0">{formatPrice(p.price * p.quantity)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Total */}
              <div className="mt-5 pt-4 border-t-2 border-white/60">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">Разом до сплати</span>
                  <span className="text-2xl font-black text-foreground">{formatPrice(displayBooking.total_price)}</span>
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
          )}

          {/* Notes */}
          <div className="flex flex-col gap-3">
            {displayBooking.notes && (
              <div className="bg-primary/5 rounded-3xl p-4 border border-primary/10">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">Коментар клієнта</p>
                <p className="text-sm text-foreground/80 italic font-medium leading-relaxed">"{displayBooking.notes}"</p>
              </div>
            )}

            <div className="bg-white/40 rounded-3xl p-5 border border-white/60 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Нотатки майстра</p>
                {isAutoSaving && (
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-primary animate-pulse uppercase tracking-widest">
                    <Loader2 size={10} className="animate-spin" />
                    Зберігаємо...
                  </span>
                )}
              </div>
              <textarea
                value={notes}
                onChange={e => { setNotes(e.target.value); setNotesDirty(true); }}
                placeholder="Додайте нотатки, видимі лише вам..."
                rows={3}
                className="w-full text-sm text-foreground placeholder-text-mute/40 bg-white/60 border border-white/80 rounded-2xl px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 resize-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Status actions */}
          {canAct && (
            <div className="bg-white/40 rounded-3xl p-5 border border-white/60 shadow-sm">
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-4">Керування записом</p>

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
                      onClick={() => updateStatus('confirmed')}
                      disabled={isUpdatingStatus}
                      className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary/10 text-primary hover:bg-primary/15 text-sm font-bold transition-all disabled:opacity-50 active:scale-95"
                    >
                      {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Підтвердити
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus('completed')}
                    disabled={isUpdatingStatus}
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-success/10 text-success hover:bg-success/15 text-sm font-bold transition-all disabled:opacity-50 active:scale-95"
                  >
                    {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                    Завершити
                  </button>
                  <button
                    onClick={() => setShowReschedule(true)}
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-warning/10 text-warning hover:bg-warning/15 text-sm font-bold transition-all active:scale-95"
                  >
                    <CalendarClock size={16} />
                    Перенести
                  </button>
                  <button
                    onClick={() => updateStatus('cancelled')}
                    disabled={isUpdatingStatus}
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/15 text-sm font-bold transition-all disabled:opacity-50 active:scale-95"
                  >
                    {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                    Скасувати
                  </button>
                  {displayBooking.status === 'confirmed' && (
                    <button
                      onClick={() => updateStatus('no_show')}
                      disabled={isUpdatingStatus}
                      className="col-span-2 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/60 border border-white/80 text-muted-foreground/60 hover:text-muted-foreground text-sm font-bold transition-all disabled:opacity-50 active:scale-95"
                    >
                      Клієнт не з'явився
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
