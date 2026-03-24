'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  X, Clock, Phone, Globe, PenLine,
  CheckCircle2, XCircle, Star, Save, Loader2,
  TrendingUp, ShoppingBag, CalendarClock,
} from 'lucide-react';
import { useBookingById } from '@/lib/supabase/hooks/useBookingById';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { generateAvailableSlots, scoreSlots } from '@/lib/utils/smartSlots';
import type { TimeRange, SlotWithScore } from '@/lib/utils/smartSlots';
import type { WorkingHoursConfig } from '@/types/database';
import { formatPrice } from '@/components/master/services/types';
import { formatDurationFull } from '@/lib/utils/dates';
import { notifyClientOnStatusChange } from '@/app/(master)/dashboard/bookings/actions';
import type { BookingStatus } from '@/types/database';

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Очікує',       color: '#D4935A', bg: 'rgba(212,147,90,0.12)'   },
  confirmed: { label: 'Підтверджено', color: '#789A99', bg: 'rgba(120,154,153,0.12)' },
  completed: { label: 'Завершено',    color: '#5C9E7A', bg: 'rgba(92,158,122,0.12)'   },
  cancelled: { label: 'Скасовано',    color: '#C05B5B', bg: 'rgba(192,91,91,0.12)'    },
  no_show:   { label: 'Не прийшов',   color: '#A8928D', bg: 'rgba(168,146,141,0.12)'  },
};

