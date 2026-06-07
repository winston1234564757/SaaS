'use client';

import { useState, useRef, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { Phone, Calendar, TrendingUp, Star, Crown, Bell, PenLine, Check, Loader2, Heart, Sparkles, AlertTriangle, X } from 'lucide-react';
import { sendChurnReminder, saveClientNote, toggleClientVip, archiveClient, saveClientHealthInfo } from '@/app/(master)/dashboard/clients/actions';
import { PricingBadge } from '@/components/shared/PricingBadge';
import type { ClientRow } from './ClientsPage';
import { RETENTION_CONFIG } from './ClientsPage';
import { useMasterContext } from '@/lib/supabase/context';
import { formatPrice } from '@/components/master/services/types';
import { formatDate } from '@/lib/utils/dates';
import { getAutoTags } from './ClientsPage';
import { useClientNote, useClientNoteInvalidate } from '@/lib/supabase/hooks/useClientNote';
import { useClientBookings } from '@/lib/supabase/hooks/useClientBookings';
import { useAmbassadorStatus } from '@/lib/supabase/hooks/useAmbassadorStatus';
import type { BookingStatus } from '@/types/database';
import { BOOKING_STATUS_CONFIG } from '@/lib/constants/bookingStatus';
import { cn } from '@/lib/utils/cn';
import { useToast } from '@/lib/toast/context';
import { parseError } from '@/lib/utils/errors';
import { Sheet } from '@/components/ui/Sheet';

interface ClientDetailSheetProps {
  client: ClientRow | null;
  onClose: () => void;
}

export function ClientDetailSheet({ client, onClose }: ClientDetailSheetProps) {
  const { masterProfile } = useMasterContext();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [archiving, setArchiving] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [archiveConfirmStep, setArchiveConfirmStep] = useState(false);

  const { data: bookings = [], isLoading: isLoadingBookings } = useClientBookings(client?.client_phone);
  const { data: isAmbassador = false } = useAmbassadorStatus(client?.client_phone, masterProfile?.id);

  const { data: serverNote } = useClientNote(client?.client_phone);
  const invalidateNote = useClientNoteInvalidate();
  const [noteValue, setNoteValue] = useState('');
  const [activeVibes, setActiveVibes] = useState<string[]>([]);
  const [isSavingNote, setIsSavingNote] = useState(false);

  const [medicalNotes, setMedicalNotes] = useState('');
  const [healthNotes, setHealthNotes] = useState('');
  const [isSavingHealth, setIsSavingHealth] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const healthSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // sync serverNote -> noteValue (update during render, avoids useEffect)
  const [prevServerNote, setPrevServerNote] = useState(serverNote);
  if (prevServerNote !== serverNote) {
    setPrevServerNote(serverNote);
    if (serverNote !== undefined) setNoteValue(serverNote);
  }

  // sync client prop -> medical/health local state (update during render, avoids useEffect)
  const [prevClient, setPrevClient] = useState(client);
  if (prevClient !== client) {
    setPrevClient(client);
    setArchiveConfirmStep(false);
    if (client) {
      setMedicalNotes(client.medical_notes ?? '');
      setHealthNotes(client.health_notes ?? '');
    }
  }

  const handleToggleVip = () => {
    const c = client;
    if (!c?.relation_id) return;
    startTransition(async () => {
      const newVip = !c.is_vip;
      const { error } = await toggleClientVip(c.relation_id!, newVip);
      if (error) {
        showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
      } else {
        await queryClient.invalidateQueries({ queryKey: ['clients'] });
        showToast({
          type: 'success',
          title: newVip ? 'VIP статус надано' : 'VIP статус знято',
          message: newVip ? 'Клієнт тепер має особливi привiлеї' : 'VIP статус успiшно знято'
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

  const handleSaveHealth = async (med: string, hlth: string) => {
    if (!client?.client_id) return;
    setIsSavingHealth(true);
    const { error } = await saveClientHealthInfo(client.client_id, med, hlth);
    if (error) {
      showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
    } else {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
    setIsSavingHealth(false);
  };

  const onHealthChange = (med: string, hlth: string) => {
    setMedicalNotes(med);
    setHealthNotes(hlth);
    if (healthSaveTimeoutRef.current) clearTimeout(healthSaveTimeoutRef.current);
    healthSaveTimeoutRef.current = setTimeout(() => {
      handleSaveHealth(med, hlth);
    }, 1000);
  };

  return (
    <Sheet
      open={!!client}
      onOpenChange={(v) => !v && onClose()}
      title={client?.client_name ?? 'Iнформацiя про клiєнта'}
    >
      <div className="flex flex-col gap-5">
        {/* Header/Identity Card */}
        <div className="flex items-center gap-4 bg-secondary/60 p-4 rounded-xl border border-border relative overflow-hidden shadow-sm backdrop-blur-md">
          {isAmbassador && (
            <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-bl-xl shadow-sm z-10">
              Ambassador
            </div>
          )}
          <div className="relative">
            <div
              className="size-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 shadow-inner relative z-10"
              style={{
                background: client?.is_vip ? 'rgba(212,147,90,0.18)' : 'rgba(255,210,194,0.4)',
                boxShadow: '0 0 0 2px var(--background)'
              }}
            >
              {client?.client_name[0]?.toUpperCase() ?? '?'}
            </div>
            <div
              className="absolute -inset-1 rounded-2xl opacity-40 z-0"
              style={{ border: `3px solid ${RETENTION_CONFIG[client?.retention_status ?? 'active'].color}` }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-foreground truncate">{client?.client_name}</p>
              {client?.is_vip && (
                <span className="text-[10px] font-bold text-warning bg-warning/12 px-2 py-0.5 rounded-full flex-shrink-0">VIP</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <a href={`tel:${client?.client_phone}`} className="flex items-center gap-1.5 text-sm text-primary font-medium">
                <Phone size={13} />
                {client?.client_phone}
              </a>
              {isAmbassador && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-sage bg-sage/10 px-2 py-0.5 rounded-lg border border-sage/20 leading-tight">
                  <Heart size={12} className="fill-current" />
                  VIP Ambassador: Запросив вас у Bookit
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Calendar,   label: 'Вiзитiв',   value: client?.total_visits,                  color: '#789A99' },
            { icon: TrendingUp, label: 'Витрачено',  value: formatPrice(client?.total_spent ?? 0), color: '#5C9E7A' },
            { icon: Star,       label: 'Сер. чек',   value: formatPrice(client?.average_check ?? 0), color: '#D4935A' },
          ].map(s => (
            <div key={s.label} className="p-3.5 text-center bg-secondary/60 rounded-xl border border-border backdrop-blur-sm shadow-sm">
              <s.icon size={16} className="mx-auto mb-1.5 opacity-60" style={{ color: s.color }} />
              <p className="text-base font-bold text-foreground leading-tight">{s.value}</p>
              <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Safety & Health */}
        <div className="bg-secondary/60 p-5 rounded-xl border border-border relative overflow-hidden group backdrop-blur-sm shadow-sm">
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundColor: medicalNotes ? '#C05B5B' : 'transparent' }}
          />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-xl flex items-center justify-center",
                medicalNotes ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
              )}>
                <AlertTriangle size={16} />
              </div>
              <div>
                <p className={cn(
                  "text-xs font-bold uppercase tracking-widest",
                  medicalNotes ? "text-destructive" : "text-muted-foreground"
                )}>Safety & Health</p>
                <p className="text-[10px] text-muted-foreground/40 font-medium">Доступно клiєнту та майстру</p>
              </div>
            </div>
            {isSavingHealth && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/5 text-destructive">
                <Loader2 size={10} className="animate-spin" />
                <span className="text-[9px] font-bold uppercase tracking-tight">Зберiгаємо...</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight mb-1.5 block px-1">
                Критичнi застереження (Алергiї)
              </label>
              <textarea
                value={medicalNotes}
                onChange={e => onHealthChange(e.target.value, healthNotes)}
                placeholder="Алергiя на фарбу, чутлива шкiра, дiабет..."
                rows={1}
                className={cn(
                  "w-full text-sm font-medium bg-secondary/60 border rounded-xl px-4 py-3 outline-none transition-all resize-none shadow-inner",
                  medicalNotes
                    ? "border-destructive/30 text-destructive placeholder:text-destructive/30 focus:border-destructive focus:ring-4 focus:ring-destructive/5"
                    : "border-border/80 text-foreground placeholder:text-muted-foreground/30 focus:border-primary focus:ring-4 focus:ring-primary/5"
                )}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight mb-1.5 block px-1">
                Загальний стан здоров'я
              </label>
              <textarea
                value={healthNotes}
                onChange={e => onHealthChange(medicalNotes, e.target.value)}
                placeholder="Вподобання щодо тиску, особливостi постави..."
                rows={1}
                className="w-full text-sm text-foreground placeholder-text-mute/40 bg-secondary/60 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 resize-none transition-all shadow-inner"
              />
            </div>
          </div>

          <p className="text-[9px] text-muted-foreground/50 mt-3 font-medium italic">
            Ця iнформацiя допомагає зробити процедуру безпечною. Вона синхронiзована з профiлем клiєнта.
          </p>
        </div>

        {/* LTV & Insights */}
        <div className="bg-gradient-to-br from-sage/10 to-primary/5 p-5 rounded-3xl border border-border/60 relative overflow-hidden backdrop-blur-md shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
            <TrendingUp size={60} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-sage" />
              <p className="text-[10px] font-bold text-sage uppercase tracking-widest">Прогноз доходу (12 мiс)</p>
            </div>
            <p className="text-xl font-display font-bold text-sage">~{formatPrice((client?.average_check ?? 0) * 10)}</p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-sage/10 overflow-hidden">
              <div className="h-full bg-sage/60 w-[70%]" />
            </div>
            <p className="text-[9px] font-bold text-sage/60">Високий потенцiал</p>
          </div>
        </div>

        {/* Vibe Tags */}
        <div className="bg-secondary/60 p-5 rounded-xl border border-border backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart size={14} className="text-primary/60" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Vibe-мiтки</p>
            </div>
            <span className="text-[10px] text-muted-foreground/40 font-medium italic">Лише для вас</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'Тихий клiєнт', 'Любить каву', 'Часто запiзнюється', 'Складне волосся',
              'Завжди з доглядом', 'Рекомендує друзям', 'Дуже балакучий'
            ].map((tag) => {
              const isActive = activeVibes.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (isActive) setActiveVibes(activeVibes.filter(v => v !== tag));
                    else setActiveVibes([...activeVibes, tag]);
                  }}
                  aria-pressed={isActive}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold active:scale-[0.88] transition-all border ${
                    isActive ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-secondary/60 border-border text-muted-foreground/60'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
            <button type="button" className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-dashed border-muted-foreground/30 text-muted-foreground/40 hover:border-primary/40 hover:text-primary active:scale-[0.88] transition-all">
              + Додати мiтку
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {client && (client.retention_status === 'at_risk' || client.retention_status === 'lost') && (
            <button
              type="button"
              onClick={async () => {
                setReminding(true);
                const res = await sendChurnReminder(client.client_id, client.client_phone, client.client_name);
                if (res.error) {
                  showToast({ type: 'error', title: 'Помилка', message: parseError(res.error) });
                } else {
                  showToast({ type: 'success', title: 'Нагадування надiслано' });
                }
                setReminding(false);
              }}
              disabled={reminding}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-lg text-sm font-bold bg-destructive/10 text-destructive hover:bg-destructive/15 active:scale-[0.95] transition-all disabled:opacity-60"
            >
              <Bell size={16} />
              {reminding ? 'Надсилаємо...' : 'Нагадати про запис'}
            </button>
          )}

          {client?.relation_id ? (
            <button
              type="button"
              onClick={handleToggleVip}
              disabled={isPending}
              className={`flex items-center justify-center gap-2 w-full py-4 rounded-lg text-sm font-bold transition-all ${
                client.is_vip
                  ? 'bg-warning/12 text-warning hover:bg-warning/20'
                  : 'bg-secondary/60 border border-border text-muted-foreground hover:bg-secondary'
              } disabled:opacity-60 active:scale-[0.95] shadow-sm`}
            >
              <Crown size={16} />
              {client.is_vip ? 'Прибрати VIP статус' : 'Позначити як VIP'}
            </button>
          ) : (
            <p className="text-[11px] text-muted-foreground/60 text-center bg-secondary/20 py-2 rounded-xl border border-border/40">
              VIP доступний для клiєнтiв з акаунтом Bookit
            </p>
          )}

          {archiveConfirmStep ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!client?.client_id) return;
                  setArchiving(true);
                  const { error } = await archiveClient(client.client_id);
                  if (error) {
                    showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
                  } else {
                    showToast({ type: 'success', title: 'Клієнта архівовано' });
                    onClose();
                    await queryClient.invalidateQueries({ queryKey: ['clients'] });
                  }
                  setArchiving(false);
                  setArchiveConfirmStep(false);
                }}
                disabled={archiving}
                className="flex-1 py-4 rounded-lg text-sm font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-[0.95] transition-all disabled:opacity-40"
              >
                {archiving ? 'Архівуємо...' : 'Підтвердити'}
              </button>
              <button
                type="button"
                onClick={() => setArchiveConfirmStep(false)}
                className="px-6 py-4 rounded-lg text-sm font-bold bg-secondary/40 text-muted-foreground hover:bg-secondary/60 active:scale-[0.95] transition-all"
              >
                Скасувати
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setArchiveConfirmStep(true)}
              disabled={!client?.client_id}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-lg text-sm font-bold bg-secondary/40 text-muted-foreground hover:bg-secondary/60 active:scale-[0.95] transition-all disabled:opacity-40"
            >
              Архівувати клієнта
            </button>
          )}
        </div>

        {/* Private notes */}
        <div className="bg-secondary/60 p-5 rounded-xl border border-border relative overflow-hidden group backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PenLine size={14} className="text-muted-foreground/60" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Приватнi нотатки</p>
            </div>
            {isSavingNote && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sage/10 text-sage">
                <Loader2 size={10} className="animate-spin" />
                <span className="text-[9px] font-bold uppercase tracking-tight">Зберiгаємо...</span>
              </div>
            )}
          </div>
          <textarea
            value={noteValue}
            onChange={e => onNoteChange(e.target.value)}
            placeholder="Формула фарбування, алергiї, особливi побажання..."
            rows={3}
            className="w-full text-sm text-foreground placeholder-text-mute/40 bg-card border border-border rounded-xl px-4 py-3.5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 resize-none transition-all leading-relaxed shadow-inner"
          />
          <p className="text-[10px] text-muted-foreground/50 mt-2 font-medium italic">Видимо тiльки вам. Автозбереження увiмкнено.</p>
        </div>

        {/* Recent bookings */}
        <div className="bg-secondary/60 p-5 rounded-xl border border-border backdrop-blur-sm shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Останнi записи</p>
          {isLoadingBookings ? (
            <div className="flex justify-center py-6">
              <Loader2 size={24} className="text-primary animate-spin opacity-40" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-6 bg-secondary/20 rounded-xl border border-dashed border-border/40">
              <p className="text-xs text-muted-foreground/60">Записiв не знайдено</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {bookings.map(b => {
                const cfg = BOOKING_STATUS_CONFIG[b.status as BookingStatus] ?? BOOKING_STATUS_CONFIG.pending;
                return (
                  <div key={b.id} className="flex items-center gap-4 py-3 px-4 rounded-xl bg-secondary/70 border border-border shadow-sm">
                    <div className="flex-shrink-0 w-12 text-center">
                      <p className="text-xs font-bold text-foreground">{b.start_time}</p>
                      <p className="text-[9px] text-muted-foreground/60 font-bold uppercase mt-0.5">{formatDate(b.date)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{b.service_name}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter inline-block"
                          style={{ color: cfg.color, background: cfg.bg }}
                        >
                          {cfg.label}
                        </span>
                        {b.dynamic_pricing_label && (
                          <div className="shrink-0 max-w-full">
                            <PricingBadge dynamicLabel={b.dynamic_pricing_label} size="sm" />
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-foreground flex-shrink-0">{formatPrice(b.total_price)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}