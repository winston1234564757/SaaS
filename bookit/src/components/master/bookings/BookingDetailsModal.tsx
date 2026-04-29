'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X, Clock, Phone, Globe, PenLine,
  CheckCircle2, XCircle, Star, Save, Loader2,
  TrendingUp, ShoppingBag, CalendarClock,
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
    saveMasterNotes, isSavingNotes,
    reschedule, isRescheduling, rescheduleError,
  } = useBookingById(bookingId);

  const [notes, setNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);

  useEffect(() => {
    if (booking) {
      setNotes(booking.master_notes ?? '');
      setNotesDirty(false);
      setShowReschedule(false);
    }
  }, [booking?.id]);

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('bookingId');
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close]);



  const handleSaveNotes = () => {
    saveMasterNotes(notes);
    setNotesDirty(false);
  };

  const durationMinutes = useMemo(
    () => (booking?.services ?? []).reduce((sum, s) => sum + s.duration, 0),
    [booking?.services],
  );

  const isOpen = !!bookingId;
  const canAct = booking?.status === 'pending' || booking?.status === 'confirmed';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-3xl bg-[#FDFAF8] shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-secondary/80" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4">
              <h2 className="text-base font-bold text-foreground">Деталі запису</h2>
              <button
                onClick={close}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-muted-foreground/60 hover:bg-[#EBCFC7] transition-colors active:scale-95 transition-all"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content */}
            {isLoading || !booking ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 size={24} className="text-primary animate-spin" />
              </div>
            ) : (
              <div className="px-5 pb-8 flex flex-col gap-4">
                {/* Client + date block */}
                <div className="bg-white rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-base font-bold text-foreground">{booking.client_name}</p>
                      <p className="text-sm text-muted-foreground/60 mt-0.5">{formatDate(booking.date)}</p>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full mt-0.5"
                      style={{ color: BOOKING_STATUS_CONFIG[booking.status].color, background: BOOKING_STATUS_CONFIG[booking.status].bg }}
                    >
                      {BOOKING_STATUS_CONFIG[booking.status].label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-muted-foreground/60" />
                      {booking.start_time} — {booking.end_time}
                    </span>
                    <a
                      href={`tel:${booking.client_phone}`}
                      className="flex items-center gap-1.5 text-primary hover:text-primary/90 transition-colors"
                    >
                      <Phone size={13} />
                      {booking.client_phone}
                    </a>
                  </div>

                  <div>
                    {booking.source === 'manual' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 bg-secondary px-2 py-0.5 rounded-full">
                        <PenLine size={9} /> Ручний запис
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <Globe size={9} /> Онлайн
                      </span>
                    )}
                  </div>
                </div>

                {/* LTV клієнта */}
                {clientLtv && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-3">
                      <TrendingUp size={13} className="text-primary" />
                      <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide">Клієнт</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <p className="text-[11px] text-muted-foreground/60">Візитів</p>
                        <p className="text-lg font-bold text-foreground">{clientLtv.total_visits}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-muted-foreground/60">Виручка</p>
                        <p className="text-lg font-bold text-foreground">{formatPrice(clientLtv.total_spent)}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-muted-foreground/60">Середній чек</p>
                        <p className="text-lg font-bold text-foreground">{formatPrice(clientLtv.average_check)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order details — services + products unified */}
                {(booking.services.length > 0 || (booking.products && booking.products.length > 0)) && (() => {
                  const grandTotal = booking.total_price;
                  return (
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide mb-3">Деталі замовлення</p>

                      <div className="flex flex-col gap-2.5">
                        {/* Services */}
                        {booking.services.map((s, i) => (
                          <div key={i} className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <Clock size={12} className="text-muted-foreground/60 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="text-sm text-foreground">{s.name}</span>
                                <span className="text-xs text-muted-foreground/60 ml-1.5">{formatDurationFull(s.duration)}</span>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-foreground shrink-0">{formatPrice(s.price)}</span>
                          </div>
                        ))}

                        {/* Products */}
                        {(booking.products ?? []).length > 0 && (
                          <>
                            {booking.services.length > 0 && (
                              <div className="border-t border-dashed border-[#F0DDD8] my-0.5" />
                            )}
                            {booking.products!.map((p, i) => (
                              <div key={i} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <ShoppingBag size={12} className="text-muted-foreground/60 shrink-0" />
                                  <span className="text-sm text-foreground truncate">{p.name}</span>
                                  {p.quantity > 1 && (
                                    <span className="text-xs text-muted-foreground/60 shrink-0">×{p.quantity}</span>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-foreground shrink-0">{formatPrice(p.price * p.quantity)}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>

                      {/* Total */}
                      <div className="mt-4 pt-3 border-t-2 border-[#F0DDD8]">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-muted-foreground">Загалом</span>
                          <span className="text-xl font-bold text-foreground">{formatPrice(grandTotal)}</span>
                        </div>
                        {booking.dynamic_pricing_label && (
                          <div className="mt-2">
                            <PricingBadge dynamicLabel={booking.dynamic_pricing_label} size="md" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Client notes */}
                {booking.notes && (
                  <div className="bg-secondary/50 rounded-2xl px-4 py-3">
                    <p className="text-xs font-semibold text-muted-foreground/60 mb-1">Коментар клієнта</p>
                    <p className="text-sm text-muted-foreground italic">{booking.notes}</p>
                  </div>
                )}

                {/* Master notes */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">Нотатки майстра</p>
                  <textarea
                    value={notes}
                    onChange={e => { setNotes(e.target.value); setNotesDirty(true); }}
                    placeholder="Додайте нотатки, видимі лише вам..."
                    rows={3}
                    className="w-full text-sm text-foreground placeholder-[#C8B0AA] bg-[#FDFAF8] border border-[#F0DDD8] rounded-xl px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-[#789A99]/20 resize-none transition-all"
                  />
                  {notesDirty && (
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors disabled:opacity-50 active:scale-95 transition-all"
                    >
                      {isSavingNotes ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      Зберегти нотатку
                    </button>
                  )}
                </div>

                {/* Status actions */}
                {canAct && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide mb-3">Дії</p>

                    {showReschedule ? (
                      masterProfile?.id ? (
                        <ReschedulePanel
                          masterId={masterProfile.id}
                          currentBookingId={booking.id}
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
                      <div className="flex flex-wrap gap-2">
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => updateStatus('confirmed')}
                            disabled={isUpdatingStatus}
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 text-sm font-semibold transition-colors disabled:opacity-50"
                          >
                            {isUpdatingStatus ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            Підтвердити
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus('completed')}
                          disabled={isUpdatingStatus}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-success/10 text-success hover:bg-success/20 text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          {isUpdatingStatus ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                          Завершити
                        </button>
                        <button
                          onClick={() => setShowReschedule(true)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-warning/10 text-warning hover:bg-warning/20 text-sm font-semibold transition-colors"
                        >
                          <CalendarClock size={14} />
                          Перенести
                        </button>
                        <button
                          onClick={() => updateStatus('cancelled')}
                          disabled={isUpdatingStatus}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          {isUpdatingStatus ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                          Скасувати
                        </button>
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => updateStatus('no_show')}
                            disabled={isUpdatingStatus}
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-muted-foreground/60/10 text-muted-foreground/60 hover:bg-muted-foreground/60/20 text-sm font-semibold transition-colors disabled:opacity-50"
                          >
                            Не прийшов
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
