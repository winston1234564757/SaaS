'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Clock, Phone, Globe, PenLine,
  CheckCircle2, XCircle, Star, Save, Loader2,
} from 'lucide-react';
import { useBookingById } from '@/lib/supabase/hooks/useBookingById';
import { formatPrice } from '@/components/master/services/types';
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

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${UA_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function BookingDetailsModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const { booking, isLoading, updateStatus, saveMasterNotes, isSavingNotes } = useBookingById(bookingId);

  const [notes, setNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);

  useEffect(() => {
    if (booking) {
      setNotes(booking.master_notes ?? '');
      setNotesDirty(false);
    }
  }, [booking?.id]);

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('bookingId');
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  }, [router, searchParams]);

  // Close on Escape
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

  const isOpen = !!bookingId;

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
              <div className="px-5 pb-8 flex flex-col gap-5">
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

                  {/* Source */}
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
                            <span className="text-xs text-[#A8928D]">{s.duration} хв</span>
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
                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-[#A8928D] uppercase tracking-wide mb-3">Дії</p>
                    <div className="flex flex-wrap gap-2">
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleStatus('confirmed')}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#789A99]/10 text-[#789A99] hover:bg-[#789A99]/20 text-sm font-medium transition-colors"
                        >
                          <CheckCircle2 size={14} /> Підтвердити
                        </button>
                      )}
                      <button
                        onClick={() => handleStatus('completed')}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5C9E7A]/10 text-[#5C9E7A] hover:bg-[#5C9E7A]/20 text-sm font-medium transition-colors"
                      >
                        <Star size={14} /> Завершити
                      </button>
                      <button
                        onClick={() => handleStatus('cancelled')}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C05B5B]/10 text-[#C05B5B] hover:bg-[#C05B5B]/20 text-sm font-medium transition-colors"
                      >
                        <XCircle size={14} /> Скасувати
                      </button>
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatus('no_show')}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A8928D]/10 text-[#A8928D] hover:bg-[#A8928D]/20 text-sm font-medium transition-colors"
                        >
                          Не прийшов
                        </button>
                      )}
                    </div>
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
