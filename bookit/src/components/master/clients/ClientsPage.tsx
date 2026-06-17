'use client';

import React, { useState, useMemo, useRef, useLayoutEffect, useReducer } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Loader2, Link2, Zap, Instagram,
  LayoutGrid, List, ChevronDown, Send, MessageSquare, X,
  CheckCircle2, Moon, AlertTriangle, UserX, Plus, Search, Share2,
} from 'lucide-react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { ClientDetailSheet } from './ClientDetailSheet';
import { ClientWidgets } from './ClientWidgets';
import { ClientListRow } from './ClientListRow';
import { ClientGridCard } from './ClientGridCard';
import { useClients } from '@/lib/supabase/hooks/useClients';
import type { ClientRow, RetentionStatus } from '@/lib/supabase/hooks/useClients';
import { Sheet } from '@/components/ui/Sheet';
import { useMasterContext } from '@/lib/supabase/context';
import { evaluateCustomSegment, getSegmentIcon } from './SegmentBuilder';
import type { CustomSegment } from '@/lib/types/segments';
import { ManualBookingForm } from '@/components/master/bookings/ManualBookingForm';
import { useUrlActionBus } from '@/lib/actions/UrlActionBus';
import {
  RETENTION_CONFIG,
  getAutoTags,
  getSmartAction,
  formatClientName,
  ClientIconStack,
  type SmartSegment,
  type AutoTag,
} from './clientsUtils';

// Re-exports for backward compatibility (ClientDetailSheet, ClientWidgets, AnalyticsPage, etc.)
export type { ClientRow };
export { RETENTION_CONFIG, getAutoTags, ClientIconStack, formatClientName };
export type { AutoTag };

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 } as const;

type SortKey = 'visits' | 'alpha' | 'check' | 'recent';
type ViewMode = 'list' | 'grid';
type RetentionFilter = 'all' | RetentionStatus;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'visits',  label: 'За візитами'    },
  { value: 'alpha',   label: 'За алфавітом'   },
  { value: 'check',   label: 'Найбільший чек' },
  { value: 'recent',  label: 'Нещодавні'      },
];

const RETENTION_FILTERS: { value: RetentionFilter; label: string }[] = [
  { value: 'all',      label: 'Всі'         },
  { value: 'active',   label: 'Активні'     },
  { value: 'sleeping', label: 'Дрімають'    },
  { value: 'at_risk',  label: 'Під ризиком' },
  { value: 'lost',     label: 'Втрачені'    },
];

