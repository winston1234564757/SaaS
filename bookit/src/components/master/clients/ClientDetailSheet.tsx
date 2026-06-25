'use client';

import { useState, useRef, useTransition, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import {
  Phone, Calendar, TrendingUp, Star, Crown, Bell, PenLine, Loader2,
  Heart, AlertTriangle, ShieldPlus, Tag, Plus, X, Clock, Repeat,
} from 'lucide-react';
import {
  sendChurnReminder, saveClientNote, toggleClientVip, archiveClient,
  saveClientHealthInfo, saveClientTags,
} from '@/app/(master)/dashboard/clients/actions';
import { PricingBadge } from '@/components/shared/PricingBadge';
import type { ClientRow } from './ClientsPage';
import { RETENTION_CONFIG } from './ClientsPage';
import { ClientIdentityHeader } from './ClientIdentityHeader';
import { ClientStatChips, type StatChip } from './ClientStatChips';
import { useMasterContext } from '@/lib/supabase/context';
import { formatPrice } from '@/components/master/services/types';
import { formatDate, timeAgo } from '@/lib/utils/dates';
import { pluralUk } from '@/lib/utils/pluralUk';
import { useClientNote, useClientNoteInvalidate } from '@/lib/supabase/hooks/useClientNote';
import { useClientBookings } from '@/lib/supabase/hooks/useClientBookings';
import { useClientTags, useClientTagsInvalidate } from '@/lib/supabase/hooks/useClientTags';
import { useClients } from '@/lib/supabase/hooks/useClients';
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

const TAG_PRESETS = [
  'Тихий клієнт', 'Любить каву', 'Часто запізнюється', 'Складне волосся',
  'Завжди з доглядом', 'Рекомендує друзям', 'Дуже балакучий',
];

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
  const { clients } = useClients();

  const { data: serverNote } = useClientNote(client?.client_phone);
  const invalidateNote = useClientNoteInvalidate();
  const [noteValue, setNoteValue] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const { data: savedTags } = useClientTags(client?.client_id);
  const invalidateTags = useClientTagsInvalidate();
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isSavingTags, setIsSavingTags] = useState(false);

  const [medicalNotes, setMedicalNotes] = useState('');
  const [healthNotes, setHealthNotes] = useState('');
  const [isSavingHealth, setIsSavingHealth] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const healthSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tagsSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // sync serverNote -> noteValue (update during render, avoids useEffect)
  const [prevServerNote, setPrevServerNote] = useState(serverNote);
  if (prevServerNote !== serverNote) {
    setPrevServerNote(serverNote);
    if (serverNote !== undefined) setNoteValue(serverNote);
  }

  // sync saved tags -> local (stable react-query ref; default undefined avoids fresh-array loop)
  const [prevSavedTags, setPrevSavedTags] = useState<string[] | undefined>(undefined);
  if (prevSavedTags !== savedTags) {
    setPrevSavedTags(savedTags);
    if (savedTags) setTags(savedTags);
  }

  // sync client prop -> local state (update during render, avoids useEffect)
  const [prevClient, setPrevClient] = useState(client);
  if (prevClient !== client) {
    setPrevClient(client);
    setArchiveConfirmStep(false);
    setCustomTag('');
    setTags([]);
    if (client) {
      setMedicalNotes(client.medical_notes ?? '');
      setHealthNotes(client.health_notes ?? '');
    }
  }

  const retention = RETENTION_CONFIG[client?.retention_status ?? 'active'];

  // Реальний LTV: ранг за сукупною виручкою серед усіх клієнтів майстра.
  const { maxSpent, rank, totalClients } = useMemo(() => {
    if (!client || !clients?.length) return { maxSpent: 0, rank: 0, totalClients: 0 };
    const sorted = [...clients].sort((a, b) => b.total_spent - a.total_spent);
    const idx = sorted.findIndex(c => c.client_phone === client.client_phone);
    return { maxSpent: sorted[0]?.total_spent ?? 0, rank: idx >= 0 ? idx + 1 : 0, totalClients: clients.length };
  }, [clients, client]);

  const spentPct = maxSpent > 0 ? Math.min(100, Math.max(4, ((client?.total_spent ?? 0) / maxSpent) * 100)) : 0;
  const showRank = totalClients > 1 && maxSpent > 0 && rank > 0;

  // Каденс відвідувань з останніх записів (реальні дати, без вигадки).
  const cadenceText = useMemo(() => {
    const ds = bookings
      .map(b => new Date(b.date + 'T00:00:00').getTime())
      .filter(n => !Number.isNaN(n))
      .sort((a, b) => b - a);
    if (ds.length < 2) return null;
    const avgDays = (ds[0] - ds[ds.length - 1]) / (ds.length - 1) / 86_400_000;
    if (avgDays <= 0) return null;
    if (avgDays <= 10) return 'Приходить приблизно раз на тиждень';
    if (avgDays <= 45) {
      const w = Math.round(avgDays / 7);
      return `Приходить приблизно раз на ${w} ${pluralUk(w, 'тиждень', 'тижні', 'тижнів')}`;
    }
    const m = Math.max(1, Math.round(avgDays / 30));
    return `Приходить приблизно раз на ${m} ${pluralUk(m, 'місяць', 'місяці', 'місяців')}`;
  }, [bookings]);

  const statChips: StatChip[] = useMemo(() => [
    { icon: Calendar, label: 'Візити', value: client?.total_visits ?? 0, color: '#0F766E' },
    { icon: TrendingUp, label: 'Витрачено', value: formatPrice(client?.total_spent ?? 0), color: '#15803D' },
    { icon: Star, label: 'Сер. чек', value: formatPrice(client?.average_check ?? 0), color: '#B45309' },
    { icon: Clock, label: 'Останній візит', value: client?.last_visit_at ? timeAgo(client.last_visit_at) : '—', color: '#C2410C' },
  ], [client]);

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
          title: newVip ? 'Статус VIP надано' : 'Статус VIP знято',
          message: newVip ? 'Клієнт тепер має особливі привілеї' : 'Статус VIP успішно знято',
        });
      }
    });
  };

  const handleSaveNote = async (val: string) => {
    if (!client?.client_phone) return;
    setIsSavingNote(true);
    const { error } = await saveClientNote(client.client_phone, val);
    if (error) showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
    else invalidateNote(client.client_phone);
    setIsSavingNote(false);
  };

  const onNoteChange = (val: string) => {
    setNoteValue(val);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => handleSaveNote(val), 1000);
  };

  const commitTags = (next: string[]) => {
    setTags(next);
    if (!client?.client_id) return;
    if (tagsSaveTimeoutRef.current) clearTimeout(tagsSaveTimeoutRef.current);
    tagsSaveTimeoutRef.current = setTimeout(async () => {
      setIsSavingTags(true);
      const { error } = await saveClientTags(client.client_id!, next);
      if (error) showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
      else invalidateTags(client.client_id!);
      setIsSavingTags(false);
    }, 800);
  };

  const toggleTag = (t: string) => commitTags(tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t]);

  const addCustomTag = () => {
    const v = customTag.trim();
    if (!v || tags.includes(v)) { setCustomTag(''); return; }
    commitTags([...tags, v]);
    setCustomTag('');
  };

  const handleSaveHealth = async (med: string, hlth: string) => {
    if (!client?.client_id) return;
    setIsSavingHealth(true);
    const { error } = await saveClientHealthInfo(client.client_id, med, hlth);
    if (error) showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
    else queryClient.invalidateQueries({ queryKey: ['clients'] });
    setIsSavingHealth(false);
  };

  const onHealthChange = (med: string, hlth: string) => {
    setMedicalNotes(med);
    setHealthNotes(hlth);
    if (healthSaveTimeoutRef.current) clearTimeout(healthSaveTimeoutRef.current);
    healthSaveTimeoutRef.current = setTimeout(() => handleSaveHealth(med, hlth), 1000);
  };

  const tagChips = Array.from(new Set([...TAG_PRESETS, ...tags]));
  const canManage = !!client?.client_id;
  const isAtRisk = client?.retention_status === 'at_risk' || client?.retention_status === 'lost';

  return (
    <Sheet
      open={!!client}
      onOpenChange={(v) => !v && onClose()}
      title={client?.client_name ?? 'Інформація про клієнта'}
    >
      <div className="flex flex-col gap-5">
        {/* Identity */}
        <ClientIdentityHeader
          name={client?.client_name ?? ''}
          phone={client?.client_phone ?? ''}
          isVip={client?.is_vip}
          glowColor={retention.color}
          statusPill={
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ color: retention.color, background: retention.bg }}
            >
              {retention.label}
            </span>
          }
          badge={isAmbassador ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sage bg-sage/10 px-2 py-0.5 rounded-lg border border-sage/20 leading-tight">
              <Heart size={12} className="fill-current" />
              Амбасадор: запросив вас у Bookit
            </span>
          ) : undefined}
        />

        {/* Stats */}
        <ClientStatChips chips={statChips} />

        {/* Value / LTV (realized) */}
        <div className="bento-card p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp size={14} className="text-sage" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.16em]">Цінність клієнта</p>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{formatPrice(client?.total_spent ?? 0)}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1.5">Сукупно за весь час співпраці</p>
            </div>
            {showRank && (
              <span className="text-xs font-bold text-sage bg-sage/10 px-2.5 py-1 rounded-full shrink-0">
                {rank} з {totalClients}
              </span>
            )}
          </div>
          {showRank && (
            <div className="mt-3">
              <div className="h-1.5 rounded-full bg-sage/10 overflow-hidden">
                <div className="h-full rounded-full bg-sage/60" style={{ width: `${spentPct}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-1.5">Місце за сукупною виручкою</p>
            </div>
          )}
          {cadenceText && (
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-dashed border-border/60">
              <Repeat size={13} className="text-muted-foreground/60" />
              <p className="text-xs font-medium text-foreground/80">{cadenceText}</p>
            </div>
          )}
        </div>

        {/* Recent bookings */}
        <div className="bento-card p-5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.16em] mb-4">Останні записи</p>
          {isLoadingBookings ? (
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-[58px] rounded-xl bg-secondary/40 animate-pulse" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-6 bg-secondary/20 rounded-xl border border-dashed border-border/40">
              <p className="text-xs text-muted-foreground/60">Записів ще немає</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {bookings.map(b => {
                const cfg = BOOKING_STATUS_CONFIG[b.status as BookingStatus] ?? BOOKING_STATUS_CONFIG.pending;
                return (
                  <div key={b.id} className="flex items-center gap-4 py-3 px-4 rounded-xl bg-secondary/50 border border-border">
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

        {/* Vibe tags (persisted) */}
        <div className="bento-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-muted-foreground/60" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.16em]">Особисті мітки</p>
            </div>
            {isSavingTags ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sage/10 text-sage">
                <Loader2 size={10} className="animate-spin" />
                <span className="text-[9px] font-bold uppercase tracking-tight">Зберігаємо</span>
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground/40 font-medium italic">Лише для вас</span>
            )}
          </div>

          {canManage ? (
            <>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence initial={false}>
                  {tagChips.map(tag => {
                    const active = tags.includes(tag);
                    return (
                      <motion.button
                        key={tag}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        aria-pressed={active}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors active:scale-[0.92]',
                          active
                            ? 'bg-primary/10 border-primary/20 text-primary'
                            : 'bg-secondary/50 border-border text-muted-foreground/70',
                        )}
                      >
                        {tag}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <input
                  value={customTag}
                  onChange={e => setCustomTag(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
                  placeholder="Своя мітка"
                  maxLength={40}
                  className="flex-1 text-[12px] font-medium bg-secondary/50 border border-border rounded-xl px-3 py-2 outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40"
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  disabled={!customTag.trim()}
                  aria-label="Додати мітку"
                  className="size-9 flex items-center justify-center rounded-xl bg-secondary/60 border border-border text-muted-foreground hover:text-foreground active:scale-[0.92] transition-all disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground/60 bg-secondary/20 py-2.5 px-3 rounded-xl border border-border/40">
              Мітки доступні для клієнтів з акаунтом Bookit
            </p>
          )}
        </div>

        {/* Safety & health */}
        <div className="bento-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                'p-2 rounded-xl flex items-center justify-center',
                medicalNotes ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning',
              )}>
                {medicalNotes ? <AlertTriangle size={16} /> : <ShieldPlus size={16} />}
              </div>
              <div>
                <p className={cn(
                  'text-[10px] font-bold uppercase tracking-[0.16em]',
                  medicalNotes ? 'text-destructive' : 'text-muted-foreground',
                )}>Безпека та здоров&apos;я</p>
                <p className="text-[10px] text-muted-foreground/40 font-medium">Доступно клієнту та майстру</p>
              </div>
            </div>
            {isSavingHealth && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/5 text-destructive">
                <Loader2 size={10} className="animate-spin" />
                <span className="text-[9px] font-bold uppercase tracking-tight">Зберігаємо</span>
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight mb-1.5 block px-1">
                Критичні застереження (алергії)
              </label>
              <textarea
                value={medicalNotes}
                onChange={e => onHealthChange(e.target.value, healthNotes)}
                placeholder="Алергія на фарбу, чутлива шкіра, діабет"
                rows={1}
                className={cn(
                  'w-full text-sm font-medium bg-secondary/50 border rounded-xl px-4 py-3 outline-none transition-all resize-none',
                  medicalNotes
                    ? 'border-destructive/30 text-destructive placeholder:text-destructive/30 focus:border-destructive'
                    : 'border-border text-foreground placeholder:text-muted-foreground/30 focus:border-primary',
                )}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight mb-1.5 block px-1">
                Загальний стан здоров&apos;я
              </label>
              <textarea
                value={healthNotes}
                onChange={e => onHealthChange(medicalNotes, e.target.value)}
                placeholder="Вподобання щодо тиску, особливості постави"
                rows={1}
                className="w-full text-sm text-foreground bg-secondary/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary resize-none transition-all placeholder:text-muted-foreground/30"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-3 font-medium">
            Ця інформація допомагає зробити процедуру безпечною. Вона синхронізована з профілем клієнта.
          </p>
        </div>

        {/* Private notes */}
        <div className="bento-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PenLine size={14} className="text-muted-foreground/60" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.16em]">Приватні нотатки</p>
            </div>
            {isSavingNote && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sage/10 text-sage">
                <Loader2 size={10} className="animate-spin" />
                <span className="text-[9px] font-bold uppercase tracking-tight">Зберігаємо</span>
              </span>
            )}
          </div>
          <textarea
            value={noteValue}
            onChange={e => onNoteChange(e.target.value)}
            placeholder="Формула фарбування, особливі побажання, важливі деталі"
            rows={3}
            className="w-full text-sm text-foreground bg-secondary/50 border border-border rounded-xl px-4 py-3.5 outline-none focus:border-primary resize-none transition-all leading-relaxed placeholder:text-muted-foreground/30"
          />
          <p className="text-[10px] text-muted-foreground/50 mt-2 font-medium">Видимо тільки вам. Автозбереження увімкнено.</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {client && isAtRisk && (
            <button
              type="button"
              onClick={async () => {
                setReminding(true);
                const res = await sendChurnReminder(client.client_id, client.client_phone, client.client_name);
                if (res.error) showToast({ type: 'error', title: 'Помилка', message: parseError(res.error) });
                else showToast({ type: 'success', title: 'Нагадування надіслано' });
                setReminding(false);
              }}
              disabled={reminding}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-sm font-bold bg-destructive/10 text-destructive hover:bg-destructive/15 active:scale-[0.97] transition-all disabled:opacity-60"
            >
              <Bell size={16} />
              {reminding ? 'Надсилаємо' : 'Нагадати про запис'}
            </button>
          )}

          {client?.relation_id ? (
            <button
              type="button"
              onClick={handleToggleVip}
              disabled={isPending}
              className={cn(
                'flex items-center justify-center gap-2 w-full py-4 rounded-xl text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-60',
                client.is_vip
                  ? 'bg-warning/12 text-warning hover:bg-warning/20'
                  : 'bg-secondary/60 border border-border text-muted-foreground hover:bg-secondary',
              )}
            >
              <Crown size={16} />
              {client.is_vip ? 'Прибрати статус VIP' : 'Позначити як VIP'}
            </button>
          ) : (
            <p className="text-[11px] text-muted-foreground/60 text-center bg-secondary/20 py-2 rounded-xl border border-border/40">
              VIP доступний для клієнтів з акаунтом Bookit
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
                className="flex-1 py-4 rounded-xl text-sm font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-[0.97] transition-all disabled:opacity-40"
              >
                {archiving ? 'Архівуємо' : 'Підтвердити'}
              </button>
              <button
                type="button"
                onClick={() => setArchiveConfirmStep(false)}
                className="px-6 py-4 rounded-xl text-sm font-bold bg-secondary/40 text-muted-foreground hover:bg-secondary/60 active:scale-[0.97] transition-all"
              >
                Скасувати
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setArchiveConfirmStep(true)}
              disabled={!client?.client_id}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-sm font-bold bg-secondary/40 text-muted-foreground hover:bg-secondary/60 active:scale-[0.97] transition-all disabled:opacity-40"
            >
              Архівувати клієнта
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
