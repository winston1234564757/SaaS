'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Users, TrendingUp, TrendingDown, Minus, Star, AlertCircle, Zap, MessageSquare, ChevronRight, Share2, Sparkles, Crown, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { formatPrice } from '@/components/master/services/types';
import { Sheet } from '@/components/ui/Sheet';
import type { ClientRow } from './ClientsPage';
import { RETENTION_CONFIG } from './ClientsPage';
import { useMasterContext } from '@/lib/supabase/context';
import { useAnalytics } from '@/lib/supabase/hooks/useAnalytics';
import { useTopAmbassadors } from '@/lib/supabase/hooks/useTopAmbassadors';
import { pluralUk } from '@/lib/utils/pluralUk';
import { useDismissable } from '@/lib/hooks/useDismissable';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M ₴`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k ₴`;
  return `${n} ₴`;
}

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 } as const;

// Напрям-залежний крос-слайд панелей switcher-а (transform+opacity, без overshoot).
const panelVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir >= 0 ? -24 : 24 }),
};

interface ClientWidgetsProps {
  clients: ClientRow[];
  isLoading: boolean;
  onSegmentSelect: (segmentId: string) => void;
  activeSegment: string;
}

export function ClientWidgets({ clients, isLoading, onSegmentSelect, activeSegment }: ClientWidgetsProps) {
  const { masterProfile } = useMasterContext();
  const [showCheckDetails, setShowCheckDetails] = useState(false);
  const isPro = masterProfile?.subscription_tier === 'pro' || masterProfile?.subscription_tier === 'studio';
  const now = new Date();
  const { data: analytics } = useAnalytics(
    { startDate: format(startOfMonth(now), 'yyyy-MM-dd'), endDate: format(endOfMonth(now), 'yyyy-MM-dd') },
    isPro, 'month', 0,
  );
  const [showReferralDetails, setShowReferralDetails] = useState(false);
  const [expandedAmbassadorId, setExpandedAmbassadorId] = useState<string | null>(null);
  const [widgetIndex, setWidgetIndex] = useState(0);
  const [swipeDir, setSwipeDir] = useState(0);
  const prefersReduced = useReducedMotion();
  const switchWidget = (i: number) => {
    if (i === widgetIndex) return;
    setSwipeDir(i > widgetIndex ? 1 : -1);
    setWidgetIndex(i);
  };
  const { data: ambassadorResult } = useTopAmbassadors(masterProfile?.id);

  const {
    activeCount, sleepingCount, atRiskCount, lostCount,
    totalRevenue, avgCheck, lostTreasures, newbiesAtRisk, archiveCount,
  } = useMemo(() => {
    const activeCount   = clients.filter(c => c.retention_status === 'active').length;
    const sleepingCount = clients.filter(c => c.retention_status === 'sleeping').length;
    const atRiskCount   = clients.filter(c => c.retention_status === 'at_risk').length;
    const lostCount     = clients.filter(c => c.retention_status === 'lost').length;

    const totalRevenue = clients.reduce((s, c) => s + c.total_spent, 0);
    const totalVisits  = clients.reduce((s, c) => s + c.total_visits, 0);
    const avgCheck     = totalVisits > 0 ? totalRevenue / totalVisits : 0;

    const lostTreasures = clients.filter(c => c.is_vip && (c.retention_status === 'at_risk' || c.retention_status === 'lost'));
    const newbiesAtRisk = clients.filter(c => c.total_visits === 1 && c.retention_status === 'at_risk');

    const cycle = masterProfile?.retention_cycle_days || 60;
    const archiveThreshold = new Date();
    archiveThreshold.setDate(archiveThreshold.getDate() - (cycle * 2));
    const archiveCount = clients.filter(c => {
      if (!c.last_visit_at) return false;
      return new Date(c.last_visit_at) < archiveThreshold;
    }).length;

    return { activeCount, sleepingCount, atRiskCount, lostCount, totalRevenue, avgCheck, lostTreasures, newbiesAtRisk, archiveCount };
  }, [clients, masterProfile?.retention_cycle_days]);

  const cleanupDismiss  = useDismissable('clients_cleanup', archiveCount);
  const followupDismiss = useDismissable('clients_followup', newbiesAtRisk.length);

  // Early return ТІЛЬКИ після всіх хуків — інакше перехід loading→loaded міняє
  // кількість викликаних хуків і React кидає «Rendered more hooks…» (краш на мобілці).
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 h-32 skeleton-shimmer rounded-3xl" />
        <div className="h-28 skeleton-shimmer rounded-3xl" />
        <div className="h-28 skeleton-shimmer rounded-3xl" />
      </div>
    );
  }

  const ambassadorData = ambassadorResult?.success ? ambassadorResult.data : null;

  return (
    <div className="grid grid-cols-2 gap-3">

      {/* 1. Retention Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="col-span-2 bento-card p-5 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Утримання бази</p>
            <h3 className="text-2xl font-display font-bold text-foreground">
              {Math.round((activeCount / clients.length) * 100 || 0)}%
              <span className="text-xs font-medium text-muted-foreground/70 ml-2">здоровий стан</span>
            </h3>
          </div>
          <Users className="text-sage opacity-10" size={40} />
        </div>

        <div className="flex gap-1.5 h-2.5 rounded-full overflow-hidden bg-secondary/20">
          <div style={{ width: `${(activeCount/clients.length)*100}%`, background: RETENTION_CONFIG.active.color }} />
          <div style={{ width: `${(sleepingCount/clients.length)*100}%`, background: RETENTION_CONFIG.sleeping.color }} />
          <div style={{ width: `${(atRiskCount/clients.length)*100}%`, background: RETENTION_CONFIG.at_risk.color }} />
          <div style={{ width: `${(lostCount/clients.length)*100}%`, background: RETENTION_CONFIG.lost.color }} />
        </div>

        <div className="grid grid-cols-4 gap-2 mt-5">
          {[
            { id: 'active',   label: 'Активні',   count: activeCount,   color: RETENTION_CONFIG.active.color,   bg: RETENTION_CONFIG.active.bg },
            { id: 'sleeping', label: 'Дрімають',  count: sleepingCount, color: RETENTION_CONFIG.sleeping.color, bg: RETENTION_CONFIG.sleeping.bg },
            { id: 'at_risk',  label: 'У ризику',  count: atRiskCount,   color: RETENTION_CONFIG.at_risk.color,  bg: RETENTION_CONFIG.at_risk.bg },
            { id: 'lost',     label: 'Втрачені',  count: lostCount,     color: RETENTION_CONFIG.lost.color,     bg: RETENTION_CONFIG.lost.bg },
          ].map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSegmentSelect(item.id)}
              aria-pressed={activeSegment === item.id}
              className={`p-2 rounded-xl active:scale-[0.88] transition-all text-left ${activeSegment === item.id ? 'ring-2 ring-inset ring-foreground/10 bg-secondary/60' : 'hover:bg-secondary/40'}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="size-1.5 rounded-full" style={{ background: item.color }} />
                <p className="text-[13px] font-bold text-foreground leading-none">{item.count}</p>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/60">{item.label}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* 2. Average Check */}
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="bento-card p-4 flex flex-col justify-between hover:shadow-md active:scale-[0.95] transition-all duration-100 text-left"
        onClick={() => setShowCheckDetails(true)}
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Середній чек</p>
          <TrendingUp size={14} className="text-primary/40" />
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold text-foreground whitespace-nowrap">
            {formatCompact(Math.round(avgCheck))}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">за весь час</p>
        </div>
      </motion.button>

      {/* 3. iOS Style Switcher: Important / Referrers — статична картка, свайп лише перемикає */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          if (info.offset.x > 50) switchWidget(0);
          else if (info.offset.x < -50) switchWidget(1);
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.1 }}
        className="bento-card p-4 flex flex-col justify-between relative overflow-hidden touch-pan-y"
      >
        {/* Content button */}
        <button
          type="button"
          className="w-full h-full text-left flex flex-col justify-between pb-7"
          onClick={() => {
            if (widgetIndex === 1) setShowReferralDetails(true);
            else if (lostTreasures.length > 0) onSegmentSelect('lost_treasures');
            else onSegmentSelect('potential_vip');
          }}
        >
          <AnimatePresence mode="popLayout" custom={swipeDir} initial={false}>
            {widgetIndex === 0 ? (
              <motion.div
                key="treasures"
                custom={swipeDir}
                variants={panelVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={prefersReduced ? { duration: 0 } : SPRING}
                className="h-full flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${lostTreasures.length > 0 ? 'bg-warning/20 text-warning' : 'bg-secondary text-muted-foreground/40'}`}>
                    <Star size={14} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Важливі</p>
                </div>
                {lostTreasures.length > 0 ? (
                  <div>
                    <p className="text-2xl font-display font-bold text-warning">{lostTreasures.length}</p>
                    <p className="text-[10px] text-warning/70 mt-1 font-medium italic">VIP під загрозою</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl font-display font-bold text-foreground">0</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">всі VIP активні</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="referrers"
                custom={swipeDir}
                variants={panelVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={prefersReduced ? { duration: 0 } : SPRING}
                className="h-full flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-sage/20 text-sage">
                    <Share2 size={14} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Амбасадори</p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-sage">{ambassadorData?.ambassadors.length ?? 0}</p>
                  <p className="text-[10px] text-sage/70 mt-1 font-medium italic">топ-реферали</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Горизонтальні індикатори свайпу — крапка ↔ лінія, по центру знизу, 44px-таргети */}
        <div className="absolute bottom-1 left-0 right-0 flex flex-row items-center justify-center z-10">
          {[0, 1].map(i => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); switchWidget(i); }}
              aria-pressed={widgetIndex === i}
              aria-label={i === 0 ? 'Важливі клієнти' : 'Амбасадори'}
              className="h-11 w-8 flex items-center justify-center"
            >
              <motion.div
                className="rounded-full bg-foreground"
                style={{ height: 5 }}
                animate={{ width: widgetIndex === i ? 18 : 5, opacity: widgetIndex === i ? 1 : 0.2 }}
                transition={prefersReduced ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }}
              />
            </button>
          ))}
        </div>
      </motion.div>

      {/* 4. Cleanup Wizard */}
      <AnimatePresence>
        {archiveCount > 0 && !cleanupDismiss.dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -8 }}
            transition={prefersReduced ? { duration: 0 } : SPRING}
            className="col-span-2 p-5 rounded-xl bg-secondary/30 border border-secondary/50 flex flex-col items-center text-center gap-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Zap size={80} />
            </div>
            <button
              type="button"
              aria-label="Сховати"
              onClick={cleanupDismiss.dismiss}
              className="absolute top-2 right-2 z-10 p-1.5 rounded-lg text-muted-foreground/40 hover:text-muted-foreground/70 hover:bg-secondary/60 active:scale-[0.9] transition-all"
            >
              <X size={14} />
            </button>
            <div className="size-12 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground shadow-sm">
              <Users size={20} className="opacity-40" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Пора почистити базу</h4>
              <p className="text-xs text-muted-foreground/60 mt-1 max-w-[240px]">
                У вас {archiveCount} {pluralUk(archiveCount, 'клієнт', 'клієнти', 'клієнтів')} у глибокому відтоку.
                Архівуйте їх, щоб бачити тільки актуальні дані.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSegmentSelect('archive_cleanup')}
              className="px-6 py-2.5 rounded-xl bg-foreground text-background text-xs font-bold active:scale-[0.95] transition-all shadow-lg shadow-black/5"
            >
              Відкрити список
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Newbie Follow-up */}
      <AnimatePresence>
        {newbiesAtRisk.length > 0 && !followupDismiss.dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -8 }}
            transition={prefersReduced ? { duration: 0 } : { ...SPRING, delay: 0.15 }}
            className="col-span-2 relative"
          >
            <button
              type="button"
              onClick={() => onSegmentSelect('newbie_danger')}
              aria-pressed={activeSegment === 'newbie_danger'}
              className={`w-full bento-card p-4 flex items-center gap-4 active:scale-[0.95] transition-all text-left ${activeSegment === 'newbie_danger' ? 'ring-2 ring-primary bg-primary/10' : 'bg-primary/5 border-primary/20'}`}
            >
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1 pr-6">
                <p className="text-sm font-bold text-foreground">Потрібен follow-up</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5 leading-tight">
                  {newbiesAtRisk.length} новачків не повернулися. Запропонуйте бонус!
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-foreground text-background">
                <MessageSquare size={16} />
              </div>
            </button>
            <button
              type="button"
              aria-label="Сховати"
              onClick={followupDismiss.dismiss}
              className="absolute top-2 right-2 z-10 p-1.5 rounded-lg text-muted-foreground/40 hover:text-muted-foreground/70 hover:bg-secondary/60 active:scale-[0.9] transition-all"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Average Check Details */}
      <Sheet open={showCheckDetails} onOpenChange={(v) => !v && setShowCheckDetails(false)} title="Середній чек">
        <AvgCheckModal clients={clients} analytics={analytics} isPro={isPro} onClose={() => setShowCheckDetails(false)} />
      </Sheet>

      {/* Referral Details */}
      <Sheet open={showReferralDetails} onOpenChange={(v) => !v && setShowReferralDetails(false)} title="Реферальна мережа">
        <div className="flex flex-col gap-6">
          {ambassadorData && ambassadorData.ambassadors.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-3xl bg-sage/5 border border-sage/10">
                  <p className="text-[10px] font-bold text-sage uppercase tracking-widest mb-1">Приведено</p>
                  <p className="text-3xl font-display font-bold text-foreground">{ambassadorData.totalReferrals}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">клієнтів</p>
                </div>
                <div className="p-4 rounded-3xl bg-sage/5 border border-sage/10">
                  <p className="text-[10px] font-bold text-sage uppercase tracking-widest mb-1">Дохід</p>
                  <p className="text-3xl font-display font-bold text-foreground">{formatPrice(ambassadorData.totalRevenue)}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">за весь час</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-sage" />
                  <h4 className="text-sm font-bold text-foreground">Топ амбасадори</h4>
                </div>

                <div className="space-y-2">
                  {ambassadorData.ambassadors.map((amb) => {
                    const isExpanded = expandedAmbassadorId === amb.id;
                    return (
                      <button
                        key={amb.id}
                        type="button"
                        onClick={() => setExpandedAmbassadorId(isExpanded ? null : amb.id)}
                        aria-expanded={isExpanded}
                        className={`w-full flex flex-col gap-3 p-3.5 rounded-xl border active:scale-[0.95] transition-all text-left ${isExpanded ? 'bg-secondary shadow-sm border-sage/30' : 'bg-secondary/60 border-border'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-sage/10 flex items-center justify-center text-sage font-bold text-xs">
                              {amb.name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">{amb.name}</p>
                              <p className="text-[10px] text-muted-foreground/60">
                                {amb.completedCount} {pluralUk(amb.completedCount, 'рекомендація', 'рекомендації', 'рекомендацій')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            {amb.revenue > 0 && (
                              <p className="text-sm font-bold text-sage">{formatPrice(amb.revenue)}</p>
                            )}
                            <ChevronRight size={14} className={`text-sage/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </div>

                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={SPRING}
                            className="pl-4 border-l-2 border-sage/10 space-y-2 py-1"
                          >
                            <p className="text-[9px] font-bold text-sage uppercase tracking-widest mb-1">Запрошені друзі:</p>
                            {amb.referrals.map((ref, j) => (
                              <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground/70">
                                <div className="size-1.5 rounded-full bg-sage/30" />
                                {ref.name} · {ref.date}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="size-14 rounded-2xl bg-sage/10 flex items-center justify-center">
                <Share2 size={24} className="text-sage/40" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Реферальна програма</p>
                <p className="text-xs text-muted-foreground/60 mt-1 max-w-[220px]">
                  Поки що немає активних амбасадорів. Поділіться посиланням із клієнтами — вони приведуть нових.
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowReferralDetails(false)}
            className="w-full py-4 rounded-xl bg-foreground text-background font-bold text-sm active:scale-[0.95] transition-all"
          >
            Зрозумів
          </button>
        </div>
      </Sheet>
    </div>
  );
}

// ── AvgCheckModal ─────────────────────────────────────────────────────────────
function AvgCheckModal({
  clients, analytics, isPro, onClose,
}: {
  clients: ClientRow[];
  analytics: ReturnType<typeof useAnalytics>['data'];
  isPro: boolean;
  onClose: () => void;
}) {
  const allTimeAvg = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.total_spent, 0) / clients.reduce((s, c) => s + c.total_visits, 0))
    : 0;

  const vipClients = clients.filter(c => c.is_vip);
  const vipAvg = vipClients.length > 0
    ? Math.round(vipClients.reduce((s, c) => s + c.total_spent, 0) / vipClients.reduce((s, c) => s + c.total_visits, 0))
    : null;
  const vipLift = vipAvg && allTimeAvg > 0 ? Math.round(((vipAvg - allTimeAvg) / allTimeAvg) * 100) : null;

  const oneTimers    = clients.filter(c => c.total_visits === 1);
  const oneTimerPct  = clients.length > 0 ? Math.round((oneTimers.length / clients.length) * 100) : 0;
  const belowAvg     = clients.filter(c => c.average_check < allTimeAvg * 0.8 && c.total_visits > 2);
  const potentialRevenue = belowAvg.length > 0
    ? Math.round(belowAvg.reduce((s, c) => s + (allTimeAvg * 0.8 - c.average_check) * c.total_visits * 0.1, 0))
    : 0;

  const monthAvg = analytics?.bento?.avgCheck;
  const topSvc   = analytics?.topServices?.[0];

  const deltaPositive = (monthAvg?.delta ?? 0) > 0;
  const deltaNeutral  = monthAvg?.delta === 0 || monthAvg?.delta === null;

  return (
    <div className="flex flex-col gap-5 pb-4">

      {isPro && monthAvg ? (
        <div className={`flex items-center justify-between p-5 rounded-3xl border ${
          deltaPositive ? 'bg-success/5 border-success/10' :
          deltaNeutral  ? 'bg-muted/20 border-muted/30' :
                          'bg-error/5 border-error/10'
        }`}>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
              deltaPositive ? 'text-success' : deltaNeutral ? 'text-muted-foreground' : 'text-error'
            }`}>
              {format(new Date(), 'LLLL yyyy')} vs попередній
            </p>
            <p className="text-3xl font-display font-bold text-foreground">
              {formatPrice(monthAvg.current)}
            </p>
            {monthAvg.prev !== null && (
              <p className={`text-[11px] mt-1 font-medium ${
                deltaPositive ? 'text-success' : deltaNeutral ? 'text-muted-foreground/60' : 'text-error'
              }`}>
                {deltaPositive ? '+' : ''}{monthAvg.delta}% vs {formatPrice(monthAvg.prev)} (попередній)
              </p>
            )}
          </div>
          {deltaPositive ? <TrendingUp size={40} className="text-success opacity-20" /> :
           deltaNeutral  ? <Minus size={40} className="text-muted-foreground opacity-20" /> :
                           <TrendingDown size={40} className="text-error opacity-20" />}
        </div>
      ) : (
        <div className="flex items-center justify-between p-5 rounded-3xl bg-accent/5 border border-accent/10">
          <div>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">Загальний</p>
            <p className="text-3xl font-display font-bold text-foreground">{formatPrice(allTimeAvg)}</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">середній чек за весь час</p>
          </div>
          <TrendingUp size={40} className="text-accent opacity-20" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {vipAvg !== null && vipLift !== null && (
          <div className="p-4 rounded-xl bg-secondary/60 border border-border">
            <div className="flex items-center gap-1.5 mb-2">
              <Crown size={13} className="text-warning" />
              <p className="text-[10px] font-bold text-warning uppercase tracking-widest">VIP-чек</p>
            </div>
            <p className="text-xl font-display font-bold text-foreground">{formatPrice(vipAvg)}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              {vipLift > 0 ? '+' : ''}{vipLift}% до середнього
            </p>
          </div>
        )}

        <div className="p-4 rounded-xl bg-secondary/60 border border-border">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertCircle size={13} className={oneTimerPct > 40 ? 'text-error' : 'text-muted-foreground/60'} />
            <p className={`text-[10px] font-bold uppercase tracking-widest ${oneTimerPct > 40 ? 'text-error' : 'text-muted-foreground/60'}`}>
              Разові
            </p>
          </div>
          <p className="text-xl font-display font-bold text-foreground">{oneTimerPct}%</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">клієнтів прийшли лише раз</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-accent" />
          <h4 className="text-sm font-bold text-foreground">Що робити далі</h4>
        </div>
        <div className="flex flex-col gap-2.5">
          {topSvc && (
            <InsightRow index={1} color="success">
              Топ-послуга <b>{topSvc.name}</b> — {topSvc.count} записів цього місяця.
              {topSvc.count > 3 ? ' Пропонуйте доповнення до неї — це +15–20% до чека без залучення нових клієнтів.' : ' Просуйте її активніше через інстаграм.'}
            </InsightRow>
          )}
          {vipLift !== null && vipLift > 0 && (
            <InsightRow index={topSvc ? 2 : 1} color="warning">
              VIP-клієнти приносять на <b>{vipLift}% більше</b> за візит. У вас {vipClients.length} {pluralUk(vipClients.length, 'VIP-клієнт', 'VIP-клієнти', 'VIP-клієнтів')} — зосередьтесь на їхньому поверненні.
            </InsightRow>
          )}
          {oneTimerPct > 30 && (
            <InsightRow index={(topSvc ? 1 : 0) + (vipLift && vipLift > 0 ? 1 : 0) + 1} color={oneTimerPct > 50 ? 'error' : 'primary'}>
              {oneTimerPct}% клієнтів не повернулися після першого візиту ({oneTimers.length} осіб).
              Автоматичне нагадування через 14 днів підвищує повернення на ~25%.
            </InsightRow>
          )}
          {belowAvg.length > 3 && potentialRevenue > 0 && (
            <InsightRow index={(topSvc ? 1 : 0) + (vipLift && vipLift > 0 ? 1 : 0) + (oneTimerPct > 30 ? 1 : 0) + 1} color="primary">
              {belowAvg.length} постійних клієнтів мають чек нижче {Math.round(allTimeAvg * 0.8)}₴.
              Точкові пропозиції для них можуть додати ~{formatPrice(potentialRevenue)} на місяць.
            </InsightRow>
          )}
          {!topSvc && vipClients.length === 0 && oneTimerPct <= 30 && (
            <InsightRow index={1} color="primary">
              Додайте перших VIP-клієнтів — це розблокує персоналізовані рекомендації для зростання чека.
            </InsightRow>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full py-4 rounded-xl bg-foreground text-background font-bold text-sm active:scale-[0.95] transition-all"
      >
        Зрозумів
      </button>
    </div>
  );
}

function InsightRow({ index, color, children }: { index: number; color: string; children: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    error:   'bg-error/15 text-error',
    primary: 'bg-accent/15 text-accent',
  };
  return (
    <div className="flex gap-3 p-3.5 rounded-xl bg-secondary/60 border border-border">
      <div className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${colorMap[color] ?? colorMap.primary}`}>
        {index}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}