const UA_MONTHS = [
  'січня','лютого','березня','квітня','травня','червня',
  'липня','серпня','вересня','жовтня','листопада','грудня',
];
const UA_DAYS_SHORT = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'];
const DOW_MAP: Record<number, string> = { 0:'sun', 1:'mon', 2:'tue', 3:'wed', 4:'thu', 5:'fri', 6:'sat' };

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${UA_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function toISOLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function computeEndTime(startTime: string, totalMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + m + totalMinutes;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

// ── Reschedule Panel ──────────────────────────────────────────────────────────

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

  const dateStr = selectedDate ? toISOLocal(selectedDate) : null;

  const slotsQuery = useQuery({
    queryKey: ['reschedule-slots', masterId, dateStr],
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
          .eq('date', dateStr!),
        supabase
          .from('bookings')
          .select('start_time, end_time')
          .eq('master_id', masterId)
          .eq('date', dateStr!)
          .neq('status', 'cancelled')
          .neq('id', currentBookingId),
      ]);

      const dow = DOW_MAP[selectedDate!.getDay()];
      const tpl = (tplRes.data ?? []).find((t: any) => t.day_of_week === dow);

      if (!tpl?.is_working) return { slots: [] as SlotWithScore[], isOffDay: true };

      const exc = excRes.data?.[0] as any;
      if (exc?.is_day_off) return { slots: [] as SlotWithScore[], isOffDay: true };

      const workStart = ((exc?.start_time ?? tpl.start_time) as string).slice(0, 5);
      const workEnd   = ((exc?.end_time   ?? tpl.end_time)   as string).slice(0, 5);

      const breaks: TimeRange[] = [];
      if (tpl.break_start && tpl.break_end) {
        breaks.push({ start: (tpl.break_start as string).slice(0, 5), end: (tpl.break_end as string).slice(0, 5) });
      }
      if (workingHours?.breaks?.length) {
        breaks.push(...workingHours.breaks);
      }

      const bookings: TimeRange[] = (bookRes.data ?? []).map((b: any) => ({
        start: (b.start_time as string).slice(0, 5),
        end:   (b.end_time   as string).slice(0, 5),
      }));

      const raw = generateAvailableSlots({
        workStart,
        workEnd,
        bookings,
        breaks,
        bufferMinutes: workingHours?.buffer_time_minutes ?? 0,
        requestedDuration: durationMinutes > 0 ? durationMinutes : 60,
        stepMinutes: 15,
      });

      return { slots: scoreSlots(raw, {}), isOffDay: false };
    },
    enabled: !!dateStr,
  });

  const handleConfirm = () => {
    if (!selectedDate || !selectedSlot) return;
    const dur = durationMinutes > 0 ? durationMinutes : 60;
    onConfirm(toISOLocal(selectedDate), selectedSlot, computeEndTime(selectedSlot, dur));
  };

  const availableSlots = slotsQuery.data?.slots.filter(s => s.available) ?? [];

  return (
    <div className="flex flex-col gap-3">
      {/* Date strip */}
      <div>
        <p className="text-[11px] text-[#A8928D] mb-2">Оберіть нову дату</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {days.map(d => {
            const iso = toISOLocal(d);
            const isSelected = dateStr === iso;
            return (
              <button
                key={iso}
                onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                className={`flex-shrink-0 flex flex-col items-center w-11 py-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-[#789A99] text-white shadow-md'
                    : 'bg-[#F5E8E3]/60 text-[#6B5750] hover:bg-[#F5E8E3]'
                }`}
              >
                <span className={`text-[10px] font-semibold leading-none ${isSelected ? 'text-white/80' : 'text-[#A8928D]'}`}>
                  {UA_DAYS_SHORT[d.getDay()]}
                </span>
                <span className="text-sm font-bold leading-none mt-1">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots */}
      {selectedDate && (
        <div>
          <p className="text-[11px] text-[#A8928D] mb-2">Доступні слоти</p>
          {slotsQuery.isLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 size={14} className="animate-spin text-[#789A99]" />
              <span className="text-xs text-[#A8928D]">Завантаження...</span>
            </div>
          ) : slotsQuery.data?.isOffDay ? (
            <p className="text-xs text-[#A8928D] py-2">Майстер не працює цього дня</p>
          ) : availableSlots.length === 0 ? (
            <p className="text-xs text-[#A8928D] py-2">Немає вільних слотів</p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {availableSlots.map(s => (
                <button
                  key={s.time}
                  onClick={() => setSelectedSlot(s.time)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    selectedSlot === s.time
                      ? 'bg-[#789A99] text-white shadow-sm'
                      : s.isSuggested
                      ? 'bg-[#789A99]/15 text-[#789A99] border border-[#789A99]/30'
                      : 'bg-[#F5E8E3]/60 text-[#6B5750] hover:bg-[#F5E8E3]'
                  }`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {saveError && <p className="text-xs text-[#C05B5B]">{saveError}</p>}

      <div className="flex gap-2 mt-1">
        <button
          onClick={handleConfirm}
          disabled={isSaving || !selectedDate || !selectedSlot}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#789A99] text-white text-sm font-semibold hover:bg-[#5C7E7D] transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CalendarClock size={14} />}
          Зберегти перенесення
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl bg-[#F5E8E3] text-[#A8928D] text-sm font-semibold hover:bg-[#EBCFC7] transition-colors"
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

  const handleStatus = (status: BookingStatus) => {
    updateStatus(status);
    if (status === 'confirmed' || status === 'cancelled') {
      notifyClientOnStatusChange(booking!.id, status).catch(() => {});
    }
  };

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
              <div className="w-10 h-1 rounded-full bg-[#E8D5CF]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4">
              <h2 className="text-base font-bold text-[#2C1A14]">Деталі запису</h2>
              <button
                onClick={close}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F5E8E3] text-[#A8928D] hover:bg-[#EBCFC7] transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content */}
            {isLoading || !booking ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 size={24} className="text-[#789A99] animate-spin" />
              </div>
            ) : (
              <div className="px-5 pb-8 flex flex-col gap-4">
                {/* Client + date block */}
                <div className="bg-white rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-base font-bold text-[#2C1A14]">{booking.client_name}</p>
                      <p className="text-sm text-[#A8928D] mt-0.5">{formatDate(booking.date)}</p>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full mt-0.5"
                      style={{ color: STATUS_CONFIG[booking.status].color, background: STATUS_CONFIG[booking.status].bg }}
                    >
                      {STATUS_CONFIG[booking.status].label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-[#6B5750]">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[#A8928D]" />
                      {booking.start_time} — {booking.end_time}
                    </span>
                    <a
                      href={`tel:${booking.client_phone}`}
                      className="flex items-center gap-1.5 text-[#789A99] hover:text-[#5C7E7D] transition-colors"
                    >
                      <Phone size={13} />
                      {booking.client_phone}
                    </a>
                  </div>

                  <div>
                    {booking.source === 'manual' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#A8928D] bg-[#F5E8E3] px-2 py-0.5 rounded-full">
                        <PenLine size={9} /> Ручний запис
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#789A99] bg-[#789A99]/10 px-2 py-0.5 rounded-full">
                        <Globe size={9} /> Онлайн
                      </span>
                    )}
                  </div>
                </div>

                {/* LTV клієнта */}
                {clientLtv && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-3">
                      <TrendingUp size={13} className="text-[#789A99]" />
                      <p className="text-xs font-semibold text-[#A8928D] uppercase tracking-wide">Клієнт</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <p className="text-[11px] text-[#A8928D]">Візитів</p>
                        <p className="text-lg font-bold text-[#2C1A14]">{clientLtv.total_visits}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-[#A8928D]">Виручка</p>
                        <p className="text-lg font-bold text-[#2C1A14]">{formatPrice(clientLtv.total_spent)}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-[#A8928D]">Середній чек</p>
                        <p className="text-lg font-bold text-[#2C1A14]">{formatPrice(clientLtv.average_check)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Services */}
                {booking.services.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-[#A8928D] uppercase tracking-wide mb-3">Послуги</p>
                    <div className="flex flex-col gap-2">
                      {booking.services.map((s, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-[#A8928D]" />
                            <span className="text-sm text-[#2C1A14]">{s.name}</span>
                            <span className="text-xs text-[#A8928D]">{formatDurationFull(s.duration)}</span>
                          </div>
                          <span className="text-sm font-medium text-[#2C1A14]">{formatPrice(s.price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#F5E8E3] flex justify-between items-center">
                      <span className="text-sm text-[#6B5750]">Разом</span>
                      <span className="text-base font-bold text-[#2C1A14]">{formatPrice(booking.total_price)}</span>
                    </div>
                  </div>
                )}

                {/* Products */}
                {booking.products && booking.products.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-3">
                      <ShoppingBag size={13} className="text-[#A8928D]" />
                      <p className="text-xs font-semibold text-[#A8928D] uppercase tracking-wide">Товари</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {booking.products.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[#2C1A14]">{p.name}</span>
                            {p.quantity > 1 && (
                              <span className="text-xs text-[#A8928D]">×{p.quantity}</span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-[#2C1A14]">{formatPrice(p.price * p.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Client notes */}
                {booking.notes && (
                  <div className="bg-[#F5E8E3]/50 rounded-2xl px-4 py-3">
                    <p className="text-xs font-semibold text-[#A8928D] mb-1">Коментар клієнта</p>
                    <p className="text-sm text-[#6B5750] italic">{booking.notes}</p>
                  </div>
                )}

                {/* Master notes */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-xs font-semibold text-[#A8928D] uppercase tracking-wide mb-2">Нотатки майстра</p>
                  <textarea
                    value={notes}
                    onChange={e => { setNotes(e.target.value); setNotesDirty(true); }}
                    placeholder="Додайте нотатки, видимі лише вам..."
                    rows={3}
                    className="w-full text-sm text-[#2C1A14] placeholder-[#C8B0AA] bg-[#FDFAF8] border border-[#F0DDD8] rounded-xl px-3 py-2.5 outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 resize-none transition-all"
                  />
                  {notesDirty && (
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#789A99]/10 text-[#789A99] hover:bg-[#789A99]/20 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isSavingNotes ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      Зберегти нотатку
                    </button>
                  )}
                </div>

                {/* Status actions */}
                {canAct && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-[#A8928D] uppercase tracking-wide mb-3">Дії</p>

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
                            onClick={() => handleStatus('confirmed')}
                            disabled={isUpdatingStatus}
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#789A99]/10 text-[#789A99] hover:bg-[#789A99]/20 text-sm font-semibold transition-colors disabled:opacity-50"
                          >
                            {isUpdatingStatus ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            Підтвердити
                          </button>
                        )}
                        <button
                          onClick={() => handleStatus('completed')}
                          disabled={isUpdatingStatus}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#5C9E7A]/10 text-[#5C9E7A] hover:bg-[#5C9E7A]/20 text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          {isUpdatingStatus ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                          Завершити
                        </button>
                        <button
                          onClick={() => setShowReschedule(true)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#D4935A]/10 text-[#D4935A] hover:bg-[#D4935A]/20 text-sm font-semibold transition-colors"
                        >
                          <CalendarClock size={14} />
                          Перенести
                        </button>
                        <button
                          onClick={() => handleStatus('cancelled')}
                          disabled={isUpdatingStatus}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#C05B5B]/10 text-[#C05B5B] hover:bg-[#C05B5B]/20 text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          {isUpdatingStatus ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                          Скасувати
                        </button>
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatus('no_show')}
                            disabled={isUpdatingStatus}
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#A8928D]/10 text-[#A8928D] hover:bg-[#A8928D]/20 text-sm font-semibold transition-colors disabled:opacity-50"
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
