'use client';

import { useState, useRef, useTransition, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import {
  Crown, Bell, PenLine, Loader2,
  AlertTriangle, ShieldPlus, Tag, Plus, ChevronDown,
} from 'lucide-react';
import {
  sendChurnReminder, saveClientNote, toggleClientVip, archiveClient,
  saveClientHealthInfo, saveClientTags,
} from '@/app/(master)/dashboard/clients/actions';
import { PricingBadge } from '@/components/shared/PricingBadge';
import type { ClientRow } from './ClientsPage';
import { RETENTION_CONFIG } from './ClientsPage';
import { ClientDossierHero } from './ClientDossierHero';
import { useMasterContext } from '@/lib/supabase/context';
import { formatPrice } from '@/components/master/services/types';
import { formatDate, timeAgo } from '@/lib/utils/dates';
import { pluralUk } from '@/lib/utils/pluralUk';
import { useClientNote, useClientNoteInvalidate } from '@/lib/supabase/hooks/useClientNote';
import { useClientBookings } from '@/lib/supabase/hooks/useClientBookings';
import { useClientTags, useClientTagsInvalidate } from '@/lib/supabase/hooks/useClientTags';
import { useClients } from '@/lib/supabase/hooks/useClients';
import { useAmbassadorStatus } from '@/lib/supabase/hooks/useAmbassadorStatus';
import type { RetentionStatus } from '@/lib/supabase/hooks/useClients';
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

// Retention-тони, відтюнені під ТЕМНУ обкладинку (RETENTION_CONFIG — під світлий фон, на slate провалюють).
const RETENTION_DARK: Record<RetentionStatus, { text: string; glow: string }> = {
  active:   { text: '#6EE7B7', glow: '#34D399' }, // emerald — 11.4:1 на #0F172A
  sleeping: { text: '#5EEAD4', glow: '#2DD4BF' }, // teal    — 11.9:1
  at_risk:  { text: '#FDBA74', glow: '#FB923C' }, // orange  —  9.6:1
  lost:     { text: '#FCA5A5', glow: '#F87171' }, // red     —  7.6:1
};

export function ClientDetailSheet({ client, onClose }: ClientDetailSheetProps) {
  const { masterProfile } = useMasterContext();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [archiving, setArchiving] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [archiveConfirmStep, setArchiveConfirmStep] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);

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
    setHealthOpen(false);
    if (client) {
      setMedicalNotes(client.medical_notes ?? '');
      setHealthNotes(client.health_notes ?? '');
    }
  }

  const retentionStatus = client?.retention_status ?? 'active';
  const retention = RETENTION_CONFIG[retentionStatus];
  const retentionDark = RETENTION_DARK[retentionStatus];

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

  // Другорядні метрики — тихий by-numbers ряд у герої (total_spent = домінанта, тут його немає).
  const byNumbers = useMemo(() => [
    { label: 'Візити', value: String(client?.total_visits ?? 0) },
    { label: 'Середній чек', value: formatPrice(client?.average_check ?? 0) },
    { label: 'Останній візит', value: client?.last_visit_at ? timeAgo(client.last_visit_at) : '—' },
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
  const hasAlert = !!medicalNotes.trim();
  const hasHealthInfo = hasAlert || !!healthNotes.trim();

  return (
    <Sheet
      open={!!client}
      onOpenChange={(v) => !v && onClose()}
      srTitle={client?.client_name || 'Інформація про клієнта'}
    >
      <div className="flex flex-col gap-5">
        {/* ── HERO: темна обкладинка-досьє (ідентичність + цінність + сигнал) ── */}
        <ClientDossierHero
          name={client?.client_name || ''}
          phone={client?.client_phone || ''}
          retentionLabel={retention.label}
          retentionText={retentionDark.text}
          retentionGlow={retentionDark.glow}
          isVip={!!client?.is_vip}
          isAmbassador={isAmbassador}
          hasAlert={hasAlert}
          totalSpentLabel={formatPrice(client?.total_spent ?? 0)}
          showRank={showRank}
          rank={rank}
          totalClients={totalClients}
          spentPct={spentPct}
          cadenceText={cadenceText}
          byNumbers={byNumbers}
        />

        {/* ── Останні записи (свіжий = featured, решта компактні) ── */}
        <div className="bento-card p-5">
          <p className="text-[10px] font-bold text-text-sub uppercase tracking-[0.16em] mb-4">Останні записи</p>
          {isLoadingBookings ? (
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-[58px] rounded-xl bg-secondary/40 animate-pulse" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-6 bg-secondary/20 rounded-xl border border-dashed border-border/40">
              <p className="text-xs text-text-sub">Записів ще немає</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {bookings.map((b, i) => {
                const cfg = BOOKING_STATUS_CONFIG[b.status as BookingStatus] ?? BOOKING_STATUS_CONFIG.pending;
                const featured = i === 0;
                return (
                  <div
                    key={b.id}
                    className={cn(
                      'flex items-center gap-4 rounded-xl border border-border',
                      featured ? 'py-4 px-4 bg-secondary/60' : 'py-2.5 px-4 bg-secondary/35',
                    )}
                  >
                    <div className="flex-shrink-0 w-12 text-center">
                      <p className={cn('font-bold text-foreground tabular-nums', featured ? 'text-sm' : 'text-xs')}>{b.start_time}</p>
                      <p className="text-[9px] text-text-sub font-bold uppercase mt-0.5">{formatDate(b.date)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('font-bold text-foreground truncate', featured ? 'text-sm' : 'text-xs')}>{b.service_name}</p>
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
                    <p className={cn('font-bold text-foreground flex-shrink-0 tabular-nums', featured ? 'text-sm' : 'text-xs')}>{formatPrice(b.total_price)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Особисті мітки ── */}
        <div className="bento-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-text-sub" />
              <p className="text-[10px] font-bold text-text-sub uppercase tracking-[0.16em]">Особисті мітки</p>
            </div>
            {isSavingTags ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sage/10 text-sage">
                <Loader2 size={10} className="animate-spin" />
                <span className="text-[9px] font-bold uppercase tracking-tight">Зберігаємо</span>
              </span>
            ) : (
              <span className="text-[10px] text-text-sub font-medium">Лише для вас</span>
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
                            : 'bg-secondary/50 border-border text-text-sub',
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
                  className="flex-1 text-[12px] font-medium bg-secondary/50 border border-border rounded-xl px-3 py-2 outline-none focus:border-primary transition-colors text-foreground placeholder:text-text-sub"
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  disabled={!customTag.trim()}
                  aria-label="Додати мітку"
                  className="size-9 flex items-center justify-center rounded-xl bg-secondary/60 border border-border text-text-sub hover:text-foreground active:scale-[0.92] transition-all disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>
            </>
          ) : (
            <p className="text-[11px] text-text-sub bg-secondary/20 py-2.5 px-3 rounded-xl border border-border/40">
              Мітки доступні для клієнтів з акаунтом Bookit
            </p>
          )}
        </div>

        {/* ── Безпека та здоров'я: тихий розкривний блок (сигнал уже в герої) ── */}
        <div className={cn('bento-card overflow-hidden', hasAlert && 'ring-1 ring-destructive/20')}>
          <button
            type="button"
            onClick={() => setHealthOpen(o => !o)}
            aria-expanded={healthOpen}
            className="w-full flex items-center justify-between gap-3 p-5 text-left active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={cn(
                'p-2 rounded-xl flex items-center justify-center shrink-0',
                hasAlert ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning',
              )}>
                {hasAlert ? <AlertTriangle size={16} /> : <ShieldPlus size={16} />}
              </div>
              <div className="min-w-0">
                <p className={cn('text-sm font-bold', hasAlert ? 'text-destructive' : 'text-foreground')}>Безпека та здоров&apos;я</p>
                <p className="text-[11px] text-text-sub truncate">
                  {hasAlert ? 'Є критичне застереження' : hasHealthInfo ? 'Є нотатки' : 'Алергії та особливості для безпечної процедури'}
                </p>
              </div>
            </div>
            <ChevronDown size={18} className={cn('text-text-sub shrink-0 transition-transform', healthOpen && 'rotate-180')} />
          </button>

          <AnimatePresence initial={false}>
            {healthOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 32 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-3">
                  <div className="flex items-center justify-end -mt-1 h-4">
                    {isSavingHealth && (
                      <span className="flex items-center gap-1.5 text-destructive">
                        <Loader2 size={10} className="animate-spin" />
                        <span className="text-[9px] font-bold uppercase tracking-tight">Зберігаємо</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-sub uppercase tracking-tight mb-1.5 block px-1">
                      Критичні застереження (алергії)
                    </label>
                    <textarea
                      value={medicalNotes}
                      onChange={e => onHealthChange(e.target.value, healthNotes)}
                      placeholder="Алергія на фарбу, чутлива шкіра, діабет"
                      rows={1}
                      className={cn(
                        'w-full text-sm font-medium bg-secondary/50 border rounded-xl px-4 py-3 outline-none transition-all resize-none',
                        hasAlert
                          ? 'border-destructive/30 text-destructive placeholder:text-destructive/30 focus:border-destructive'
                          : 'border-border text-foreground placeholder:text-text-sub focus:border-primary',
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-sub uppercase tracking-tight mb-1.5 block px-1">
                      Загальний стан здоров&apos;я
                    </label>
                    <textarea
                      value={healthNotes}
                      onChange={e => onHealthChange(medicalNotes, e.target.value)}
                      placeholder="Вподобання щодо тиску, особливості постави"
                      rows={1}
                      className="w-full text-sm text-foreground bg-secondary/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary resize-none transition-all placeholder:text-text-sub"
                    />
                  </div>
                  <p className="text-[10px] text-text-sub font-medium">
                    Синхронізовано з профілем клієнта. Допомагає зробити процедуру безпечною.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Приватні нотатки ── */}
        <div className="bento-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PenLine size={14} className="text-text-sub" />
              <p className="text-[10px] font-bold text-text-sub uppercase tracking-[0.16em]">Приватні нотатки</p>
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
            className="w-full text-sm text-foreground bg-secondary/50 border border-border rounded-xl px-4 py-3.5 outline-none focus:border-primary resize-none transition-all leading-relaxed placeholder:text-text-sub"
          />
          <p className="text-[10px] text-text-sub mt-2 font-medium">Видимо тільки вам. Автозбереження увімкнено.</p>
        </div>

        {/* ── Дії ── */}
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
                  : 'bg-secondary/60 border border-border text-text-sub hover:bg-secondary',
              )}
            >
              <Crown size={16} />
              {client.is_vip ? 'Прибрати статус VIP' : 'Позначити як VIP'}
            </button>
          ) : (
            <p className="text-[11px] text-text-sub text-center bg-secondary/20 py-2 rounded-xl border border-border/40">
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
                className="px-6 py-4 rounded-xl text-sm font-bold bg-secondary/40 text-text-sub hover:bg-secondary/60 active:scale-[0.97] transition-all"
              >
                Скасувати
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setArchiveConfirmStep(true)}
              disabled={!client?.client_id}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-sm font-bold bg-secondary/40 text-text-sub hover:bg-secondary/60 active:scale-[0.97] transition-all disabled:opacity-40"
            >
              Архівувати клієнта
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
