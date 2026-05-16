'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Star, Phone, Calendar, TrendingUp, Loader2, Link2, Zap, Instagram,
  LayoutGrid, List, ChevronDown, Send, MessageSquare, PenLine, AlertCircle, Heart, X, Sparkles,
  CheckCircle2, Moon, AlertTriangle, UserX, Crown, Sparkle, Gem, Share2, Plus, Settings, Search
} from 'lucide-react';
import { formatPrice } from '@/components/master/services/types';
import { ClientDetailSheet } from './ClientDetailSheet';
import { ClientWidgets } from './ClientWidgets';
import { useClients } from '@/lib/supabase/hooks/useClients';
import type { ClientRow, RetentionStatus } from '@/lib/supabase/hooks/useClients';
import { saveClientNote } from '@/app/(master)/dashboard/clients/actions';
import { PopUpModal } from '@/components/ui/PopUpModal';
import { useClientNoteInvalidate } from '@/lib/supabase/hooks/useClientNote';
import { useToast } from '@/lib/toast/context';
import { parseError } from '@/lib/utils/errors';
import { useMasterContext } from '@/lib/supabase/context';
import { evaluateCustomSegment, getSegmentIcon } from './SegmentBuilder';
import type { CustomSegment } from '@/lib/types/segments';
import { ManualBookingForm } from '@/components/master/bookings/ManualBookingForm';
import { useUrlActionBus } from '@/lib/actions/UrlActionBus';

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
type SmartSegment = 'none' | 'lost_treasures' | 'newbie_danger' | 'potential_vip' | 'flash_hunters' | 'archive_cleanup';

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

const RETENTION_ICON_MAP: Partial<Record<RetentionFilter, React.ReactElement>> = {
  active:   <CheckCircle2 size={11} />,
  sleeping: <Moon size={11} />,
  at_risk:  <AlertTriangle size={11} />,
  lost:     <UserX size={11} />,
};

function getSmartAction(client: ClientRow, segment: SmartSegment | 'none') {
  const name = client.client_name.split(' ')[0];
  
  if (segment === 'lost_treasures' || client.retention_status === 'lost') {
    return {
      title: 'Повернути клієнта',
      description: 'Клієнт у зоні відтоку. Рекомендуємо запропонувати бонус.',
      template: `Привіт, ${name}! Давно не бачилися в нашому салоні. Маю для вас приємний бонус -10% на наступний візит. Буду рада бачити! ✨`,
      icon: <UserX size={18} />
    };
  }
  
  if (segment === 'newbie_danger') {
    return {
      title: 'Закріпити новачка',
      description: 'Клієнт був лише раз. Запитайте про враження.',
      template: `Привіт, ${name}! Як вам результат нашого останнього візиту? Буду вдячна за відгук і з радістю чекатиму знову! ❤️`,
      icon: <Sparkle size={18} />
    };
  }

  if (segment === 'potential_vip' || (client.total_visits > 3 && !client.is_vip)) {
    return {
      title: 'Заохотити до VIP',
      description: 'Лояльний клієнт. Час зробити приємний комплімент.',
      template: `Вітаю, ${name}! Ви наш частий гість, тому на наступний візит я підготувала для вас особливий догляд у подарунок. Дякуємо за довіру! 👑`,
      icon: <Crown size={18} />
    };
  }

  return {
    title: 'Запросити на запис',
    description: 'Нагадайте про себе та запропонуйте вільне вікно.',
    template: `Привіт, ${name}! Минуло вже достатньо часу з нашої останньої зустрічі. Маю вільні вікна на наступний тиждень, забронювати для вас місце? 📅`,
    icon: <Calendar size={18} />
  };
}

function formatClientName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  const first = parts[0];
  const lastInitial = parts[1][0].toUpperCase();
  return `${first} ${lastInitial}.`;
}

