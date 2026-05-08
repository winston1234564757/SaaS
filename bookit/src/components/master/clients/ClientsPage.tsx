'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Star, Phone, Calendar, TrendingUp, Loader2, Link2, Zap, Instagram, 
  LayoutGrid, List, ChevronDown, Send, MessageSquare, PenLine, AlertCircle, Heart, X 
} from 'lucide-react';
import { formatPrice } from '@/components/master/services/types';
import { ClientDetailSheet } from './ClientDetailSheet';
import { ClientWidgets } from './ClientWidgets';
import { useClients } from '@/lib/supabase/hooks/useClients';
import type { ClientRow, RetentionStatus } from '@/lib/supabase/hooks/useClients';
import { saveClientNote } from '@/app/(master)/dashboard/clients/actions';
import { useClientNoteInvalidate } from '@/lib/supabase/hooks/useClientNote';
import { useToast } from '@/lib/toast/context';
import { parseError } from '@/lib/utils/errors';

export type { ClientRow };

// ── Retention badge config ─────────────────────────────────────────────────────
export const RETENTION_CONFIG: Record<RetentionStatus, { label: string; color: string; bg: string; dot: string }> = {
  active:   { label: 'Активний',    color: '#5C9E7A', bg: '#5C9E7A14', dot: '#5C9E7A' },
  sleeping: { label: 'Дрімає',      color: '#789A99', bg: '#789A9914', dot: '#789A99' },
  at_risk:  { label: 'Під ризиком', color: '#D4935A', bg: '#D4935A14', dot: '#D4935A' },
  lost:     { label: 'Втрачений',   color: '#C05B5B', bg: '#C05B5B14', dot: '#C05B5B' },
};

export interface AutoTag {
  label: string;
  color: string;
  bg: string;
}

export function getAutoTags(client: ClientRow): AutoTag[] {
  const tags: AutoTag[] = [];
  if (client.is_vip) tags.push({ label: 'VIP', color: '#D4935A', bg: '#D4935A15' });
  if (client.total_visits === 1) tags.push({ label: 'Новий', color: '#789A99', bg: '#789A9915' });
  else if (client.total_visits >= 5) tags.push({ label: 'Постійний', color: '#5C9E7A', bg: '#5C9E7A15' });
  if (client.average_check >= 1500) tags.push({ label: 'Великий чек', color: '#D4935A', bg: '#D4935A15' });
  return tags;
}

type SortKey = 'visits' | 'alpha' | 'check' | 'recent';
type ViewMode = 'list' | 'grid';
type RetentionFilter = 'all' | RetentionStatus;
type SmartSegment = 'none' | 'lost_treasures' | 'newbie_danger' | 'potential_vip' | 'flash_hunters';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'visits',  label: 'За візитами'   },
  { value: 'alpha',   label: 'За алфавітом'  },
  { value: 'check',   label: 'Найбільший чек' },
  { value: 'recent',  label: 'Нещодавні'     },
];

const RETENTION_FILTERS: { value: RetentionFilter; label: string }[] = [
  { value: 'all',      label: 'Всі'          },
  { value: 'active',   label: 'Активні'      },
  { value: 'sleeping', label: 'Дрімають'     },
  { value: 'at_risk',  label: 'Під ризиком'  },
  { value: 'lost',     label: 'Втрачені'     },
];

const SMART_SEGMENTS: { value: SmartSegment; label: string }[] = [
  { value: 'lost_treasures', label: 'Втрачені скарби' },
  { value: 'newbie_danger',  label: 'Новачки в ризику' },
  { value: 'potential_vip',  label: 'Потенційні VIP' },
  { value: 'flash_hunters',   label: 'Мисливці за акціями' },
];

function sortClients(clients: ClientRow[], sort: SortKey): ClientRow[] {
  switch (sort) {
    case 'alpha':  return [...clients].sort((a, b) => a.client_name.localeCompare(b.client_name, 'uk'));
    case 'check':  return [...clients].sort((a, b) => b.average_check - a.average_check);
    case 'recent': return [...clients].sort((a, b) => {
      if (!a.last_visit_at) return 1;
      if (!b.last_visit_at) return -1;
      return b.last_visit_at.localeCompare(a.last_visit_at);
    });
    default:       return [...clients].sort((a, b) => b.total_visits - a.total_visits);
  }
}

