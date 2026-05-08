'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, Star, AlertCircle, Zap, MessageSquare, ChevronRight, Share2, Sparkles } from 'lucide-react';
import { formatPrice } from '@/components/master/services/types';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { ClientRow } from './ClientsPage';
import { RETENTION_CONFIG } from './ClientsPage';
import { pluralUk } from '@/lib/utils/pluralUk';

interface ClientWidgetsProps {
  clients: ClientRow[];
  isLoading: boolean;
  onSegmentSelect: (segmentId: string) => void;
  activeSegment: string;
}

export function ClientWidgets({ clients, isLoading, onSegmentSelect, activeSegment }: ClientWidgetsProps) {
  const [showCheckDetails, setShowCheckDetails] = useState(false);
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

  // 3. Smart Alerts
  const sortedBySpend = [...clients].sort((a, b) => b.total_spent - a.total_spent);
  const top20Count = Math.max(1, Math.floor(clients.length * 0.2));
  const topClients = sortedBySpend.slice(0, top20Count);
  const lostTreasures = topClients.filter(c => c.retention_status === 'at_risk' || c.retention_status === 'lost');

  // Newbies at Risk
  const newbiesAtRisk = clients.filter(c => c.total_visits === 1 && c.retention_status === 'at_risk');

  // Top Referrers (Mock logic for now - clients with high visits are often referrers)
  const topReferrers = [...clients].sort((a, b) => b.total_visits - a.total_visits).slice(0, 3);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 1. Retention Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-2 bento-card p-5 relative overflow-hidden group cursor-pointer"
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
              className={`p-2 rounded-2xl transition-all ${activeSegment === item.id ? 'ring-2 ring-inset ring-foreground/10 bg-white/60' : 'hover:bg-white/40'}`}
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
        className="bento-card p-4 flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow"
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
        className="bento-card p-4 flex flex-col justify-between cursor-pointer relative overflow-hidden group/widget touch-pan-y active:scale-[0.98] transition-all"
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
              className={`size-1.5 rounded-full transition-all ${widgetIndex === i ? 'w-4 bg-foreground' : 'bg-foreground/20 hover:bg-foreground/40'}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
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
       {lostCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-2 p-5 rounded-[32px] bg-secondary/30 border border-secondary/50 flex flex-col items-center text-center gap-3 relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Zap size={80} />
             </div>
             <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-muted-foreground shadow-sm">
                <Users size={20} className="opacity-40" />
             </div>
             <div>
                <h4 className="text-sm font-bold text-foreground">Пора почистити базу</h4>
                <p className="text-xs text-muted-foreground/60 mt-1 max-w-[240px]">
                   У вас {lostCount} {pluralUk(lostCount, 'клієнт', 'клієнти', 'клієнтів')} у глибокому відтоку. 
                   Архівуйте їх, щоб бачити тільки актуальні дані.
                </p>
             </div>
             <button 
                onClick={() => onSegmentSelect('lost')}
                className="px-6 py-2.5 rounded-2xl bg-foreground text-background text-xs font-bold active:scale-95 transition-all shadow-lg shadow-black/5"
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
           className={`col-span-2 bento-card p-4 flex items-center gap-4 transition-all cursor-pointer ${activeSegment === 'newbie_danger' ? 'ring-2 ring-primary bg-primary/10' : 'bg-primary/5 border-primary/20'}`}
         >
           <div className="p-3 rounded-2xl bg-primary/10 text-primary">
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
       <BottomSheet isOpen={showCheckDetails} onClose={() => setShowCheckDetails(false)} title="Аналіз середнього чека">
          <div className="flex flex-col gap-6">
             <div className="flex items-center justify-between p-5 rounded-3xl bg-success/5 border border-success/10">
                <div>
                   <p className="text-xs font-bold text-success uppercase tracking-widest mb-1">Динаміка</p>
                   <p className="text-3xl font-display font-bold text-foreground">+4.2%</p>
                   <p className="text-[11px] text-muted-foreground/60 mt-1">порівняно з минулим місяцем</p>
                </div>
                <TrendingUp size={40} className="text-success opacity-20" />
             </div>

             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <Sparkles size={18} className="text-warning" />
                   <h4 className="text-sm font-bold text-foreground">AI Порада</h4>
                </div>
                
                <div className="p-4 rounded-2xl bg-white/60 border border-white/80 space-y-3">
                   <div className="flex gap-3">
                      <div className="size-6 rounded-full bg-success/20 flex items-center justify-center text-[10px] font-bold text-success shrink-0">1</div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
          Ваш середній чек зріс на 4.2% завдяки популярності послуги "Складне фарбування". 
          Рекомендуємо додати "Догляд за волоссям" як cross-sell позицію до цього запису — 
          це потенційно додасть ще +15% до чека без залучення нових клієнтів.
        </p>
                   </div>
                   <div className="flex gap-3">
                      <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">2</div>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                         Клієнти сегменту <b>Potential VIP</b> мають середній чек на 15% вищий. Фокусуйтеся на їхньому утриманні.
                      </p>
                   </div>
                </div>
             </div>

             <button 
                onClick={() => setShowCheckDetails(false)}
                className="w-full py-4 rounded-2xl bg-foreground text-background font-bold text-sm active:scale-95 transition-all"
             >
                Зрозумів
             </button>
          </div>
       </BottomSheet>

       {/* Referral Details Sheet */}
       <BottomSheet isOpen={showReferralDetails} onClose={() => setShowReferralDetails(false)} title="Реферальна мережа">
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
                           className={`flex flex-col gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${isExpanded ? 'bg-white shadow-sm border-sage/30' : 'bg-white/60 border-white/80'}`}
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
                className="w-full py-4 rounded-2xl bg-foreground text-background font-bold text-sm active:scale-95 transition-all"
             >
                Зрозумів
             </button>
          </div>
       </BottomSheet>
    </div>
  );
}
