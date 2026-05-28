'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, TrendingDown, Minus, Star, AlertCircle, Zap, MessageSquare, ChevronRight, Share2, Sparkles, Crown, Target } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { formatPrice } from '@/components/master/services/types';
import { PopUpModal } from '@/components/ui/PopUpModal';
import type { ClientRow } from './ClientsPage';
import { RETENTION_CONFIG } from './ClientsPage';
import { useMasterContext } from '@/lib/supabase/context';
import { useAnalytics } from '@/lib/supabase/hooks/useAnalytics';
import { pluralUk } from '@/lib/utils/pluralUk';

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
  const [widgetIndex, setWidgetIndex] = useState(0); // 0: Lost Treasures, 1: Top Referrers

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 h-32 skeleton-shimmer rounded-3xl" />
        <div className="h-28 skeleton-shimmer rounded-3xl" />
        <div className="h-28 skeleton-shimmer rounded-3xl" />
      </div>
    );
  }

  // 1. Retention Stats
  const activeCount   = clients.filter(c => c.retention_status === 'active').length;
  const sleepingCount = clients.filter(c => c.retention_status === 'sleeping').length;
  const atRiskCount   = clients.filter(c => c.retention_status === 'at_risk').length;
  const lostCount     = clients.filter(c => c.retention_status === 'lost').length;

  // 2. Revenue Stats
  const totalRevenue = clients.reduce((s, c) => s + c.total_spent, 0);
  const avgCheck     = clients.length > 0 ? totalRevenue / clients.length : 0;

  // 3. Smart Alerts — VIP під загрозою: тільки реальні VIP-клієнти з ризиком відтоку
  const lostTreasures = clients.filter(c => c.is_vip && (c.retention_status === 'at_risk' || c.retention_status === 'lost'));

  // Newbies at Risk
  const newbiesAtRisk = clients.filter(c => c.total_visits === 1 && c.retention_status === 'at_risk');

  // Top Referrers
  const topReferrers = [...clients].sort((a, b) => b.total_visits - a.total_visits).slice(0, 3);

  // Cleanup Logic: Master Cycle * 2
  const cycle = masterProfile?.retention_cycle_days || 60;
  const archiveThreshold = new Date();
  archiveThreshold.setDate(archiveThreshold.getDate() - (cycle * 2));
  
  const archiveCount = clients.filter(c => {
    if (!c.last_visit_at) return false;
    return new Date(c.last_visit_at) < archiveThreshold;
  }).length;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 1. Retention Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-2 bento-card p-5 relative overflow-hidden group cursor-pointer active:scale-[0.95] transition-all duration-100"
        onClick={() => onSegmentSelect('all')}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Утримання бази</p>
            <h3 className="text-2xl font-display font-bold text-foreground">
              {Math.round((activeCount / clients.length) * 100 || 0)}%
              <span className="text-xs font-medium text-muted-foreground/40 ml-2">здоровий стан</span>
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
            { id: 'active',   label: 'Активні',   count: activeCount,   color: RETENTION_CONFIG.active.color, bg: RETENTION_CONFIG.active.bg },
            { id: 'sleeping',  label: 'Дрімають',  count: sleepingCount, color: RETENTION_CONFIG.sleeping.color, bg: RETENTION_CONFIG.sleeping.bg },
            { id: 'at_risk',   label: 'У ризику', count: atRiskCount,   color: RETENTION_CONFIG.at_risk.color, bg: RETENTION_CONFIG.at_risk.bg },
            { id: 'lost',      label: 'Втрачені',  count: lostCount,     color: RETENTION_CONFIG.lost.color, bg: RETENTION_CONFIG.lost.bg },
          ].map(item => (
            <div 
              key={item.label}
              onClick={(e) => { e.stopPropagation(); onSegmentSelect(item.id); }}
              className={`p-2 rounded-xl active:scale-[0.88] cursor-pointer transition-all ${activeSegment === item.id ? 'ring-2 ring-inset ring-foreground/10 bg-secondary/60' : 'hover:bg-secondary/40'}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                 <span className="size-1.5 rounded-full" style={{ background: item.color }} />
                 <p className="text-[13px] font-bold text-foreground leading-none">{item.count}</p>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/60">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 2. Average Check / Revenue Insights */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bento-card p-4 flex flex-col justify-between cursor-pointer hover:shadow-md active:scale-[0.95] transition-all duration-100"
        onClick={() => setShowCheckDetails(true)}
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Середній чек</p>
          <TrendingUp size={14} className="text-primary/40" />
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold text-foreground whitespace-nowrap">
            {formatPrice(avgCheck)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-success">
            <TrendingUp size={10} />
            <span>+4.2%</span>
            <span className="text-muted-foreground/40 font-normal ml-0.5">цього місяця</span>
          </div>
        </div>
      </motion.div>

      {/* 3. iOS Style Switcher: Important / Referrers */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x > 50) setWidgetIndex(0);
          else if (info.offset.x < -50) setWidgetIndex(1);
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bento-card p-4 flex flex-col justify-between cursor-pointer relative overflow-hidden group/widget touch-pan-y active:scale-[0.95] transition-all"
        onClick={() => {
          if (widgetIndex === 1) {
            setShowReferralDetails(true);
          } else {
             if (lostTreasures.length > 0) onSegmentSelect('lost_treasures');
             else onSegmentSelect('potential_vip');
          }
        }}
      >
        {/* Switcher Dots */}
        <div className="absolute top-4 right-4 flex gap-1.5 z-10">
          {[0, 1].map(i => (
            <button 
              key={i}
              onClick={(e) => { e.stopPropagation(); setWidgetIndex(i); }}
              className={`size-1.5 rounded-full cursor-pointer active:scale-[0.88] transition-all ${widgetIndex === i ? 'w-4 bg-foreground' : 'bg-foreground/20 hover:bg-foreground/40'}`}
            />
          ))}
        </div>

        <AnimatePresence mode="popLayout">
          {widgetIndex === 0 ? (
            <motion.div
              key="treasures"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
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
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="h-full flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-sage/20 text-sage">
                  <Share2 size={14} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Амбасадори</p>
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-sage">{topReferrers.length}</p>
                <p className="text-[10px] text-sage/70 mt-1 font-medium italic">топ-реферали</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

       {/* 4. Smart Action: Cleanup Wizard */}
       {archiveCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-2 p-5 rounded-xl bg-secondary/30 border border-secondary/50 flex flex-col items-center text-center gap-3 relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Zap size={80} />
             </div>
             <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground shadow-sm">
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
                onClick={() => onSegmentSelect('archive_cleanup')}
                className="px-6 py-2.5 rounded-xl bg-foreground text-background text-xs font-bold active:scale-[0.95] cursor-pointer transition-all shadow-lg shadow-black/5"
             >
                Відкрити список
             </button>
          </motion.div>
       )}

       {/* 5. Smart Action: Follow-up */}
       {newbiesAtRisk.length > 0 && (
         <motion.div
           initial={{ opacity: 0, y: 12 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.15 }}
           onClick={() => onSegmentSelect('newbie_danger')}
           className={`col-span-2 bento-card p-4 flex items-center gap-4 active:scale-[0.95] transition-all cursor-pointer ${activeSegment === 'newbie_danger' ? 'ring-2 ring-primary bg-primary/10' : 'bg-primary/5 border-primary/20'}`}
         >
           <div className="p-3 rounded-xl bg-primary/10 text-primary">
             <AlertCircle size={20} />
           </div>
           <div className="flex-1">
             <p className="text-sm font-bold text-foreground">Потрібен follow-up</p>
             <p className="text-xs text-muted-foreground/70 mt-0.5 leading-tight">
               {newbiesAtRisk.length} новачків не повернулися. Запропонуйте бонус!
             </p>
           </div>
           <div className="p-2.5 rounded-xl bg-foreground text-background">
              <MessageSquare size={16} />
           </div>
         </motion.div>
       )}

       {/* Average Check Details Sheet */}
       <PopUpModal isOpen={showCheckDetails} onClose={() => setShowCheckDetails(false)} title="Середній чек">
          <AvgCheckModal clients={clients} analytics={analytics} isPro={isPro} onClose={() => setShowCheckDetails(false)} />
       </PopUpModal>

       {/* Referral Details Sheet */}
       <PopUpModal isOpen={showReferralDetails} onClose={() => setShowReferralDetails(false)} title="Реферальна мережа">
          <div className="flex flex-col gap-6">
             <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-3xl bg-sage/5 border border-sage/10">
                   <p className="text-[10px] font-bold text-sage uppercase tracking-widest mb-1">Приведено</p>
                   <p className="text-3xl font-display font-bold text-foreground">12</p>
                   <p className="text-[10px] text-muted-foreground/40 mt-1">клієнтів</p>
                </div>
                <div className="p-4 rounded-3xl bg-sage/5 border border-sage/10">
                   <p className="text-[10px] font-bold text-sage uppercase tracking-widest mb-1">Дохід</p>
                   <p className="text-3xl font-display font-bold text-foreground">8.4к</p>
                   <p className="text-[10px] text-muted-foreground/40 mt-1">₴ за весь час</p>
                </div>
             </div>

             <div className="space-y-3">
                <div className="flex items-center gap-3">
                   <Users size={16} className="text-sage" />
                   <h4 className="text-sm font-bold text-foreground">Топ амбасадори</h4>
                </div>
                
                <div className="space-y-2">
                   {[
                      { id: '1', name: 'Олена Коваль', count: 4, revenue: '3.2к ₴', friends: ['Ігор О. · 12.04', 'Світлана Д. · 05.05', 'Ольга К. · 20.02', 'Максим Р. · 01.01'] },
                      { id: '2', name: 'Марія Сидоренко', count: 3, revenue: '2.1к ₴', friends: ['Антон П. · 10.03', 'Юлія С. · 15.04', 'Дмитро В. · 02.05'] },
                      { id: '3', name: 'Анна Павлова', count: 2, revenue: '1.4к ₴', friends: ['Наталія Л. · 11.01', 'Сергій М. · 22.03'] },
                   ].map((adv) => {
                      const isExpanded = expandedAmbassadorId === adv.id;
                      return (
                         <div 
                           key={adv.id} 
                           onClick={() => setExpandedAmbassadorId(isExpanded ? null : adv.id)}
                           className={`flex flex-col gap-3 p-3.5 rounded-xl border active:scale-[0.95] transition-all cursor-pointer ${isExpanded ? 'bg-secondary shadow-sm border-sage/30' : 'bg-secondary/60 border-border'}`}
                         >
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-sage/10 flex items-center justify-center text-sage font-bold text-xs">
                                     {adv.name[0]}
                                  </div>
                                  <div>
                                     <p className="text-sm font-bold text-foreground">{adv.name}</p>
                                     <p className="text-[10px] text-muted-foreground/60">{adv.count} рекомендації</p>
                                  </div>
                               </div>
                               <div className="text-right flex items-center gap-2">
                                  <p className="text-sm font-bold text-sage">{adv.revenue}</p>
                                  <ChevronRight size={14} className={`text-sage/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                               </div>
                            </div>
                            
                            {isExpanded && (
                               <motion.div 
                                 initial={{ opacity: 0, height: 0 }}
                                 animate={{ opacity: 1, height: 'auto' }}
                                 className="pl-4 border-l-2 border-sage/10 space-y-2 py-1"
                                >
                                  <p className="text-[9px] font-bold text-sage uppercase tracking-widest mb-1">Запрошені друзі:</p>
                                  {adv.friends.map((friend, j) => (
                                     <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground/70">
                                        <div className="w-1.5 h-1.5 rounded-full bg-sage/30" />
                                        {friend}
                                     </div>
                                  ))}
                               </motion.div>
                            )}
                         </div>
                      );
                   })}
                </div>
             </div>

             <button
                onClick={() => setShowReferralDetails(false)}
                className="w-full py-4 rounded-xl bg-foreground text-background font-bold text-sm active:scale-[0.95] cursor-pointer transition-all"
             >
                Зрозумів
             </button>
          </div>
       </PopUpModal>
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
  // All-time stats from clients array (always available)
  const allTimeAvg = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.total_spent, 0) / clients.reduce((s, c) => s + c.total_visits, 0))
    : 0;

  const vipClients = clients.filter(c => c.is_vip);
  const vipAvg = vipClients.length > 0
    ? Math.round(vipClients.reduce((s, c) => s + c.total_spent, 0) / vipClients.reduce((s, c) => s + c.total_visits, 0))
    : null;
  const vipLift = vipAvg && allTimeAvg > 0 ? Math.round(((vipAvg - allTimeAvg) / allTimeAvg) * 100) : null;

  const oneTimers = clients.filter(c => c.total_visits === 1);
  const oneTimerPct = clients.length > 0 ? Math.round((oneTimers.length / clients.length) * 100) : 0;

  const belowAvg = clients.filter(c => c.average_check < allTimeAvg * 0.8 && c.total_visits > 2);
  const potentialRevenue = belowAvg.length > 0
    ? Math.round(belowAvg.reduce((s, c) => s + (allTimeAvg * 0.8 - c.average_check) * c.total_visits * 0.1, 0))
    : 0;

  // Monthly analytics (Pro only)
  const monthAvg = analytics?.bento?.avgCheck;
  const topSvc = analytics?.topServices?.[0];

  const deltaPositive = (monthAvg?.delta ?? 0) > 0;
  const deltaNeutral  = monthAvg?.delta === 0 || monthAvg?.delta === null;

  return (
    <div className="flex flex-col gap-5 pb-4">

      {/* Month comparison — Pro */}
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

      {/* Insights grid */}
      <div className="grid grid-cols-2 gap-3">

        {/* VIP lift */}
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

        {/* One-time retention risk */}
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

      {/* Dynamic recommendations */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-accent" />
          <h4 className="text-sm font-bold text-foreground">Що робити далі</h4>
        </div>
        <div className="flex flex-col gap-2.5">

          {/* Top service upsell (Pro) */}
          {topSvc && (
            <InsightRow index={1} color="success">
              Топ-послуга <b>{topSvc.name}</b> — {topSvc.count} записів цього місяця.
              {topSvc.count > 3 ? ' Пропонуйте доповнення до неї — це +15–20% до чека без залучення нових клієнтів.' : ' Просуйте її активніше через інстаграм.'}
            </InsightRow>
          )}

          {/* VIP focus */}
          {vipLift !== null && vipLift > 0 && (
            <InsightRow index={topSvc ? 2 : 1} color="warning">
              VIP-клієнти приносять на <b>{vipLift}% більше</b> за візит. У вас {vipClients.length} {pluralUk(vipClients.length, 'VIP-клієнт', 'VIP-клієнти', 'VIP-клієнтів')} — зосередьтесь на їхньому поверненні.
            </InsightRow>
          )}

          {/* One-timer conversion */}
          {oneTimerPct > 30 && (
            <InsightRow index={(topSvc ? 1 : 0) + (vipLift && vipLift > 0 ? 1 : 0) + 1} color={oneTimerPct > 50 ? 'error' : 'primary'}>
              {oneTimerPct}% клієнтів не повернулися після першого візиту ({oneTimers.length} осіб).
              Автоматичне нагадування через 14 днів підвищує повернення на ~25%.
            </InsightRow>
          )}

          {/* Below avg upsell */}
          {belowAvg.length > 3 && potentialRevenue > 0 && (
            <InsightRow index={(topSvc ? 1 : 0) + (vipLift && vipLift > 0 ? 1 : 0) + (oneTimerPct > 30 ? 1 : 0) + 1} color="primary">
              {belowAvg.length} постійних клієнтів мають чек нижче {Math.round(allTimeAvg * 0.8)}₴.
              Точкові пропозиції для них можуть додати ~{formatPrice(potentialRevenue)} на місяць.
            </InsightRow>
          )}

          {/* Generic fallback if no specific insights */}
          {!topSvc && vipClients.length === 0 && oneTimerPct <= 30 && (
            <InsightRow index={1} color="primary">
              Додайте перших VIP-клієнтів — це розблокує персоналізовані рекомендації для зростання чека.
            </InsightRow>
          )}
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full py-4 rounded-xl bg-foreground text-background font-bold text-sm active:scale-[0.95] cursor-pointer transition-all"
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