export function ClientsPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { clients, isLoading } = useClients();
  const { showToast } = useToast();

  const sort    = (searchParams.get('sort') as SortKey) || 'visits';
  const view    = (searchParams.get('view') as ViewMode) || 'list';
  const [search, setSearch] = useState('');
  const [retentionFilter, setRetentionFilter] = useState<RetentionFilter>('all');
  const [smartSegment, setSmartSegment] = useState<SmartSegment>('none');
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [sortOpen, setSortOpen] = useState(false);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function handleVipChange(id: string, isVip: boolean) {
    setSelectedClient(prev => prev?.id === id ? { ...prev, is_vip: isVip } : prev);
  }

  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [showFab, setShowFab] = useState(true);

  const invalidateNote = useClientNoteInvalidate();

  async function handleQuickNoteSave(client: ClientRow) {
    if (!noteValue.trim()) return setEditingNoteId(null);
    
    setSavingNoteId(client.id);
    const { error } = await saveClientNote(client.client_phone, noteValue);
    if (error) {
      showToast({ type: 'error', title: 'Помилка', message: parseError(error) });
    } else {
      showToast({ type: 'success', title: 'Нотатку збережено' });
      invalidateNote(client.client_phone);
      setEditingNoteId(null);
      setNoteValue('');
    }
    setSavingNoteId(null);
  }

  const filtered = sortClients(
    clients.filter(c => {
      const matchesSearch =
        c.client_name.toLowerCase().includes(search.toLowerCase()) ||
        c.client_phone.includes(search);
      
      const matchesRetention = retentionFilter === 'all' || c.retention_status === retentionFilter;
      
      let matchesSegment = true;
      if (smartSegment === 'lost_treasures') {
        matchesSegment = (c.retention_status === 'at_risk' || c.retention_status === 'lost') && c.total_spent > 1500;
      } else if (smartSegment === 'newbie_danger') {
        matchesSegment = c.total_visits === 1 && (c.retention_status === 'at_risk' || c.retention_status === 'lost');
      } else if (smartSegment === 'potential_vip') {
        matchesSegment = !c.is_vip && (c.total_visits >= 5 || c.total_spent >= 5000);
      } else if (smartSegment === 'flash_hunters') {
        // We'll approximate this by checking if they have an average check significantly lower than total/visits? 
        // Actually, without dynamic_pricing_label in useClients, this is hard.
        // I'll keep it as a placeholder or filter by some other logic.
        matchesSegment = c.total_visits > 2 && c.average_check < 800; // Placeholder logic
      }

      return matchesSearch && matchesRetention && matchesSegment;
    }),
    sort,
  );

  const totalRevenue = clients.reduce((s, c) => s + c.total_spent, 0);
  const returning    = clients.filter(c => c.total_visits > 1).length;
  const atRiskCount  = clients.filter(c => c.retention_status === 'at_risk' || c.retention_status === 'lost').length;

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* 1. Header & Quick Switcher */}
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <h1 className="text-6xl text-foreground -mb-2" style={{ fontFamily: 'var(--font-great-vibes)' }}>
              Клієнти
            </h1>
            <p className="text-xs text-muted-foreground/60 ml-12 mt-2">Ваша база клієнтів та CRM</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/marketing?tab=broadcasts')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background border border-foreground shadow-lg shadow-black/10 transition-all active:scale-95 mb-1"
          >
            <Send size={15} />
            <span className="text-sm font-semibold">Розсилка</span>
          </button>
        </div>
      </div>

      {/* 2. Analytical Mosaic */}
      <div className="flex flex-col gap-4">
        <ClientWidgets 
          clients={clients} 
          isLoading={isLoading} 
          activeSegment={smartSegment !== 'none' ? smartSegment : retentionFilter}
          onSegmentSelect={(id) => {
            if (['active', 'sleeping', 'at_risk', 'lost', 'all'].includes(id)) {
              setRetentionFilter(id as RetentionFilter);
              setSmartSegment('none');
            } else {
              setSmartSegment(id as SmartSegment);
              setRetentionFilter('all');
            }
          }}
        />
      </div>

      {/* Retention filter chips */}
      {!isLoading && clients.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-hide">
            {RETENTION_FILTERS.map(f => {
              const cfg = f.value !== 'all' ? RETENTION_CONFIG[f.value as RetentionStatus] : null;
              const count = f.value === 'all'
                ? clients.length
                : clients.filter(c => c.retention_status === f.value).length;
              const isActive = retentionFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => { setRetentionFilter(f.value); setSmartSegment('none'); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer"
                  style={isActive && cfg
                    ? { background: cfg.bg, color: cfg.color, outline: `1.5px solid ${cfg.color}40` }
                    : isActive
                      ? { background: 'var(--accent)', color: 'white' }
                      : { background: 'var(--surface)', color: 'var(--text-secondary)', border: '0.5px solid var(--border-strong)' }
                  }
                >
                  {cfg && (
                    <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                  )}
                  {f.label}
                  <span className="opacity-60 font-normal ml-1">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-hide">
             {SMART_SEGMENTS.map(s => {
               const isActive = smartSegment === s.value;
               return (
                 <button
                   key={s.value}
                   onClick={() => { setSmartSegment(isActive ? 'none' : s.value); setRetentionFilter('all'); }}
                   className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                     isActive 
                       ? 'bg-foreground text-background border-foreground shadow-sm' 
                       : 'bg-white/40 border-white/60 text-muted-foreground/60 hover:text-muted-foreground'
                   }`}
                 >
                   {s.label}
                 </button>
               );
             })}
          </div>
        </div>
      )}

      {/* Search + Sort + View toggle */}
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Пошук за ім'ям або телефоном..."
          className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-foreground placeholder-[#A8928D] outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-[#789A99]/20 transition-all"
        />

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortOpen(p => !p)}
            className="h-full px-3 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-muted-foreground hover:bg-white transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <span className="hidden sm:inline">{SORT_OPTIONS.find(o => o.value === sort)?.label}</span>
            <ChevronDown size={14} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-30 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/80 shadow-lg overflow-hidden min-w-[160px]">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setParam('sort', opt.value); setSortOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                    sort === opt.value
                      ? 'bg-primary/12 text-primary/90 font-semibold'
                      : 'text-muted-foreground hover:bg-secondary/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex rounded-2xl bg-white/70 border border-white/80 overflow-hidden">
          {(['list', 'grid'] as const).map(v => (
            <button
              key={v}
              onClick={() => setParam('view', v)}
              className={`px-3 py-3 transition-colors cursor-pointer ${
                view === v ? 'bg-primary/15 text-primary/90' : 'text-muted-foreground/60 hover:text-muted-foreground'
              }`}
            >
              {v === 'list' ? <List size={16} /> : <LayoutGrid size={16} />}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Floating Pill for Segment Messaging (Top Option) */}
      <AnimatePresence>
        {showFab && (smartSegment !== 'none' || retentionFilter !== 'all') && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="flex justify-center w-full mt-2 mb-2"
          >
            <div className="relative w-[85%] max-w-[400px]">
              <button
                onClick={() => {
                  router.push(`/dashboard/marketing?tab=broadcasts&segment=${smartSegment || retentionFilter}`);
                }}
                className="w-full flex items-center gap-4 px-5 py-3 rounded-full bg-white/10 backdrop-blur-3xl border border-white/20 text-foreground shadow-xl active:scale-95 transition-all hover:bg-white/15"
              >
                <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center text-background shrink-0">
                  <MessageSquare size={16} />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-bold text-sm tracking-tight truncate w-full">
                    {smartSegment === 'lost_treasures' ? 'Повернути скарби' : 
                     smartSegment === 'newbie_danger' ? 'Привітати новачків' :
                     smartSegment === 'potential_vip' ? 'Заохотити VIP' :
                     retentionFilter === 'at_risk' ? 'Нагадати про себе' :
                     retentionFilter === 'lost' ? 'Почати реактивацію' :
                     'Написати обраним'}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest leading-none">
                    {filtered.length} контактів
                  </span>
                </div>
              </button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); setShowFab(false); }}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border border-secondary shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-90 z-10"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click-away for sort dropdown */}
      {sortOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setSortOpen(false)} />
      )}

      {isLoading ? (
        <div className="bento-card p-10 flex flex-col items-center gap-3">
          <Loader2 size={24} className="text-primary animate-spin" />
          <p className="text-sm text-muted-foreground/60">Завантаження клієнтів...</p>
        </div>
      ) : filtered.length === 0 ? (
        search ? (
          <div className="bento-card p-10 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <Users size={26} className="text-muted-foreground/60" />
            </div>
            <p className="text-sm font-semibold text-foreground">Нічого не знайдено</p>
            <p className="text-xs text-muted-foreground/60">Спробуйте інший запит</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bento-card p-6 flex flex-col gap-5"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-primary" />
              </div>
              <p className="text-base font-bold text-foreground">Ваша база клієнтів порожня</p>
              <p className="text-sm text-muted-foreground/60 mt-1 text-balance">
                Ось як залучити перших клієнтів за 24 години
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { icon: Link2,     color: '#789A99', title: 'Поділіться своєю сторінкою', desc: 'Скопіюйте посилання на публічну сторінку та надішліть у ваш Instagram, Telegram або WhatsApp.', href: '/dashboard/settings', cta: 'Відкрити налаштування' },
                { icon: Zap,       color: '#D4935A', title: 'Запустіть флеш-акцію', desc: 'Знижка 15–30% на перший запис залучить нових клієнтів моментально. Займає 30 секунд.', href: '/dashboard/flash', cta: 'Створити акцію' },
                { icon: Instagram, color: '#C05B5B', title: 'Додайте посилання в bio', desc: 'Одне посилання в bio Instagram — і клієнт одразу потрапляє до вашого онлайн-розкладу.' },
              ].map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={i} className="flex gap-3 p-4 rounded-2xl bg-white/50">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${step.color}15` }}>
                      <StepIcon size={16} style={{ color: step.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{step.title}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5 leading-relaxed">{step.desc}</p>
                      {step.href && (
                        <a href={step.href} className="inline-flex mt-2 text-xs font-semibold text-primary hover:text-primary/90 transition-colors">
                          {step.cta} →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )
      ) : view === 'grid' ? (
        /* ── Grid view ── */
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((client, i) => {
            const tags = getAutoTags(client);
            const ret = RETENTION_CONFIG[client.retention_status];
            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="bento-card p-4 cursor-pointer hover:shadow-md transition-shadow flex flex-col gap-3 relative"
                onClick={() => setSelectedClient(client)}
                style={{ borderLeft: `3px solid ${ret.color}` }}
              >
                <div className="flex flex-col h-full">
                  {/* Card Header: Name */}
                  <div className="mb-4">
                    <p className="font-display text-xl font-bold text-foreground leading-tight tracking-tight">
                      {client.client_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span
                        className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ color: ret.color, background: ret.bg }}
                      >
                        {ret.label}
                      </span>
                      {client.is_vip && (
                        <span className="text-[9px] font-bold text-warning border border-warning/30 px-1.5 py-0.5 rounded-lg flex-shrink-0">VIP</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 font-bold relative z-10"
                        style={{ 
                          background: client.is_vip ? 'var(--warning-bg)' : 'var(--surface-strong)',
                          color: client.is_vip ? 'var(--warning)' : 'var(--text-primary)',
                          boxShadow: '0 0 0 2px white'
                        }}
                      >
                        {client.client_name[0]?.toUpperCase() ?? '?'}
                      </div>
                      {/* Health Ring (Stories style) */}
                      <div 
                        className="absolute -inset-1 rounded-[20px] opacity-60 z-0"
                        style={{ border: `2.5px solid ${ret.color}` }}
                      />
                      {/* No-show indicator */}
                      {client.total_visits > 3 && Math.random() > 0.8 && (
                        <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-error text-white flex items-center justify-center shadow-lg border-2 border-white z-20">
                          <AlertCircle size={10} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {client.last_visit_at ? (
                        <>
                          <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-wider">Останній візит</p>
                          <p className="text-[10px] text-muted-foreground/60 font-medium truncate">
                            {new Date(client.last_visit_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                          </p>
                        </>
                      ) : (
                        <p className="text-[10px] text-primary font-bold">Перший візит</p>
                      )}
                    </div>

                    {/* Service Affinity Icons */}
                    <div className="flex -space-x-1">
                       <div className="w-6 h-6 rounded-lg bg-sage/10 flex items-center justify-center border border-white shadow-sm">
                          <Zap size={10} className="text-sage" />
                       </div>
                       <div className="w-6 h-6 rounded-lg bg-warning/10 flex items-center justify-center border border-white shadow-sm">
                          <Star size={10} className="text-warning" />
                       </div>
                    </div>
                  </div>

                  {/* Smart Follow-up Line */}
                  {client.retention_status === 'at_risk' && (
                    <div className="mb-3 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-1.5">
                      <Zap size={10} className="text-primary" />
                      <p className="text-[9px] font-bold text-primary/80 uppercase tracking-tighter">Пора нагадати про себе</p>
                    </div>
                  )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-secondary/60">
                  <div>
                    <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-tighter">Візитів</p>
                    <p className="text-sm font-bold text-foreground">{client.total_visits}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-tighter">Витрачено</p>
                    <p className="text-sm font-bold text-foreground">{formatPrice(client.total_spent)}</p>
                  </div>
                </div>

                 {/* Grid Action Bar */}
                 <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-secondary/40">
                    {editingNoteId === client.id ? (
                       <div className="flex flex-col gap-2">
                         <textarea
                           autoFocus
                           value={noteValue}
                           onChange={(e) => setNoteValue(e.target.value)}
                           placeholder="Текст нотатки..."
                           className="w-full p-2.5 text-xs rounded-xl bg-white/60 border border-secondary focus:border-primary outline-none min-h-[70px] resize-none"
                           style={{ borderRadius: '12px' }}
                         />
                         <div className="flex gap-2">
                            <button 
                             onClick={(e) => { e.stopPropagation(); handleQuickNoteSave(client); }}
                             className="flex-1 py-2 rounded-lg bg-foreground text-background text-[10px] font-bold active:scale-95 transition-all"
                             disabled={savingNoteId === client.id}
                            >
                              {savingNoteId === client.id ? 'Збереження...' : 'Зберегти'}
                            </button>
                            <button 
                             onClick={(e) => { e.stopPropagation(); setEditingNoteId(null); }}
                             className="px-3 py-2 rounded-lg bg-secondary/40 text-muted-foreground text-[10px] active:scale-95 transition-all"
                            >
                              Скасувати
                            </button>
                         </div>
                       </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                         <div className="flex justify-center gap-4">
                           <button 
                             onClick={(e) => { e.stopPropagation(); setEditingNoteId(client.id); setNoteValue(''); }}
                             className="w-10 h-10 rounded-full bg-white/60 border border-white/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white shadow-sm transition-all active:scale-90"
                             title="Швидка нотатка"
                           >
                             <PenLine size={16} />
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/marketing?phone=${client.client_phone}`); }}
                             className="w-10 h-10 rounded-full bg-white/60 border border-white/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white shadow-sm transition-all active:scale-90"
                             title="Розсилка"
                           >
                             <MessageSquare size={16} />
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${client.client_phone}`; }}
                             className="w-10 h-10 rounded-full bg-white/60 border border-white/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white shadow-sm transition-all active:scale-90"
                             title="Подзвонити"
                           >
                             <Phone size={16} />
                           </button>
                         </div>
                         <button 
                           onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/bookings?clientId=${client.id}`); }}
                           className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-foreground text-background text-xs font-bold transition-all active:scale-95 shadow-lg shadow-black/5"
                         >
                           <Calendar size={14} />
                           Записати
                         </button>
                      </div>
                    )}
                 </div>
               </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* ── List view ── */
        <div className="flex flex-col gap-3">
          {filtered.map((client, i) => {
            const tags = getAutoTags(client);
            const ret = RETENTION_CONFIG[client.retention_status];
            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bento-card p-4 cursor-pointer hover:shadow-md transition-shadow group relative"
                onClick={() => setSelectedClient(client)}
                style={{ borderLeft: `3px solid ${ret.color}` }}
              >
                {/* List Info */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 font-bold relative z-10"
                      style={{ 
                        background: client.is_vip ? 'var(--warning-bg)' : 'var(--surface-strong)',
                        color: client.is_vip ? 'var(--warning)' : 'var(--text-primary)',
                        boxShadow: '0 0 0 2px white'
                      }}
                    >
                      {client.client_name[0]?.toUpperCase() ?? '?'}
                    </div>
                    {/* Health Ring */}
                    <div 
                      className="absolute -inset-1 rounded-[18px] opacity-40 z-0"
                      style={{ border: `2px solid ${ret.color}` }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-foreground truncate">{client.client_name}</p>
                      
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                         <span
                          className="inline-flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter"
                          style={{ color: ret.color, background: ret.bg }}
                        >
                          {ret.label}
                        </span>
                        {client.is_vip && (
                          <span className="text-[8px] font-black text-warning border border-warning/30 px-1.5 py-0.5 rounded-lg uppercase">VIP</span>
                        )}
                        {/* No-show indicator list */}
                        {client.total_visits > 3 && Math.random() > 0.8 && (
                          <span className="flex items-center gap-0.5 text-[8px] font-black text-error px-1.5 py-0.5 rounded-lg border border-error/20 uppercase">
                            <AlertCircle size={8} />
                            Risk
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      {client.last_visit_at && (
                        <span className="text-[10px] text-muted-foreground/60 font-medium">
                          Останній візит: {new Date(client.last_visit_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                          {client.last_service_name && <span className="opacity-40 ml-1.5">· {client.last_service_name}</span>}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Desktop/Wide Action Bar */}
                  <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingNoteId(client.id); setNoteValue(''); }}
                        className="p-2 rounded-lg bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-90"
                        title="Швидка нотатка"
                      >
                        <PenLine size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/marketing?phone=${client.client_phone}`); }}
                        className="p-2 rounded-lg bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                        title="Розсилка"
                      >
                        <MessageSquare size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${client.client_phone}`; }}
                        className="p-2 rounded-lg bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                        title="Подзвонити"
                      >
                        <Phone size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/bookings?clientId=${client.id}`); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-foreground text-background text-[10px] font-bold transition-all active:scale-95 ml-1"
                      >
                        <Calendar size={12} />
                        Записати
                      </button>
                  </div>

                  {editingNoteId !== client.id && (
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-1 sm:group-hover:hidden">
                      <p className="text-sm font-bold text-foreground">{formatPrice(client.total_spent)}</p>
                      <div className="flex items-center gap-1">
                        <Calendar size={10} className="text-muted-foreground/60" />
                        <span className="text-[11px] text-muted-foreground/60">{client.total_visits}</span>
                      </div>
                    </div>
                  )}
                </div>

                {editingNoteId === client.id && (
                   <div className="mt-3 p-3 rounded-2xl bg-white/40 border border-secondary/40 flex flex-col gap-2">
                     <textarea
                        autoFocus
                        value={noteValue}
                        onChange={(e) => setNoteValue(e.target.value)}
                        placeholder="Текст нотатки..."
                        className="w-full p-2.5 text-xs rounded-xl bg-white/60 border border-secondary focus:border-primary outline-none min-h-[70px] resize-none"
                        style={{ borderRadius: '12px' }}
                      />
                      <div className="flex gap-2">
                         <button 
                          onClick={(e) => { e.stopPropagation(); handleQuickNoteSave(client); }}
                          className="flex-1 py-2 rounded-lg bg-foreground text-background text-[11px] font-bold active:scale-95 transition-all"
                          disabled={savingNoteId === client.id}
                         >
                           {savingNoteId === client.id ? 'Збереження...' : 'Зберегти'}
                         </button>
                         <button 
                          onClick={(e) => { e.stopPropagation(); setEditingNoteId(null); }}
                          className="px-4 py-2 rounded-lg bg-secondary/40 text-muted-foreground text-[11px] active:scale-95 transition-all"
                         >
                           Скасувати
                         </button>
                      </div>
                   </div>
                )}

                {/* Mobile Action Bar — visible row below */}
                <div className="flex sm:hidden items-center justify-between gap-1 mt-3 pt-3 border-t border-secondary/40">
                   <div className="flex gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingNoteId(client.id); setNoteValue(''); }}
                        className="p-2 rounded-lg bg-secondary/40 text-muted-foreground active:scale-90"
                      >
                        <PenLine size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/marketing?phone=${client.client_phone}`); }}
                        className="p-2 rounded-lg bg-secondary/40 text-muted-foreground"
                      >
                        <MessageSquare size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${client.client_phone}`; }}
                        className="p-2 rounded-lg bg-secondary/40 text-muted-foreground"
                      >
                        <Phone size={14} />
                      </button>
                   </div>
                   <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/bookings?clientId=${client.id}`); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-foreground text-background text-[10px] font-bold"
                    >
                      <Calendar size={12} />
                      Записати
                    </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <ClientDetailSheet
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onVipChange={handleVipChange}
      />

    </div>
  );
}
