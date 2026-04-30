'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { X, Phone, Calendar, TrendingUp, Star, Crown, Bell, PenLine, Check, Loader2 } from 'lucide-react';
import { sendChurnReminder, saveClientNote, toggleClientVip, archiveClient } from '@/app/(master)/dashboard/clients/actions';
import type { ClientRow } from './ClientsPage';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { formatPrice } from '@/components/master/services/types';
import { formatDate } from '@/lib/utils/dates';
import { getAutoTags } from './ClientsPage';
import { useClientNote, useClientNoteInvalidate } from '@/lib/supabase/hooks/useClientNote';
import type { BookingStatus } from '@/types/database';
import { BOOKING_STATUS_CONFIG } from '@/lib/constants/bookingStatus';

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

import { useToast } from '@/lib/toast/context';
import { parseError } from '@/lib/utils/errors';

import { BottomSheet } from '@/components/ui/BottomSheet';

export function ClientDetailSheet({ client, onClose, onVipChange }: ClientDetailSheetProps) {
  const { masterProfile } = useMasterContext();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [bookings, setBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [reminding, setReminding] = useState(false);
  const { data: serverNote } = useClientNote(client?.client_phone);
  const invalidateNote = useClientNoteInvalidate();
  const [noteValue, setNoteValue] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (serverNote !== undefined) {
      setNoteValue(serverNote);
    }
  }, [serverNote]);

  useEffect(() => {
    if (!client?.client_phone) return;
    async function fetchBookings() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('bookings')
        .select(`
          id, 
          slot_date:date, 
          slot_time:start_time, 
          status, 
          total_price, 
          booking_services (
            service_name
          )
        `)
        .eq('client_phone', client!.client_phone)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(5);

      if (data) {
        setBookings((data as any[]).map(b => ({
          id: b.id,
          date: b.slot_date,
          start_time: b.slot_time,
          status: b.status,
          total_price: b.total_price,
          service_name: b.booking_services?.[0]?.service_name || 'Послуга'
        })));
      }
      setLoading(false);
    }
    fetchBookings();
  }, [client?.client_phone]);

  const handleToggleVip = () => {
    const c = client;
    if (!c?.relation_id) return;
    startTransition(async () => {
      const newVip = !c.is_vip;
      const { error } = await toggleClientVip(c.relation_id!, newVip);
      if (error) {
        showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
      } else {
        onVipChange(c.id, newVip);
        showToast({ 
          type: 'success', 
          title: newVip ? 'VIP статус надано' : 'VIP статус знято',
          message: newVip ? 'Клієнт тепер має особливі привілеї' : 'VIP статус успішно знято'
        });
      }
    });
  };

  const handleSaveNote = async (val: string) => {
    if (!client?.client_phone) return;
    setIsSavingNote(true);
    const { error } = await saveClientNote(client.client_phone, val);
    if (error) {
      showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
    } else {
      invalidateNote(client.client_phone);
    }
    setIsSavingNote(false);
  };

  const onNoteChange = (val: string) => {
    setNoteValue(val);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      handleSaveNote(val);
    }, 1000);
  };

  return (
    <BottomSheet 
      isOpen={!!client} 
      onClose={onClose}
      title={client?.client_name ?? 'Інформація про клієнта'}
    >
      <div className="flex flex-col gap-5">
        {/* Header/Identity Card */}
        <div className="flex items-center gap-4 bg-white/40 p-4 rounded-3xl border border-white/60">
          <div
            className="w-16 h-16 rounded-[24px] flex items-center justify-center text-3xl flex-shrink-0 shadow-inner"
            style={{ background: client?.is_vip ? 'rgba(212,147,90,0.18)' : 'rgba(255,210,194,0.4)' }}
          >
            {client?.is_vip ? '⭐' : client?.client_name[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-foreground truncate">{client?.client_name}</p>
              {client?.is_vip && (
                <span className="text-[10px] font-bold text-warning bg-warning/12 px-2 py-0.5 rounded-full flex-shrink-0">VIP</span>
              )}
            </div>
            <a href={`tel:${client?.client_phone}`} className="flex items-center gap-1.5 text-sm text-primary font-medium mt-1">
              <Phone size={13} />
              {client?.client_phone}
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Calendar,   label: 'Візитів',      value: client?.total_visits,           color: '#789A99' },
            { icon: TrendingUp, label: 'Витрачено',    value: formatPrice(client?.total_spent ?? 0), color: '#5C9E7A' },
            { icon: Star,       label: 'Сер. чек',     value: formatPrice(client?.average_check ?? 0), color: '#D4935A' },
          ].map(s => (
            <div key={s.label} className="bento-card p-3.5 text-center bg-white/40">
              <s.icon size={16} className="mx-auto mb-1.5 opacity-60" style={{ color: s.color }} />
              <p className="text-base font-bold text-foreground leading-tight">{s.value}</p>
              <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {client && (client.retention_status === 'at_risk' || client.retention_status === 'lost') && (
            <button
              onClick={async () => {
                setReminding(true);
                const res = await sendChurnReminder(client.client_id, client.client_phone, client.client_name);
                if (res.error) {
                  showToast({ type: 'error', title: 'Помилка', message: parseError(res.error) });
                } else {
                  showToast({ type: 'success', title: 'Нагадування надіслано' });
                }
                setReminding(false);
              }}
              disabled={reminding}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-sm font-bold bg-destructive/10 text-destructive hover:bg-destructive/15 active:scale-95 transition-all disabled:opacity-60"
            >
              <Bell size={16} />
              {reminding ? 'Надсилаємо...' : 'Нагадати про запис'}
            </button>
          )}

          {client?.relation_id ? (
            <button
              onClick={handleToggleVip}
              disabled={isPending}
              className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-sm font-bold transition-all ${
                client.is_vip
                  ? 'bg-warning/12 text-warning hover:bg-warning/20'
                  : 'bg-white/60 border border-white/80 text-muted-foreground hover:bg-white'
              } disabled:opacity-60 active:scale-95 transition-all shadow-sm`}
            >
              <Crown size={16} />
              {client.is_vip ? 'Прибрати VIP статус' : 'Позначити як VIP'}
            </button>
          ) : (
            <p className="text-[11px] text-muted-foreground/60 text-center bg-white/20 py-2 rounded-xl border border-white/40">
              VIP доступний для клієнтів з акаунтом Bookit
            </p>
          )}

          <button
            onClick={async () => {
              if (!client?.client_id || !confirm('Архівувати клієнта? Він зникне зі списку активних, але історія записів залишиться.')) return;
              setLoading(true);
              const { error } = await archiveClient(client.client_id);
              if (error) {
                showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
              } else {
                showToast({ type: 'success', title: 'Клієнта архівовано' });
                onClose();
                await queryClient.invalidateQueries({ queryKey: ['clients'] });
              }
              setLoading(false);
            }}
            disabled={loading || !client?.client_id}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-sm font-bold bg-secondary/40 text-muted-foreground hover:bg-secondary/60 active:scale-95 transition-all disabled:opacity-40"
          >
            Архівувати клієнта
          </button>
        </div>

        {/* Private notes */}
        <div className="bg-white/40 p-5 rounded-3xl border border-white/60 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PenLine size={14} className="text-muted-foreground/60" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Приватні нотатки</p>
            </div>
            {isSavingNote && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sage/10 text-sage">
                <Loader2 size={10} className="animate-spin" />
                <span className="text-[9px] font-bold uppercase tracking-tight">Зберігаємо...</span>
              </div>
            )}
          </div>
          <textarea
            value={noteValue}
            onChange={e => onNoteChange(e.target.value)}
            placeholder="Формула фарбування, алергії, особливі побажання..."
            rows={3}
            className="w-full text-sm text-foreground placeholder-text-mute/40 bg-white/60 border border-white/80 rounded-2xl px-4 py-3.5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 resize-none transition-all leading-relaxed shadow-inner"
          />
          <p className="text-[10px] text-muted-foreground/50 mt-2 font-medium italic">Видимо тільки вам. Автозбереження увімкнено.</p>
        </div>

        {/* Recent bookings */}
        <div className="bg-white/40 p-5 rounded-3xl border border-white/60">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Останні записи</p>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={24} className="text-primary animate-spin opacity-40" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-6 bg-white/20 rounded-2xl border border-dashed border-white/60">
              <p className="text-xs text-muted-foreground/60">Записів не знайдено</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {bookings.map(b => {
                const cfg = BOOKING_STATUS_CONFIG[b.status as BookingStatus] ?? BOOKING_STATUS_CONFIG.pending;
                return (
                  <div key={b.id} className="flex items-center gap-4 py-3 px-4 rounded-2xl bg-white/60 border border-white/40 shadow-sm">
                    <div className="flex-shrink-0 w-12 text-center">
                      <p className="text-xs font-black text-foreground">{b.start_time}</p>
                      <p className="text-[9px] text-muted-foreground/60 font-bold uppercase mt-0.5">{formatDate(b.date)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{b.service_name}</p>
                      <span
                        className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter mt-1 inline-block"
                        style={{ color: cfg.color, background: cfg.bg }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs font-black text-foreground flex-shrink-0">{formatPrice(b.total_price)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
