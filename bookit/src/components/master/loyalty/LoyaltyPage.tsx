'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus, Pencil, Trash2, Gift, Users, Loader2, Share2, Check, Flame, TrendingUp } from 'lucide-react';
import { saveMasterC2CSettings } from '@/app/(master)/dashboard/loyalty/actions';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useLoyaltyStats, type LoyaltyProgramStat } from '@/lib/supabase/hooks/useLoyaltyStats';
import { useTour } from '@/lib/hooks/useTour';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { cn } from '@/lib/utils/cn';

interface LoyaltyProgram {
  id: string;
  name: string;
  targetVisits: number;
  rewardType: string;
  rewardValue: number;
  isActive: boolean;
}

function ProgramForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: Partial<LoyaltyProgram>;
  onSave: (data: Omit<LoyaltyProgram, 'id' | 'isActive'>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [targetVisits, setTargetVisits] = useState(String(initial?.targetVisits ?? 5));
  const [rewardValue, setRewardValue] = useState(String(initial?.rewardValue ?? 10));

  const canSave = name.trim() && Number(targetVisits) > 0 && Number(rewardValue) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="bento-card p-4"
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-medium text-text-sub mb-1 block">Назва програми</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Наприклад: Постійний клієнт"
            aria-label="Назва програми лояльності"
            className="w-full px-3 py-2.5 rounded-xl bg-secondary/80 border border-border text-sm text-foreground placeholder-[#A8928D] outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-text-sub mb-1 block">Після скільки візитів</label>
            <input
              type="number"
              min="1"
              value={targetVisits}
              onChange={e => setTargetVisits(e.target.value)}
              aria-label="Кількість візитів для нагороди"
              className="w-full px-3 py-2.5 rounded-xl bg-secondary/80 border border-border text-sm text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-sub mb-1 block">Знижка (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={rewardValue}
              onChange={e => setRewardValue(e.target.value)}
              aria-label="Знижка у відсотках"
              className="w-full px-3 py-2.5 rounded-xl bg-secondary/80 border border-border text-sm text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-secondary/70 border border-border text-sm font-medium text-text-sub hover:bg-secondary transition-colors active:scale-95"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={() => onSave({ name: name.trim(), targetVisits: Number(targetVisits), rewardType: 'percent_discount', rewardValue: Number(rewardValue) })}
            disabled={!canSave || isSaving}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Зберегти'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Огляд-картка: pipeline-тріада + impact-смуга (M-GROW-01) ──────────────────
function OverviewCard({
  inProgress,
  ready,
  oneStep,
  minTarget,
  impact,
  onNavigate,
}: {
  inProgress: number;
  ready: number;
  oneStep: number;
  minTarget: number;
  impact: { given_hryvnia: number; redemptions: number } | undefined;
  onNavigate: (params: string) => void;
}) {
  const segments: { key: string; value: number; label: string; icon: typeof Users; tint: string; chip: string; href: string | null }[] = [
    { key: 'progress', value: inProgress, label: 'у прогресі', icon: TrendingUp, tint: 'text-foreground', chip: 'bg-secondary text-text-sub', href: 'loyaltyMin=1' },
    { key: 'ready', value: ready, label: 'готові', icon: Check, tint: 'text-success', chip: 'bg-success/12 text-success', href: minTarget > 0 ? `loyaltyMin=${minTarget}` : null },
    { key: 'step', value: oneStep, label: 'за крок', icon: Flame, tint: 'text-amber-700', chip: 'bg-amber-500/12 text-amber-700', href: minTarget > 1 ? `loyaltyExact=${minTarget - 1}` : null },
  ];

  return (
    <div className="bento-card p-5 flex flex-col gap-4">
      <p className="text-sm text-foreground">
        <span className="font-semibold tabular-nums">{inProgress}</span>{' '}
        {inProgress === 1 ? 'клієнт рухається' : 'клієнтів рухаються'} до нагороди
      </p>

      <div className="flex items-stretch rounded-2xl bg-secondary/30 border border-border/60 overflow-hidden">
        {segments.map((s, i) => {
          const Icon = s.icon;
          const inner = (
            <>
              <span className={cn('size-7 rounded-lg flex items-center justify-center shrink-0', s.chip)}>
                <Icon size={14} />
              </span>
              <span className={cn('text-2xl font-semibold tabular-nums leading-none', s.tint)}>{s.value}</span>
              <span className="text-[11px] text-text-sub">{s.label}</span>
            </>
          );
          const cls = cn(
            'flex-1 flex flex-col items-center justify-center gap-1.5 py-3 min-h-[88px]',
            i > 0 && 'border-l border-border/60',
          );
          return s.href && s.value > 0 ? (
            <button
              key={s.key}
              type="button"
              onClick={() => onNavigate(s.href!)}
              aria-label={`${s.label}: ${s.value} клієнтів — відкрити список`}
              className={cn(cls, 'transition-colors hover:bg-secondary/50 active:scale-[0.98] cursor-pointer')}
            >
              {inner}
            </button>
          ) : (
            <div key={s.key} className={cls}>{inner}</div>
          );
        })}
      </div>

      {/* Impact-смуга (forward-only) */}
      <div className="flex items-center gap-2 pt-1 border-t border-secondary/60">
        {impact && impact.redemptions > 0 ? (
          <p className="text-xs text-text-sub pt-2">
            За 30 днів:{' '}
            <span className="font-semibold text-foreground tabular-nums">{impact.given_hryvnia.toLocaleString('uk-UA')} ₴</span>{' '}
            віддано ·{' '}
            <span className="font-semibold text-foreground tabular-nums">{impact.redemptions}</span>{' '}
            {impact.redemptions === 1 ? 'раз' : 'разів'}
          </p>
        ) : (
          <p className="text-xs text-text-sub pt-2">Поки порожньо. Перша надана знижка зʼявиться тут</p>
        )}
      </div>
    </div>
  );
}

// ── Міні-прогрес у картці програми ────────────────────────────────────────────
function ProgramProgress({
  stat,
  targetVisits,
  reduceMotion,
  onReachedClick,
}: {
  stat: LoyaltyProgramStat | undefined;
  targetVisits: number;
  reduceMotion: boolean | null;
  onReachedClick: () => void;
}) {
  const onTrack = stat?.on_track ?? 0;
  const reached = stat?.reached ?? 0;
  const total = onTrack + reached;

  if (total === 0) {
    return <p className="text-xs text-text-sub mt-3">Ще немає клієнтів на цій програмі</p>;
  }

  const reachedPct = (reached / total) * 100;
  const onTrackPct = (onTrack / total) * 100;

  return (
    <div className="mt-3 flex flex-col gap-1.5">
      <div className="w-full h-1.5 rounded-full overflow-hidden bg-border/60 flex">
        <motion.div
          className="h-full bg-success"
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width: `${reachedPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <motion.div
          className="h-full bg-primary/45"
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width: `${onTrackPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
        />
      </div>
      <p className="text-xs text-text-sub">
        <span className="tabular-nums">{onTrack}</span> на шляху ·{' '}
        {reached > 0 ? (
          <button
            type="button"
            onClick={onReachedClick}
            aria-label={`${reached} клієнтів готові до нагороди — відкрити список`}
            className="text-[#0D6B2F] font-medium hover:underline active:scale-[0.98] cursor-pointer"
          >
            <span className="tabular-nums">{reached}</span> готові
          </button>
        ) : (
          <span><span className="tabular-nums">0</span> готові</span>
        )}
      </p>
    </div>
  );
}

export function LoyaltyPage({ isDrawer }: { isDrawer?: boolean }) {
  const { masterProfile, refresh } = useMasterContext();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const masterId = masterProfile?.id;
  const qc = useQueryClient();
  const { currentStep, nextStep, closeTour } = useTour('loyalty', 2, {
    initialSeen: seenTours?.loyalty ?? false,
    masterId: masterProfile?.id,
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // C2C referral settings
  const [c2cEnabled, setC2cEnabled] = useState(masterProfile?.c2c_enabled ?? false);
  const [c2cDiscount, setC2cDiscount] = useState(masterProfile?.c2c_discount_pct ?? 10);
  const [c2cSaving, setC2cSaving] = useState(false);
  const [c2cError, setC2cError] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  // Sync local state when masterProfile context re-hydrates (e.g. after page navigation)
  useEffect(() => {
    setC2cEnabled(masterProfile?.c2c_enabled ?? false);
    setC2cDiscount(masterProfile?.c2c_discount_pct ?? 10);
  }, [masterProfile?.c2c_enabled, masterProfile?.c2c_discount_pct]);

  const handleSaveC2C = async () => {
    setC2cSaving(true);
    setC2cError(null);
    setShowSaved(false);
    const res = await saveMasterC2CSettings(c2cEnabled, c2cDiscount);
    if (!res.error) {
      await refresh();
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    }
    setC2cSaving(false);
    if (res.error) setC2cError(res.error);
  };

  const { data: programs = [], isLoading } = useQuery<LoyaltyProgram[]>({
    queryKey: ['loyaltyPrograms', masterId],
    enabled: !!masterId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('loyalty_programs')
        .select('id, name, target_visits, reward_type, reward_value, is_active')
        .eq('master_id', masterId!)
        .order('target_visits', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        id: p.id as string,
        name: p.name as string,
        targetVisits: p.target_visits as number,
        rewardType: p.reward_type as string,
        rewardValue: Number(p.reward_value),
        isActive: p.is_active as boolean,
      }));
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const { overview, impact } = useLoyaltyStats(masterId);
  const statById = useMemo(() => {
    const m = new Map<string, LoyaltyProgramStat>();
    (overview.data?.programs ?? []).forEach(p => m.set(p.id, p));
    return m;
  }, [overview.data]);

  const minActiveTarget = useMemo(() => {
    const targets = programs.filter(p => p.isActive).map(p => p.targetVisits);
    return targets.length ? Math.min(...targets) : 0;
  }, [programs]);

  const goToClients = (params: string) => router.push(`/dashboard/clients?${params}`);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['loyaltyPrograms', masterId] });
    qc.invalidateQueries({ queryKey: ['loyaltyOverview', masterId] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: Omit<LoyaltyProgram, 'id' | 'isActive'>) => {
      const supabase = createClient();
      const { error } = await supabase.from('loyalty_programs').insert({
        master_id: masterId!,
        name: data.name,
        target_visits: data.targetVisits,
        reward_type: data.rewardType,
        reward_value: data.rewardValue,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Omit<LoyaltyProgram, 'id' | 'isActive'> }) => {
      const supabase = createClient();
      const { error } = await supabase.from('loyalty_programs').update({
        name: data.name,
        target_visits: data.targetVisits,
        reward_type: data.rewardType,
        reward_value: data.rewardValue,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setEditingId(null); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase.from('loyalty_programs').update({ is_active: !isActive }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('loyalty_programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setConfirmDelete(null); },
  });

  const showOverview = !isDrawer && programs.length > 0 && overview.data?.has_programs;

  return (
    <div className="flex flex-col gap-4 pb-8">
      {!isDrawer && (
        <div className={cn(
          'relative bento-card p-5 transition-all duration-500',
          currentStep === 0 && 'tour-glow z-40 scale-[1.02]'
        )}>
          <AnchoredTooltip
            isOpen={currentStep === 0}
            onClose={closeTour}
            title="🎁 Налаштування лояльності"
            text="Зробіть так, щоб клієнти поверталися. Налаштуйте відсоток знижки, який вони отримуватимуть після кожного візиту."
            position="bottom"
            primaryButtonText="Далі →"
            onPrimaryClick={nextStep}
          />
          <h1 className="heading-serif text-xl text-foreground mb-0.5">Програми лояльності</h1>
          <p className="text-sm text-text-sub">Знижки для постійних клієнтів</p>
        </div>
      )}

      {/* Live overview (коли є програми) — інакше пояснювальний банер нижче */}
      {showOverview && (
        <OverviewCard
          inProgress={overview.data!.in_progress}
          ready={overview.data!.ready}
          oneStep={overview.data!.one_step}
          minTarget={minActiveTarget}
          impact={impact.data}
          onNavigate={goToClients}
        />
      )}

      {/* Info banner — лише в порожньому/онбординг-стані */}
      {programs.length === 0 && !isLoading && (
        <div className="bento-card p-4 flex items-start gap-3" style={{ background: 'rgba(120, 154, 153, 0.08)' }}>
          <Gift size={16} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-foreground">Як це працює</p>
            <p className="text-xs text-text-sub mt-0.5 leading-relaxed">
              Коли клієнт досягає потрібної кількості візитів, він автоматично отримує знижку при наступному записі через публічну сторінку.
            </p>
          </div>
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <div className={cn(
          'relative rounded-2xl transition-all duration-500',
          currentStep === 1 && 'tour-glow z-40 scale-[1.02]'
        )}>
          <AnchoredTooltip
            isOpen={currentStep === 1}
            onClose={closeTour}
            title="🔒 Утримання клієнтів"
            text="Клієнт ніколи не піде до іншого майстра, якщо у вас на нього чекають накопичені бонуси."
            position="bottom"
            primaryButtonText="Зрозуміло"
            onPrimaryClick={nextStep}
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-[0_4px_14px_rgba(120,154,153,0.3)]"
          >
            <Plus size={16} /> Нова програма
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <ProgramForm
            onSave={data => createMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
            isSaving={createMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10 gap-2">
          <Loader2 size={20} className="text-primary animate-spin" />
          <span className="text-sm text-text-sub">Завантаження...</span>
        </div>
      ) : programs.length === 0 && !showForm ? (
        <div className="bento-card p-8 flex flex-col items-center gap-3 text-center">
          <div className="size-14 rounded-full bg-secondary flex items-center justify-center">
            <Users size={26} className="text-text-sub" />
          </div>
          <p className="text-sm font-semibold text-foreground">Програм лояльності ще немає</p>
          <p className="text-xs text-text-sub">Створіть першу знижку для постійних клієнтів</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {programs.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                className={`bento-card p-4 transition-opacity ${!p.isActive ? 'opacity-55' : ''}`}
              >
                {editingId === p.id ? (
                  <ProgramForm
                    initial={p}
                    onSave={data => updateMutation.mutate({ id: p.id, data })}
                    onCancel={() => setEditingId(null)}
                    isSaving={updateMutation.isPending}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-2xl flex items-center justify-center bg-primary/10 shrink-0">
                        <Gift size={18} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{p.name}</p>
                        <p className="text-xs text-text-sub">
                          Після {p.targetVisits} візитів · знижка {p.rewardValue}%
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.isActive ? 'bg-success/15 text-success' : 'bg-secondary/80 text-text-sub'
                      }`}>
                        {p.isActive ? 'Активна' : 'Вимкнена'}
                      </span>
                    </div>

                    {/* Progress-aware зріз */}
                    {p.isActive && (
                      <ProgramProgress
                        stat={statById.get(p.id)}
                        targetVisits={p.targetVisits}
                        reduceMotion={reduceMotion}
                        onReachedClick={() => goToClients(`loyaltyMin=${p.targetVisits}`)}
                      />
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-secondary/60">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Редагувати"
                          onClick={() => setEditingId(p.id)}
                          className="size-8 flex items-center justify-center rounded-xl bg-secondary/70 border border-border text-text-sub hover:bg-secondary hover:text-primary transition-colors"
                        >
                          <Pencil size={14} />
                        </button>

                        <AnimatePresence mode="popLayout">
                          {confirmDelete === p.id ? (
                            <motion.div
                              key="confirm"
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              className="flex items-center gap-1 overflow-hidden"
                            >
                              <span className="text-xs text-destructive font-medium whitespace-nowrap ml-1">Видалити?</span>
                              <button
                                type="button"
                                onClick={() => deleteMutation.mutate(p.id)}
                                disabled={deleteMutation.isPending}
                                aria-disabled={deleteMutation.isPending}
                                className="px-2.5 h-7 rounded-lg bg-destructive text-white text-xs font-semibold hover:bg-[#a84a4a] transition-colors disabled:opacity-60 flex items-center gap-1"
                              >
                                {deleteMutation.isPending
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : 'Так'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(null)}
                                className="px-2.5 h-7 rounded-lg bg-secondary/70 border border-border text-xs font-medium text-text-sub hover:bg-secondary transition-colors"
                              >
                                Ні
                              </button>
                            </motion.div>
                          ) : (
                            <button
                              type="button"
                              aria-label="Видалити програму"
                              onClick={() => setConfirmDelete(p.id)}
                              className="size-8 flex items-center justify-center rounded-xl bg-secondary/70 border border-border text-text-sub hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </AnimatePresence>
                      </div>

                      <button
                        type="button"
                        aria-pressed={p.isActive}
                        aria-label={p.isActive ? 'Вимкнути програму' : 'Увімкнути програму'}
                        onClick={() => toggleMutation.mutate({ id: p.id, isActive: p.isActive })}
                        disabled={toggleMutation.isPending}
                        aria-disabled={toggleMutation.isPending}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-60 ${p.isActive ? 'bg-primary' : 'bg-secondary/80'}`}
                      >
                        <motion.div
                          animate={{ x: p.isActive ? 20 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-1 size-4 rounded-full bg-white shadow-sm"
                        />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {/* C2C Referral Settings */}
      <div className="bento-card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Share2 size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Реферальна програма клієнтів</p>
            <p className="text-xs text-text-sub">Клієнти діляться посиланням — подруга отримує знижку</p>
          </div>
          <button
            type="button"
            aria-pressed={c2cEnabled}
            aria-label="Увімкнути реферальну програму клієнтів"
            onClick={() => setC2cEnabled(v => !v)}
            disabled={c2cSaving}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-60 ${c2cEnabled ? 'bg-primary' : 'bg-secondary/80'}`}
          >
            <motion.div
              animate={{ x: c2cEnabled ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 size-4 rounded-full bg-white shadow-sm"
            />
          </button>
        </div>

        <AnimatePresence>
          {c2cEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden flex flex-col gap-3"
            >
              <div>
                <label className="text-xs font-medium text-text-sub mb-1 block">
                  Знижка % (1–50)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={c2cDiscount}
                  onChange={e => setC2cDiscount(Number(e.target.value))}
                  aria-label="Знижка для реферала у відсотках"
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/80 border border-border text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
                <p className="text-xs text-text-sub mt-1">
                  Подруга отримає −{c2cDiscount}% на перший візит · Клієнт накопить +{c2cDiscount}% бонус за кожну подругу
                </p>
              </div>

              {c2cError && (
                <p className="text-xs text-destructive">{c2cError}</p>
              )}

              <button
                type="button"
                onClick={handleSaveC2C}
                disabled={c2cSaving || showSaved}
                className={cn(
                  "w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2",
                  showSaved ? "bg-success" : "bg-primary hover:bg-primary/90",
                  c2cSaving && "opacity-50"
                )}
              >
                {c2cSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : showSaved ? (
                  <>✓ Збережено</>
                ) : (
                  "Зберегти"
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!c2cEnabled && (
          <button
            type="button"
            onClick={handleSaveC2C}
            disabled={c2cSaving || showSaved}
            className={cn(
              "w-full py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1",
              showSaved
                ? "bg-success/10 text-success border border-success/20"
                : "bg-secondary/70 border border-border text-text-sub hover:bg-secondary",
              c2cSaving && "opacity-50"
            )}
          >
            {c2cSaving ? (
              <Loader2 size={12} className="animate-spin" />
            ) : showSaved ? (
              <>✓ Збережено</>
            ) : (
              "Зберегти (вимкнено)"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
