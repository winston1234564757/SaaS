'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { X, Phone, Calendar, TrendingUp, Star, Crown, Bell, PenLine, Check, Loader2 } from 'lucide-react';
import { sendChurnReminder, saveClientNote, toggleClientVip } from '@/app/(master)/dashboard/clients/actions';
import type { ClientRow } from './ClientsPage';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { formatPrice } from '@/components/master/services/types';
import { formatDate } from '@/lib/utils/dates';
import { getAutoTags } from './ClientsPage';
import { useClientNote, useClientNoteInvalidate } from '@/lib/supabase/hooks/useClientNote';

interface ClientDetailSheetProps {
  client: ClientRow | null;
  onClose: () => void;
  onVipChange: (id: string, isVip: boolean) => void;
}

interface RecentBooking {
  id: string;
  date: string;
  start_time: string;
  status: string;
  total_price: number;
  service_name: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Очікує',       color: '#D4935A' },
  confirmed: { label: 'Підтверджено', color: '#789A99' },
  completed: { label: 'Завершено',    color: '#5C9E7A' },
  cancelled: { label: 'Скасовано',    color: '#C05B5B' },
  no_show:   { label: 'Не прийшов',   color: '#A8928D' },
};

export function ClientDetailSheet({ client, onClose, onVipChange }: ClientDetailSheetProps) {
  const { masterProfile } = useMasterContext();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [bookings, setBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [reminderResult, setReminderResult] = useState<string | null>(null);

  // Notes
  const { data: savedNote = '' } = useClientNote(client?.client_phone);
  const invalidateNote = useClientNoteInvalidate();
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync note from server when client changes or note loads
  useEffect(() => {
    setNoteText(savedNote);
  }, [savedNote, client?.id]);

  useEffect(() => {
    setReminderResult(null);
    setNoteSaved(false);
  }, [client?.id]);

  useEffect(() => {
    if (!client || !masterProfile?.id) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from('bookings')
        .select('id, date, start_time, status, total_price, booking_services(service_name)')
        .eq('master_id', masterProfile.id)
        .eq('client_phone', client.client_phone)
        .order('date', { ascending: false })
        .limit(8)
        .then((res: { data: any[] | null }) => {
          const data = res.data;
          setBookings(
            (data ?? []).map((b: any) => ({
              id: b.id,
              date: b.date,
              start_time: b.start_time?.slice(0, 5) ?? '',
              status: b.status,
              total_price: Number(b.total_price),
              service_name: b.booking_services?.[0]?.service_name ?? 'Послуга',
            }))
          );
          setLoading(false);
        });
  }, [client?.id, masterProfile?.id]);

  function handleNoteChange(val: string) {
    setNoteText(val);
    setNoteSaved(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSaveNote(val), 1500);
  }

  async function handleSaveNote(text = noteText) {
    if (!client?.client_phone) return;
    setNoteSaving(true);
    const { error } = await saveClientNote(client.client_phone, text);
    if (!error) {
      setNoteSaved(true);
      invalidateNote(client.client_phone);
      setTimeout(() => setNoteSaved(false), 2000);
    }
    setNoteSaving(false);
  }

  async function handleToggleVip() {
    if (!client || !masterProfile?.id || isPending || !client.client_id) return;
    
    startTransition(async () => {
      const newVip = !client.is_vip;
      const { error } = await toggleClientVip(client.client_id!, newVip);
      
      if (!error) {
        onVipChange(client.id, newVip);
        // Invalidate both the list and potential detail queries
        await queryClient.invalidateQueries({ queryKey: ['clients'] });
        await queryClient.invalidateQueries({ queryKey: ['client', client.client_id] });
      }
    });
  }

  return (
    <AnimatePresence>
      {client && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
          >
            <div
              className="rounded-t-[28px] border border-white/60 overflow-hidden"
              style={{
                background: 'rgba(255,248,244,0.96)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 -8px 40px rgba(44,26,20,0.14)',
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-[#D4C5BE]" />
              </div>

              {/* Header */}
              <div className="flex items-center gap-3 px-5 pt-2 pb-4">
                <div
                  className="w-14 h-14 rounded-3xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: client.is_vip ? 'rgba(212,147,90,0.18)' : 'rgba(255,210,194,0.4)' }}
                >
                  {client.is_vip ? '⭐' : client.client_name[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-[#2C1A14] truncate">{client.client_name}</p>
                    {client.is_vip && (
                      <span className="text-[10px] font-bold text-[#D4935A] bg-[#D4935A]/12 px-1.5 py-0.5 rounded-full flex-shrink-0">VIP</span>
                    )}
                  </div>
                  <a href={`tel:${client.client_phone}`} className="flex items-center gap-1 text-xs text-[#789A99] hover:text-[#5C7E7D] transition-colors mt-0.5">
                    <Phone size={11} />
                    {client.client_phone}
                  </a>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white/70 border border-white/80 text-[#A8928D] hover:text-[#6B5750] transition-colors flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-5 pb-8 overflow-y-auto max-h-[60vh] flex flex-col gap-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Calendar,   label: 'Візитів',      value: client.total_visits,           color: '#789A99' },
                    { icon: TrendingUp, label: 'Витрачено',    value: formatPrice(client.total_spent), color: '#5C9E7A' },
                    { icon: Star,       label: 'Сер. чек',     value: formatPrice(client.average_check), color: '#D4935A' },
                  ].map(s => (
                    <div key={s.label} className="bento-card p-3 text-center">
                      <s.icon size={14} className="mx-auto mb-1" style={{ color: s.color }} />
                      <p className="text-sm font-bold text-[#2C1A14] leading-tight">{s.value}</p>
                      <p className="text-[10px] text-[#A8928D]">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Last visit */}
                {client.last_visit_at && (
                  <p className="text-xs text-[#A8928D] text-center">
                    Остання візита:{' '}
                    <span className="text-[#6B5750] font-medium">
                      {new Date(client.last_visit_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </p>
                )}

                {/* Auto tags */}
                {(() => {
                  const tags = getAutoTags(client);
                  return tags.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-2">Теги</p>
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                          <span
                            key={tag.label}
                            className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{ color: tag.color, background: tag.bg }}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Churn reminder */}
                {client && (client.retention_status === 'at_risk' || client.retention_status === 'lost') && (
                  <div className="space-y-2">
                    <button
                      onClick={async () => {
                        setReminding(true);
                        setReminderResult(null);
                        const res = await sendChurnReminder(client.client_id, client.client_phone, client.client_name);
                        setReminderResult(res.error ?? '✅ Нагадування надіслано!');
                        setReminding(false);
                      }}
                      disabled={reminding}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold bg-[#C05B5B]/10 text-[#C05B5B] hover:bg-[#C05B5B]/20 transition-all disabled:opacity-60"
                    >
                      <Bell size={15} />
                      {reminding ? 'Надсилаємо...' : 'Нагадати про запис'}
                    </button>
                    {reminderResult && (
                      <p className={`text-xs text-center px-2 ${reminderResult.startsWith('✅') ? 'text-green-600' : 'text-[#A8928D]'}`}>
                        {reminderResult}
                      </p>
                    )}
                  </div>
                )}

                {/* VIP toggle */}
                {client.relation_id ? (
                  <button
                    onClick={handleToggleVip}
                    disabled={isPending}
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold transition-all ${
                      client.is_vip
                        ? 'bg-[#D4935A]/12 text-[#D4935A] hover:bg-[#D4935A]/20'
                        : 'bg-white/70 border border-white/80 text-[#6B5750] hover:bg-white'
                    } disabled:opacity-60`}
                  >
                    <Crown size={15} />
                    {client.is_vip ? 'Прибрати VIP статус' : 'Позначити як VIP'}
                  </button>
                ) : (
                  <p className="text-[11px] text-[#A8928D] text-center">
                    VIP доступний для клієнтів з акаунтом Bookit
                  </p>
                )}

                {/* Private notes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <PenLine size={13} className="text-[#789A99]" />
                      <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide">Приватні нотатки</p>
                    </div>
                    <button
                      onClick={() => handleSaveNote()}
                      disabled={noteSaving || noteText === savedNote}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                        noteSaved
                          ? 'bg-[#5C9E7A]/12 text-[#5C9E7A]'
                          : 'bg-[#789A99]/10 text-[#789A99] hover:bg-[#789A99]/20 disabled:opacity-40 disabled:cursor-not-allowed'
                      }`}
                    >
                      {noteSaving ? <Loader2 size={11} className="animate-spin" /> : noteSaved ? <Check size={11} /> : null}
                      {noteSaved ? 'Збережено' : 'Зберегти'}
                    </button>
                  </div>
                  <textarea
                    value={noteText}
                    onChange={e => handleNoteChange(e.target.value)}
                    placeholder="Формула фарбування, алергії, особливі побажання, звички клієнта..."
                    rows={3}
                    className="w-full text-sm text-[#2C1A14] placeholder-[#C8B0AA] bg-white/60 border border-[#F0DDD8] rounded-2xl px-3.5 py-3 outline-none focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 resize-none transition-all leading-relaxed"
                  />
                  <p className="text-[10px] text-[#A8928D] mt-1.5">Видимо тільки вам. Автозбереження через 1.5 сек.</p>
                </div>

                {/* Recent bookings */}
                <div>
                  <p className="text-xs font-semibold text-[#6B5750] uppercase tracking-wide mb-3">Останні записи</p>
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 rounded-full border-2 border-[#789A99] border-t-transparent animate-spin" />
                    </div>
                  ) : bookings.length === 0 ? (
                    <p className="text-xs text-[#A8928D] text-center py-4">Записів не знайдено</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {bookings.map(b => {
                        const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
                        const d = new Date(b.date);
                        return (
                          <div key={b.id} className="flex items-center gap-3 py-2 px-3 rounded-2xl bg-white/50">
                            <div className="flex-shrink-0 w-10 text-center">
                              <p className="text-xs font-bold text-[#2C1A14]">{b.start_time}</p>
                              <p className="text-[10px] text-[#A8928D] break-words leading-tight">{formatDate(b.date)}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-[#2C1A14] break-words leading-tight">{b.service_name}</p>
                              <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                            </div>
                            <p className="text-xs font-bold text-[#2C1A14] flex-shrink-0">{formatPrice(b.total_price)}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