function ClientIconStack({ client }: { client: ClientRow }) {
  const icons = [];
  
  // Status Icons
  if (client.retention_status === 'active')   icons.push({ icon: <CheckCircle2 size={12} />, color: '#FFFFFF', bg: '#5C9E7A' });
  if (client.retention_status === 'sleeping') icons.push({ icon: <Moon size={12} />, color: '#FFFFFF', bg: '#D4935A' });
  if (client.retention_status === 'at_risk')  icons.push({ icon: <AlertTriangle size={12} />, color: '#FFFFFF', bg: '#C05B5B' });
  if (client.retention_status === 'lost')     icons.push({ icon: <UserX size={12} />, color: '#FFFFFF', bg: '#6B5750' });

  // Tag Icons
  if (client.is_vip) icons.push({ icon: <Crown size={12} />, color: '#FFFFFF', bg: '#D4935A' });
  if (client.total_visits === 1) icons.push({ icon: <Sparkle size={12} />, color: '#FFFFFF', bg: '#789A99' });
  if (client.total_visits > 5)   icons.push({ icon: <Heart size={12} />, color: '#FFFFFF', bg: '#C05B5B' });
  if (client.average_check > 1500) icons.push({ icon: <Gem size={12} />, color: '#FFFFFF', bg: '#789A99' });

  return (
    <div className="absolute top-4 right-4 flex flex-col items-center">
      {icons.slice(0, 4).map((item, i) => (
        <div 
          key={i}
          className="w-7 h-7 rounded-lg border-2 border-white flex items-center justify-center shadow-md transition-transform hover:scale-110 relative"
          style={{ 
            background: item.bg, 
            color: item.color,
            marginTop: i === 0 ? 0 : '-10px',
            zIndex: 10 - i
          }}
        >
          {item.icon}
        </div>
      ))}
    </div>
  );
}

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
  const { showToast } = useToast();

  const customSegments: CustomSegment[] = (masterProfile?.segment_config as CustomSegment[]) ?? [];

  const sort    = (searchParams.get('sort') as SortKey) || 'visits';
  const view    = (searchParams.get('view') as ViewMode) || 'list';
  const [search, setSearch] = useState('');
  const [retentionFilter, setRetentionFilter] = useState<RetentionFilter>('all');
  const [smartSegment, setSmartSegment] = useState<SmartSegment | 'none'>('none');
  const [showSmartAction, setShowSmartAction] = useState<ClientRow | null>(null);
  const [smartMessage, setSmartMessage] = useState('');
  const [sortOpen, setSortOpen] = useState(false);

  // Terminal: clientPhone in URL is source of truth for open sheet
  const clientPhone = searchParams.get('clientPhone');
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

  // Action Bus: client:open → resolve clientId → navigate to ?clientPhone=xxx
  useUrlActionBus('client:open', ({ clientId }) => {
    const target = clients.find(c => c.client_id === clientId);
    if (target) openClientSheet(target);
  });

  function closeClientSheet() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('clientPhone');
    router.replace(`/dashboard/clients?${params.toString()}`, { scroll: false });
  }

  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [showFab, setShowFab] = useState(true);
  const [customSegmentId, setCustomSegmentId] = useState<string | null>(null);

  // Booking wizard state — opens locally without navigation
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [bookingClient, setBookingClient] = useState<ClientRow | null>(null);

  function openBookingForClient(client: ClientRow) {
    setBookingClient(client);
    setBookingFormOpen(true);
  }

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

  // Same logic as ClientWidgets lostTreasures: is_vip + at_risk/lost
  const lostTreasuresIds = new Set(
    clients
      .filter(c => c.is_vip && (c.retention_status === 'at_risk' || c.retention_status === 'lost'))
      .map(c => c.id)
  );
  const cycle = masterProfile?.retention_cycle_days ?? 60;
  const archiveDate = new Date();
  archiveDate.setDate(archiveDate.getDate() - cycle * 2);

  const filtered = sortClients(
    clients.filter(c => {
      const matchesSearch =
        c.client_name.toLowerCase().includes(search.toLowerCase()) ||
        c.client_phone.includes(search);

      const matchesRetention = retentionFilter === 'all' || c.retention_status === retentionFilter;

      let matchesSegment = true;
      if (smartSegment === 'lost_treasures') {
        matchesSegment = lostTreasuresIds.has(c.id);
      } else if (smartSegment === 'newbie_danger') {
        matchesSegment = c.total_visits === 1 && (c.retention_status === 'at_risk' || c.retention_status === 'lost');
      } else if (smartSegment === 'potential_vip') {
        matchesSegment = !c.is_vip && (c.total_visits >= 5 || c.total_spent >= 5000);
      } else if (smartSegment === 'flash_hunters') {
        matchesSegment = c.total_visits > 2 && c.average_check < 800;
      } else if (smartSegment === 'archive_cleanup') {
        matchesSegment = !!c.last_visit_at && new Date(c.last_visit_at) < archiveDate;
      }

      // Custom segment
      if (customSegmentId) {
        const seg = customSegments.find(s => s.id === customSegmentId);
        matchesSegment = seg ? evaluateCustomSegment(c, seg) : true;
      }

      return matchesSearch && matchesRetention && matchesSegment;
    }),
    sort,
  );

  const totalRevenue = clients.reduce((s, c) => s + c.total_spent, 0);
  const returning    = clients.filter(c => c.total_visits > 1).length;
  const atRiskCount  = clients.filter(c => c.retention_status === 'at_risk' || c.retention_status === 'lost').length;

  return (
    <div className="flex flex-col gap-6 lg:gap-10 pb-32">
      {/* 1. Header & Quick Switcher */}
      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <h1 
              className="text-[60px] lg:text-[100px] text-foreground font-display transition-all duration-500"
              style={{
                fontFamily: 'var(--font-great-vibes, cursive)',
                fontWeight: 400,
                lineHeight: 0.85,
              }}
            >
              Клієнти
            </h1>
            <p className="text-xs lg:text-sm text-muted-foreground/60 ml-2 lg:ml-4 mt-2 lg:mt-4 font-medium">Ваша база клієнтів та CRM</p>
          </div>
          
          <div className="flex gap-3 mb-1">
            <button
              onClick={() => router.push('/dashboard/marketing?tab=broadcasts')}
              className="group relative flex items-center gap-2 px-5 py-3 rounded-[20px] bg-foreground text-background font-bold text-sm shadow-xl shadow-black/10 transition-all hover:scale-105 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
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
                  onClick={() => { setRetentionFilter(f.value); setSmartSegment('none'); setCustomSegmentId(null); setShowFab(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer"
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
                    onClick={() => {
                      setCustomSegmentId(isActive ? null : seg.id);
                      setSmartSegment('none');
                      setRetentionFilter('all');
                      setShowFab(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border active:scale-95"
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
              onClick={() => router.push('/dashboard/settings#segments')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap border border-dashed border-accent/30 text-accent/70 bg-accent/5 hover:bg-accent/10 transition-colors"
            >
              <Plus size={11} />
              Створити власні сегменти
            </button>
          )}
        </div>
      )}

      {/* Search + Sort + View toggle Command Bar */}
      <div className="widget-card p-4 lg:p-6 flex flex-col lg:flex-row items-center justify-between gap-4 relative z-50">
        
        {/* View toggle */}
        <div className="flex p-1.5 rounded-[20px] bg-secondary/30 border border-white/40 backdrop-blur-sm w-full lg:w-auto">
          {(['list', 'grid'] as const).map(v => (
            <button
              key={v}
              onClick={() => setParam('view', v)}
              className={`flex-1 lg:flex-none lg:px-6 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                view === v ? 'bg-white shadow-md text-primary scale-105' : 'text-muted-foreground/60 hover:text-muted-foreground'
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
              className="w-full pl-11 pr-4 py-3 rounded-[20px] bg-white/60 border border-white/80 text-sm focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all outline-none font-medium"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(p => !p)}
              className="h-full px-4 py-3 rounded-[20px] bg-white/60 border border-white/80 text-sm font-bold text-foreground hover:bg-white transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-sm"
            >
              <span className="hidden sm:inline">{SORT_OPTIONS.find(o => o.value === sort)?.label}</span>
              <ChevronDown size={14} className={`text-muted-foreground/40 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-2 z-30 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/80 shadow-lg overflow-hidden min-w-[180px]">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setParam('sort', opt.value); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors cursor-pointer ${
                      sort === opt.value
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-muted-foreground hover:bg-secondary/60 font-medium'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Broadcast FAB — same dimensions as follow-up block */}
      <AnimatePresence>
        {showFab && (smartSegment !== 'none' || retentionFilter !== 'all' || !!customSegmentId) && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative w-full mt-1 mb-1"
          >
            <button
              onClick={() => {
                router.push(`/dashboard/marketing?tab=broadcasts&segment=${smartSegment || retentionFilter}`);
              }}
              className="w-full bento-card p-4 flex items-center gap-4 transition-all cursor-pointer bg-accent/5 border-accent/20 active:scale-[0.99]"
            >
              <div className="p-3 rounded-2xl bg-accent/10 text-accent shrink-0">
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
              onClick={(e) => { e.stopPropagation(); setShowFab(false); }}
              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white border border-secondary shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-90 z-10"
            >
              <X size={12} />
            </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 lg:gap-4">
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
                onClick={() => openClientSheet(client)}
                style={{ borderLeft: `3px solid ${ret.color}` }}
              >
                <div className="flex flex-col h-full">
                  {/* Card Header: Name */}
                  <div className="mb-4">
                    <p className="font-display text-lg font-bold text-foreground leading-tight tracking-tight max-w-[70%]">
                      {formatClientName(client.client_name)}
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

                    <ClientIconStack client={client} />
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
                      <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-wider">Останній візит</p>
                      <div className="flex flex-col mt-0.5">
                        <p className="text-sm text-foreground/90 font-display italic tracking-tight truncate leading-tight">
                           {client.last_service_name || 'Остання послуга'}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase tracking-tighter">
                          {client.last_visit_at 
                            ? new Date(client.last_visit_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
                            : 'Перший візит'
                          }
                        </p>
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
                     <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-tighter">Візитів</p>
                     <p className="text-xl font-bold text-sage leading-none mt-1">{client.total_visits}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-tighter">Витрачено</p>
                     <p className="text-xl font-bold text-foreground leading-none mt-1">
                       {formatPrice(client.total_spent).replace('₴', '')}
                       <span className="text-xs font-normal text-muted-foreground/40 ml-0.5">₴</span>
                     </p>
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
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                const action = getSmartAction(client, smartSegment);
                                setSmartMessage(action.template);
                                setShowSmartAction(client); 
                              }}
                              className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm transition-all active:scale-90 hover:bg-primary hover:text-white"
                              title="Smart-дія"
                            >
                              <Sparkles size={16} />
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
                           onClick={(e) => { e.stopPropagation(); openBookingForClient(client); }}
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
                onClick={() => openClientSheet(client)}
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
                        onClick={(e) => { e.stopPropagation(); openBookingForClient(client); }}
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
                      onClick={(e) => { e.stopPropagation(); openBookingForClient(client); }}
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
        onClose={closeClientSheet}
      />

      <PopUpModal 
        isOpen={!!showSmartAction} 
        onClose={() => setShowSmartAction(null)} 
        title="Smart-дія"
      >
        {showSmartAction && (
          <div className="flex flex-col gap-6">
            <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10 flex items-start gap-4">
               <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
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
                  className="w-full p-4 rounded-2xl bg-white border border-secondary/40 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[120px] resize-none"
               />
            </div>

            <div className="grid grid-cols-2 gap-3">
               <button 
                  onClick={() => {
                    const url = `https://t.me/+${showSmartAction.client_phone.replace(/\D/g, '')}`;
                    window.open(url, '_blank');
                  }}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#229ED9] text-white font-bold text-sm active:scale-95 transition-all shadow-lg shadow-blue-500/10"
                >
                  <Send size={16} />
                  <span>Telegram</span>
               </button>
               <button 
                  onClick={() => {
                    navigator.clipboard.writeText(smartMessage);
                    window.location.href = `tel:${showSmartAction.client_phone}`;
                  }}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-foreground text-background font-bold text-sm active:scale-95 transition-all"
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
      </PopUpModal>
        </div> {/* close lg:col-span-8 */}
      </div> {/* close lg:grid-cols-12 */}

      {/* Booking wizard — opens directly from CRM without navigation */}
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