const RETENTION_ICON_MAP: Partial<Record<RetentionFilter, React.ReactElement>> = {
  active:   <CheckCircle2 size={11} />,
  sleeping: <Moon size={11} />,
  at_risk:  <AlertTriangle size={11} />,
  lost:     <UserX size={11} />,
};

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
  const { masterProfile } = useMasterContext();

  const customSegments: CustomSegment[] = Array.isArray(masterProfile?.segment_config)
    ? (masterProfile.segment_config as unknown as CustomSegment[])
    : [];

  const sort = (searchParams.get('sort') as SortKey) || 'visits';
  const view = (searchParams.get('view') as ViewMode) || 'list';
  const [search, setSearch] = useState('');
  const [retentionFilter, setRetentionFilter] = useState<RetentionFilter>('all');
  const [smartSegment, setSmartSegment] = useState<SmartSegment | 'none'>('none');
  const [showSmartAction, setShowSmartAction] = useState<ClientRow | null>(null);
  const [smartMessage, setSmartMessage] = useState('');
  const [sortOpen, setSortOpen] = useState(false);
  const [showFab, setShowFab] = useState(true);
  const [customSegmentId, setCustomSegmentId] = useState<string | null>(null);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [bookingClient, setBookingClient] = useState<ClientRow | null>(null);

  const clientPhone    = searchParams.get('clientPhone');
  const selectedClient = clientPhone
    ? (clients.find(c => c.client_phone === clientPhone) ?? null)
    : null;

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function openClientSheet(client: ClientRow) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('clientPhone', client.client_phone);
    router.push(`/dashboard/clients?${params.toString()}`);
  }

  useUrlActionBus('client:open', ({ clientId }) => {
    const target = clients.find(c => c.client_id === clientId);
    if (target) openClientSheet(target);
  });

  function closeClientSheet() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('clientPhone');
    router.replace(`/dashboard/clients?${params.toString()}`, { scroll: false });
  }

  function openBookingForClient(client: ClientRow) {
    setBookingClient(client);
    setBookingFormOpen(true);
  }

  const filtered = useMemo(() => {
    const cycle = masterProfile?.retention_cycle_days ?? 60;
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - cycle * 2);

    const lostTreasureSet = new Set(
      clients
        .filter(c => c.is_vip && (c.retention_status === 'at_risk' || c.retention_status === 'lost'))
        .map(c => c.id)
    );

    return sortClients(
      clients.filter(c => {
        const matchesSearch =
          c.client_name.toLowerCase().includes(search.toLowerCase()) ||
          c.client_phone.includes(search);

        const matchesRetention = retentionFilter === 'all' || c.retention_status === retentionFilter;

        let matchesSegment = true;
        if (smartSegment === 'lost_treasures') {
          matchesSegment = lostTreasureSet.has(c.id);
        } else if (smartSegment === 'newbie_danger') {
          matchesSegment = c.total_visits === 1 && (c.retention_status === 'at_risk' || c.retention_status === 'lost');
        } else if (smartSegment === 'potential_vip') {
          matchesSegment = !c.is_vip && (c.total_visits >= 5 || c.total_spent >= 5000);
        } else if (smartSegment === 'flash_hunters') {
          matchesSegment = c.total_visits > 2 && c.average_check < 800;
        } else if (smartSegment === 'archive_cleanup') {
          matchesSegment = !!c.last_visit_at && new Date(c.last_visit_at) < archiveDate;
        }

        if (customSegmentId) {
          const seg = customSegments.find(s => s.id === customSegmentId);
          matchesSegment = seg ? evaluateCustomSegment(c, seg) : true;
        }

        return matchesSearch && matchesRetention && matchesSegment;
      }),
      sort,
    );
  }, [clients, search, retentionFilter, smartSegment, customSegmentId, customSegments, sort, masterProfile?.retention_cycle_days]);

  // ── Virtual list for list-view ──────────────────────────────────────────────
  const listRef = useRef<HTMLDivElement>(null);
  const [, forceRerender] = useReducer((n: number) => n + 1, 0);
  // One extra render after mount so scrollMargin is computed from a real DOM rect
  useLayoutEffect(() => { forceRerender(); }, []);

  const listVirtualizer = useWindowVirtualizer({
    count: view === 'list' ? filtered.length : 0,
    estimateSize: () => 88, // ~76px card + 12px gap
    overscan: 8,
    scrollMargin: listRef.current
      ? listRef.current.getBoundingClientRect().top + window.scrollY
      : 0,
  });

  return (
    <div className="flex flex-col gap-6 lg:gap-10 pb-32" data-tour-step="act-3">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <h1
              className="text-[60px] lg:text-[100px] text-foreground font-display transition-all duration-500"
              style={{ fontFamily: 'var(--font-great-vibes, cursive)', fontWeight: 400, lineHeight: 0.85 }}
            >
              Клієнти
            </h1>
            <p className="text-xs lg:text-sm text-muted-foreground/60 ml-2 lg:ml-4 mt-2 lg:mt-4 font-medium">
              Ваша база клієнтів та CRM
            </p>
          </div>

          <div className="flex gap-3 mb-1">
            <button
              type="button"
              onClick={() => router.push('/dashboard/marketing?tab=broadcasts')}
              className="group relative flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--accent-on)] font-bold text-sm shadow-xl shadow-black/10 transition-all hover:scale-105 active:scale-[0.95] overflow-hidden"
            >
              <div
                className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                style={{ background: 'color-mix(in srgb, var(--accent-on) 10%, transparent)' }}
              />
              <Send size={18} className="relative z-10" />
              <span className="relative z-10 hidden sm:inline">Розсилка</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">

        {/* Sidebar (Desktop) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-6 sticky top-[104px]">
          <ClientWidgets
            clients={clients}
            isLoading={isLoading}
            activeSegment={smartSegment !== 'none' ? smartSegment : retentionFilter}
            onSegmentSelect={(id) => {
              setCustomSegmentId(null);
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

        {/* Mobile Analytics */}
        <div className="flex flex-col gap-4 lg:hidden">
          <ClientWidgets
            clients={clients}
            isLoading={isLoading}
            activeSegment={smartSegment !== 'none' ? smartSegment : retentionFilter}
            onSegmentSelect={(id) => {
              setCustomSegmentId(null);
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

        {/* Main Content */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {!isLoading && clients.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              {/* Retention filter chips */}
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
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => { setRetentionFilter(f.value); setSmartSegment('none'); setCustomSegmentId(null); setShowFab(true); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-bold whitespace-nowrap transition-all active:scale-[0.88] min-h-[44px]"
                      style={isActive && cfg
                        ? { background: cfg.bg, color: cfg.color, outline: `1.5px solid ${cfg.color}40` }
                        : isActive
                          ? { background: 'var(--accent)', color: 'white' }
                          : { background: 'var(--surface)', color: 'var(--text-secondary)', border: '0.5px solid var(--border-strong)' }
                      }
                    >
                      {RETENTION_ICON_MAP[f.value] && (
                        <span className="flex-shrink-0">{RETENTION_ICON_MAP[f.value]}</span>
                      )}
                      {f.label}
                      <span className="opacity-60 font-normal ml-1">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom segment chips */}
              {customSegments.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-hide">
                  {customSegments.map(seg => {
                    const isActive = customSegmentId === seg.id;
                    return (
                      <button
                        key={seg.id}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => {
                          setCustomSegmentId(isActive ? null : seg.id);
                          setSmartSegment('none');
                          setRetentionFilter('all');
                          setShowFab(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border active:scale-[0.88] min-h-[44px]"
                        style={isActive
                          ? { background: seg.color, color: '#fff', borderColor: seg.color }
                          : { background: `${seg.color}0d`, color: seg.color, borderColor: `${seg.color}33` }
                        }
                      >
                        <span className="flex-shrink-0">{getSegmentIcon(seg.icon, 11)}</span>
                        {seg.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/settings#segments')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap border border-dashed border-accent/30 text-accent/70 bg-accent/5 hover:bg-accent/10 transition-all active:scale-[0.88] min-h-[44px] w-fit"
                >
                  <Plus size={11} />
                  Створити власні сегменти
                </button>
              )}
            </div>
          )}

          {/* Search + Sort + View toggle */}
          <div className="widget-card p-4 lg:p-6 flex flex-col lg:flex-row items-center justify-between gap-4 relative z-50">

            {/* View toggle */}
            <div className="flex p-1.5 rounded-xl bg-secondary/30 border border-border/40 backdrop-blur-sm w-full lg:w-auto">
              {(['list', 'grid'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  aria-label={v === 'list' ? 'Список' : 'Сітка'}
                  onClick={() => setParam('view', v)}
                  className={`flex-1 lg:flex-none lg:px-6 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.88] ${
                    view === v ? 'bg-secondary shadow-md text-primary scale-105' : 'text-muted-foreground/60 hover:text-muted-foreground'
                  }`}
                >
                  {v === 'list' ? <List size={16} /> : <LayoutGrid size={16} />}
                  <span className="hidden lg:inline">{v === 'list' ? 'Список' : 'Сітка'}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
              <div className="relative group flex-1 lg:flex-none lg:min-w-[240px]">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Пошук клієнта..."
                  aria-label="Пошук клієнта"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/60 border border-border text-sm focus:bg-secondary focus:ring-4 focus:ring-primary/5 transition-all outline-none font-medium"
                />
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen(p => !p)}
                  aria-label="Сортування"
                  aria-expanded={sortOpen}
                  aria-haspopup="listbox"
                  className="h-full px-4 py-3 rounded-xl bg-secondary/60 border border-border text-sm font-bold text-foreground hover:bg-secondary transition-all active:scale-[0.88] flex items-center gap-2 whitespace-nowrap shadow-sm"
                >
                  <span className="hidden sm:inline">{SORT_OPTIONS.find(o => o.value === sort)?.label}</span>
                  <ChevronDown size={14} className={`text-muted-foreground/40 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-2 z-30 bg-secondary/95 backdrop-blur-sm rounded-xl border border-border shadow-lg overflow-hidden min-w-[180px]">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setParam('sort', opt.value); setSortOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm transition-colors text-muted-foreground hover:bg-secondary/60 font-medium"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Broadcast FAB */}
          <AnimatePresence>
            {showFab && (smartSegment !== 'none' || retentionFilter !== 'all' || !!customSegmentId) && filtered.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={SPRING}
                className="relative w-full mt-1 mb-1"
              >
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/dashboard/marketing?tab=broadcasts&segment=${smartSegment || retentionFilter}`);
                  }}
                  className="w-full bento-card p-4 flex items-center gap-4 transition-all bg-accent/5 border-accent/20 active:scale-[0.95]"
                >
                  <div className="p-3 rounded-xl bg-accent/10 text-accent shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {customSegmentId
                        ? (customSegments.find(s => s.id === customSegmentId)?.name ?? 'Написати обраним')
                        : smartSegment === 'lost_treasures' ? 'Повернути скарби'
                        : smartSegment === 'newbie_danger' ? 'Привітати новачків'
                        : smartSegment === 'potential_vip' ? 'Заохотити VIP'
                        : smartSegment === 'archive_cleanup' ? 'Написати неактивним'
                        : retentionFilter === 'at_risk' ? 'Нагадати про себе'
                        : retentionFilter === 'lost' ? 'Почати реактивацію'
                        : 'Написати обраним'}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5 leading-tight">
                      {filtered.length} контактів у вибірці
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-foreground text-background shrink-0">
                    <Send size={16} />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowFab(false); }}
                  aria-label="Закрити"
                  className="absolute -top-1.5 -right-1.5 size-6 rounded-full bg-secondary border border-secondary shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-[0.88] z-10"
                >
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Click-away for sort */}
          {sortOpen && (
            <button type="button" className="fixed inset-0 z-20 bg-transparent" onClick={() => setSortOpen(false)} aria-label="Закрити меню сортування" />
          )}

          {isLoading ? (
            <div className="bento-card p-10 flex flex-col items-center gap-3">
              <Loader2 size={24} className="text-primary animate-spin" />
              <p className="text-sm text-muted-foreground/60">Завантаження клієнтів...</p>
            </div>
          ) : filtered.length === 0 ? (
            search ? (
              <div className="bento-card p-10 flex flex-col items-center gap-3 text-center">
                <div className="size-14 rounded-full bg-secondary flex items-center justify-center">
                  <Users size={26} className="text-muted-foreground/60" />
                </div>
                <p className="text-sm font-semibold text-foreground">Нічого не знайдено</p>
                <p className="text-xs text-muted-foreground/60">Спробуйте інший запит</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING}
                className="bento-card p-6 flex flex-col gap-5"
              >
                <div className="text-center">
                  <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
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
                      <div key={i} className="flex gap-3 p-4 rounded-xl bg-secondary/50">
                        <div className="size-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${step.color}15` }}>
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
            /* ── Grid view — React.memo cards ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 lg:gap-4">
              {filtered.map((client) => (
                <ClientGridCard
                  key={client.id}
                  client={client}
                  smartSegment={smartSegment}
                  onOpen={openClientSheet}
                  onBooking={openBookingForClient}
                  onSmartAction={(c) => {
                    const action = getSmartAction(c, smartSegment);
                    setSmartMessage(action.template);
                    setShowSmartAction(c);
                  }}
                />
              ))}
            </div>
          ) : (
            /* ── List view — window-virtualizer ── */
            <div
              ref={listRef}
              style={{ height: `${listVirtualizer.getTotalSize()}px`, position: 'relative' }}
            >
              {listVirtualizer.getVirtualItems().map((vItem) => (
                <div
                  key={vItem.key}
                  data-index={vItem.index}
                  ref={listVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${vItem.start - listVirtualizer.options.scrollMargin}px)`,
                    paddingBottom: 12,
                  }}
                >
                  <ClientListRow
                    client={filtered[vItem.index]}
                    onOpen={openClientSheet}
                    onBooking={openBookingForClient}
                    onSmartAction={(c) => {
                      const action = getSmartAction(c, smartSegment);
                      setSmartMessage(action.template);
                      setShowSmartAction(c);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <ClientDetailSheet
            client={selectedClient}
            onClose={closeClientSheet}
          />

          {/* Smart Action Modal */}
          <Sheet
            open={!!showSmartAction}
            onOpenChange={(v) => !v && setShowSmartAction(null)}
            title="Smart-дія"
          >
            {showSmartAction && (
              <div className="flex flex-col gap-6">
                <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-secondary flex items-center justify-center text-primary shadow-sm shrink-0">
                    {getSmartAction(showSmartAction, smartSegment).icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {getSmartAction(showSmartAction, smartSegment).title}
                    </h4>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {getSmartAction(showSmartAction, smartSegment).description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                    Повідомлення клієнту
                  </label>
                  <textarea
                    value={smartMessage}
                    onChange={(e) => setSmartMessage(e.target.value)}
                    className="w-full p-4 rounded-xl bg-secondary border border-secondary/40 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[120px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const url = `https://t.me/+${showSmartAction.client_phone.replace(/\D/g, '')}`;
                      window.open(url, '_blank');
                    }}
                    className="flex items-center justify-center gap-2 py-4 rounded-xl bg-[#229ED9] text-white font-bold text-sm active:scale-[0.95] transition-all shadow-lg shadow-blue-500/10"
                  >
                    <Send size={16} />
                    <span>Telegram</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(smartMessage);
                      window.location.href = `tel:${showSmartAction.client_phone}`;
                    }}
                    className="flex items-center justify-center gap-2 py-4 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--accent-on)] font-bold text-sm active:scale-[0.95] transition-all"
                  >
                    <Share2 size={16} />
                    <span>Копіювати</span>
                  </button>
                </div>

                <p className="text-[10px] text-center text-muted-foreground/40 italic">
                  * Посилання в Telegram відкриє чат за номером телефону
                </p>
              </div>
            )}
          </Sheet>
        </div>
      </div>

      {/* Booking wizard */}
      <ManualBookingForm
        isOpen={bookingFormOpen}
        onClose={() => { setBookingFormOpen(false); setBookingClient(null); }}
        initialClientId={bookingClient?.client_id ?? undefined}
        initialClientName={bookingClient?.client_name}
        initialClientPhone={bookingClient?.client_phone}
      />
    </div>
  );
}
