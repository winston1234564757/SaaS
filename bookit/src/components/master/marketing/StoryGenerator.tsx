'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Loader2, Check, ToggleLeft, ToggleRight,
  Megaphone, Clock, Calendar, Zap, Star, Flame, Lock,
} from 'lucide-react';
import { useMasterContext } from '@/lib/supabase/context';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast/context';
import { UpgradePromptModal } from '@/components/shared/UpgradePromptModal';
import { useWizardSchedule, type ScheduleStore } from '@/lib/supabase/hooks/useWizardSchedule';
import { generateAvailableSlots, type TimeRange } from '@/lib/utils/smartSlots';
import type { WorkingHoursConfig } from '@/types/database';

/* ═══════════════════════════════════════════════════════
   PALETTES
   ═══════════════════════════════════════════════════════ */
interface Palette {
  id: string;
  label: string;
  bg: string;
  text: string;
  muted: string;
  pill: string;
  pillText: string;
  sticker: string;
  stickerText: string;
  brand: string;
  dot: string;
}

const PALETTES: Palette[] = [
  { id: 'nude',  label: 'Nude',  bg: '#F7F2EE', text: '#2E2925', muted: '#B09A8A', pill: '#EDE5DC', pillText: '#2E2925', sticker: '#FFFFFF', stickerText: '#2E2925', brand: '#C9B5A5', dot: '#8A6E5A' },
  { id: 'sage',  label: 'Sage',  bg: '#EDF1EC', text: '#243228', muted: '#7A9E88', pill: '#D8E8DA', pillText: '#243228', sticker: '#FFFFFF', stickerText: '#243228', brand: '#9FBDA8', dot: '#3E7A56' },
  { id: 'mono',  label: 'Mono',  bg: '#FAFAFA', text: '#0D0D0D', muted: '#999999', pill: '#F0F0F0', pillText: '#0D0D0D', sticker: '#0D0D0D', stickerText: '#FFFFFF', brand: '#CCCCCC', dot: '#0D0D0D' },
  { id: 'blush', label: 'Blush', bg: '#FDF6F5', text: '#3D2829', muted: '#C4888E', pill: '#F7E5E5', pillText: '#3D2829', sticker: '#FFFFFF', stickerText: '#3D2829', brand: '#D4AAAC', dot: '#B06070' },
  { id: 'sky',   label: 'Sky',   bg: '#F0F4F8', text: '#1E3448', muted: '#6898C0', pill: '#DDE9F5', pillText: '#1E3448', sticker: '#FFFFFF', stickerText: '#1E3448', brand: '#8AB8D8', dot: '#2E6898' },
  { id: 'dark',  label: 'Dark',  bg: '#141414', text: '#EEEEEE', muted: '#666666', pill: '#242424', pillText: '#EEEEEE', sticker: '#EEEEEE', stickerText: '#141414', brand: '#444444', dot: '#888888' },
];

/* ═══════════════════════════════════════════════════════
   MODES
   ═══════════════════════════════════════════════════════ */
type Mode = 'announcement' | 'free_slots' | 'vacation' | 'promo' | 'review_spotlight' | 'flash_window';

const PREMIUM_MODES = new Set<Mode>(['free_slots', 'vacation', 'promo', 'review_spotlight', 'flash_window']);

const MODES: { id: Mode; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; premium: boolean }[] = [
  { id: 'announcement',     label: 'Анонс',        Icon: Megaphone, premium: false },
  { id: 'free_slots',       label: 'Вікна',        Icon: Clock,     premium: true  },
  { id: 'vacation',         label: 'Відпустка',    Icon: Calendar,  premium: true  },
  { id: 'promo',            label: 'Акція',        Icon: Zap,       premium: true  },
  { id: 'review_spotlight', label: 'Відгук',       Icon: Star,      premium: true  },
  { id: 'flash_window',     label: 'Гаряче вікно', Icon: Flame,     premium: true  },
];

/* ═══════════════════════════════════════════════════════
   ADAPTIVE GRID
   ═══════════════════════════════════════════════════════ */
interface GridCfg { cols: number; gap: number; pillH: number; fontSize: number; fontWeight: number; radius: number; }

function getGridConfig(count: number): GridCfg {
  if (count <= 3) return { cols: 1, gap: 10, pillH: 58, fontSize: 20, fontWeight: 700, radius: 14 };
  if (count <= 8) return { cols: 2, gap: 8,  pillH: 44, fontSize: 15, fontWeight: 600, radius: 12 };
  return              { cols: 3, gap: 6,  pillH: 36, fontSize: 12, fontWeight: 600, radius: 10 };
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
const UA_MONTHS = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
const DOW_KEYS = ['sun','mon','tue','wed','thu','fri','sat'] as const;

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS  = "'Inter', system-ui, -apple-system, sans-serif";

function formatUA(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} ${UA_MONTHS[d.getMonth()]}`;
}

/**
 * Derives available slot times from a pre-fetched ScheduleStore.
 * Single source of truth — identical logic to useBookingScheduleData in BookingWizard:
 *   breaks   = schedule_template.break_start/end  +  workingHours.breaks  (both sources!)
 *   stepMinutes = 15 (same as Wizard)
 *   selectedDate = Date object (timezone-safe, same as Wizard)
 */
function useSlotsFromStore(
  date: string | null,
  durationMin: number,
  bufferMin: number,
  workingHours: Partial<WorkingHoursConfig> | null,
  store: ScheduleStore | undefined,
): string[] {
  return useMemo(() => {
    if (!date || !store || durationMin <= 0) return [];

    const dow = DOW_KEYS[new Date(date + 'T12:00:00').getDay()];
    const tpl = store.templates[dow];
    if (!tpl?.is_working) return [];

    const exc = store.exceptions[date];
    if (exc?.is_day_off) return [];

    // Mirror BookingWizard: merge template break AND workingHours.breaks
    const breaks: TimeRange[] = [
      ...(tpl.break_start && tpl.break_end
        ? [{ start: tpl.break_start.slice(0, 5), end: tpl.break_end.slice(0, 5) }]
        : []),
      ...(workingHours?.breaks ?? []),
    ];

    // Mirror BookingWizard: exc overrides work start/end for short_day
    const workStart = exc?.start_time?.slice(0, 5) ?? tpl.start_time.slice(0, 5);
    const workEnd   = exc?.end_time?.slice(0, 5)   ?? tpl.end_time.slice(0, 5);

    // Pass Date object (same as Wizard) for correct timezone-aware past-cutoff
    const selectedDate = new Date(date + 'T12:00:00');

    return generateAvailableSlots({
      workStart,
      workEnd,
      bookings:          store.bookingsByDate[date] ?? [],
      breaks,
      bufferMinutes:     bufferMin,
      requestedDuration: durationMin,
      stepMinutes:       15,
      selectedDate,
    })
      .filter(s => s.available)
      .map(s => s.time);
  }, [date, durationMin, bufferMin, workingHours, store]);
}

/* ═══════════════════════════════════════════════════════
   DATA HOOKS
   ═══════════════════════════════════════════════════════ */
interface ServiceSlim { id: string; name: string; duration_minutes: number; buffer_minutes: number; emoji: string | null; }

function useServices(masterId: string | null) {
  const [services, setServices] = useState<ServiceSlim[]>([]);
  useEffect(() => {
    if (!masterId) return;
    createClient()
      .from('services')
      .select('id,name,duration_minutes,buffer_minutes,emoji')
      .eq('master_id', masterId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then((res: { data: unknown }) => setServices((res.data as ServiceSlim[]) ?? []));
  }, [masterId]);
  return services;
}

interface FlashDealRow { id: string; service_name: string; original_price: number; discount_pct: number; slot_date: string; slot_time: string; }

function useActiveFlashDeals(masterId: string | null) {
  const [deals, setDeals] = useState<FlashDealRow[]>([]);
  useEffect(() => {
    if (!masterId) return;
    createClient()
      .from('flash_deals')
      .select('id,service_name,original_price,discount_pct,slot_date,slot_time')
      .eq('master_id', masterId).eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }).limit(12)
      .then((res: { data: unknown }) => setDeals((res.data as FlashDealRow[]) ?? []));
  }, [masterId]);
  return deals;
}

interface StarReview { id: string; comment: string; client_name: string; }

function useStarReviews(masterId: string | null) {
  const [reviews, setReviews] = useState<StarReview[]>([]);
  useEffect(() => {
    if (!masterId) return;
    createClient()
      .from('reviews')
      .select('id,comment,client_name')
      .eq('master_id', masterId)
      .eq('rating', 5)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(20)
      .then((res: { data: unknown }) => setReviews((res.data as StarReview[]) ?? []));
  }, [masterId]);
  return reviews;
}

/* ═══════════════════════════════════════════════════════
   PER-MODE UPGRADE COPY
   ═══════════════════════════════════════════════════════ */
interface UpgradeCopy {
  modalTitle: string;
  modalDesc: string;
  overlayTitle: string;
  overlayHint: string;
  teaserTitle: string;
  teaserDesc: string;
}

const MODE_UPGRADE_COPY: Partial<Record<Mode, UpgradeCopy>> = {
  free_slots: {
    modalTitle:   'Покажіть, коли ви вільні',
    modalDesc:    'Генератор автоматично знаходить ваші відкриті слоти і збирає красиву сторіс за секунди — жодного ручного розкладу в Direct.',
    overlayTitle: 'Вільні вікна — тільки PRO',
    overlayHint:  'Автоматичні слоти у сторіс',
    teaserTitle:  'Ваш розклад — у сторіс автоматично',
    teaserDesc:   'Клієнти бачать ваші вільні вікна без жодного повідомлення від вас.',
  },
  vacation: {
    modalTitle:   'Попередьте клієнтів красиво',
    modalDesc:    'Стильна сторіс про відпустку — і ніхто не запишеться на закриті дні. Клієнти бачать дати і самі переносять запис.',
    overlayTitle: 'Відпустка — тільки PRO',
    overlayHint:  'Дати відпустки у сторіс',
    teaserTitle:  'Жодного «а ви працюєте?» у Direct',
    teaserDesc:   'Одна сторіс з датами — і клієнти самі переносять запис.',
  },
  promo: {
    modalTitle:   'Ваші акції продають самі',
    modalDesc:    'Flash Deal у сторіс = слоти закриваються в 2 рази швидше. PRO підключає акції прямо з розкладу за 2 кліки.',
    overlayTitle: 'Flash Deal — тільки PRO',
    overlayHint:  'Акційні слоти у сторіс',
    teaserTitle:  'Флеш-акція, що окупається з першого запису',
    teaserDesc:   'Ваш активний Flash Deal — одразу у сторіс зі знижкою.',
  },
  review_spotlight: {
    modalTitle:   'Відгуки, що продають без слів',
    modalDesc:    'Реальний 5★ відгук у сторіс — це соціальний доказ, сильніший за будь-яку рекламу. PRO підбирає найкращий і верстає за секунду.',
    overlayTitle: 'Review Spotlight — тільки PRO',
    overlayHint:  '5★ відгук у сторіс',
    teaserTitle:  'Ваші клієнти рекламують вас самі',
    teaserDesc:   'Один відгук у сторіс = довіра, яку не купиш за гроші.',
  },
  flash_window: {
    modalTitle:   'Закривайте слоти того ж дня',
    modalDesc:    'Вільний слот зі знижкою у сторіс — і запис заповнюється ще до вечора. Це PRO-маркетинг, який окупається з першого клієнта.',
    overlayTitle: 'Гаряче вікно — тільки PRO',
    overlayHint:  'Слот + знижка у сторіс',
    teaserTitle:  'Порожній слот → заповнений за годину',
    teaserDesc:   'Вкажіть знижку, оберіть час — сторіс готова за 10 секунд.',
  },
};

/* ═══════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════ */
async function exportCanvasPng(node: HTMLElement, filename: string) {
  const [{ toPng }, { saveAs }] = await Promise.all([import('html-to-image'), import('file-saver')]);
  saveAs(await toPng(node, { pixelRatio: 3, cacheBust: true }), filename);
}

/* ═══════════════════════════════════════════════════════
   STORY CANVAS
   ═══════════════════════════════════════════════════════ */
interface CanvasProps {
  pal: Palette;
  mode: Mode;
  showAvatar: boolean;
  avatarBlob: string | null;
  displayName: string;
  slug: string;
  annoText: string;
  slotsDate: string | null;
  slots: string[];
  slotsLoading: boolean;
  selectedServiceName: string | null;
  vacStart: string | null;
  vacEnd: string | null;
  selectedDeal: FlashDealRow | null;
  reviewText: string | null;
  reviewClientName: string | null;
  flashWinSvcName: string | null;
  flashWinDate: string | null;
  flashWinTime: string | null;
  flashWinDiscount: number;
}

function StoryCanvas({
  pal, mode, showAvatar, avatarBlob, displayName, slug,
  annoText, slotsDate, slots, slotsLoading, selectedServiceName,
  vacStart, vacEnd, selectedDeal,
  reviewText, reviewClientName,
  flashWinSvcName, flashWinDate, flashWinTime, flashWinDiscount,
}: CanvasProps) {
  const avatarBlockH = showAvatar ? 110 : 0;
  const contentTop   = 50 + avatarBlockH + 10;

  const label = (text: string, extra?: React.CSSProperties): React.ReactNode => (
    <p style={{
      margin: 0, fontFamily: SANS,
      fontSize: 9, fontWeight: 700,
      letterSpacing: '0.22em', textTransform: 'uppercase',
      color: pal.muted,
      ...extra,
    }}>
      {text}
    </p>
  );

  const slotGrid = (): React.ReactNode => {
    if (slotsLoading)    return <p style={{ margin: 0, fontSize: 12, color: pal.muted, fontFamily: SANS }}>Завантаження…</p>;
    if (!slotsDate)      return <p style={{ margin: 0, fontSize: 11, color: pal.muted, fontStyle: 'italic', fontFamily: SANS }}>Оберіть дату</p>;
    if (slots.length === 0) return <p style={{ margin: 0, fontSize: 11, color: pal.muted, fontStyle: 'italic', fontFamily: SANS }}>Немає вільних місць</p>;
    const cfg = getGridConfig(slots.length);
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cfg.cols}, 1fr)`, gap: cfg.gap }}>
        {slots.map(s => (
          <div key={s} style={{
            height: cfg.pillH, borderRadius: cfg.radius,
            background: pal.pill,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: cfg.fontSize, fontWeight: cfg.fontWeight,
            color: pal.pillText, fontFamily: SANS, letterSpacing: '0.01em',
          }}>
            {s}
          </div>
        ))}
      </div>
    );
  };

  let content: React.ReactNode = null;

  if (mode === 'announcement') {
    const fs = annoText.length > 80 ? 18 : annoText.length > 40 ? 22 : 27;
    content = (
      <>
        {label('Оголошення', { marginBottom: 20 })}
        <p style={{ margin: 0, fontSize: fs, fontFamily: SERIF, fontWeight: 700, color: pal.text, lineHeight: 1.35, letterSpacing: '-0.01em' }}>
          {annoText || '…'}
        </p>
      </>
    );
  }

  if (mode === 'free_slots') {
    const day   = slotsDate ? new Date(slotsDate + 'T12:00:00').getDate() : '—';
    const month = slotsDate ? UA_MONTHS[new Date(slotsDate + 'T12:00:00').getMonth()] : '';
    content = (
      <>
        {label('Вільні вікна', { marginBottom: 12 })}
        <p style={{ margin: 0, fontSize: 56, fontFamily: SERIF, fontWeight: 700, color: pal.text, lineHeight: 0.9, letterSpacing: '-0.03em' }}>
          {day}
        </p>
        <p style={{ margin: 0, marginBottom: selectedServiceName ? 14 : 20, fontSize: 17, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, color: pal.muted, letterSpacing: '0.02em' }}>
          {month}
        </p>
        {selectedServiceName && (
          <div style={{ marginBottom: 16 }}>
            {label('Послуга', { marginBottom: 4 })}
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: pal.text, fontFamily: SANS, letterSpacing: '-0.01em' }}>
              {selectedServiceName}
            </p>
          </div>
        )}
        {slotGrid()}
      </>
    );
  }

  if (mode === 'vacation') {
    const from = vacStart ? formatUA(vacStart) : '—';
    const to   = vacEnd   ? formatUA(vacEnd)   : '—';
    content = (
      <>
        {label('Відпустка', { marginBottom: 22 })}
        <p style={{ margin: 0, marginBottom: 2, fontSize: 11, color: pal.muted, fontFamily: SANS, fontWeight: 500 }}>з</p>
        <p style={{ margin: 0, marginBottom: 6, fontSize: 42, fontFamily: SERIF, fontWeight: 700, color: pal.text, lineHeight: 1.0, letterSpacing: '-0.02em' }}>
          {from}
        </p>
        <p style={{ margin: 0, marginBottom: 2, fontSize: 11, color: pal.muted, fontFamily: SANS, fontWeight: 500 }}>по</p>
        <p style={{ margin: 0, marginBottom: 26, fontSize: 42, fontFamily: SERIF, fontWeight: 700, color: pal.text, lineHeight: 1.0, letterSpacing: '-0.02em' }}>
          {to}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: pal.muted, fontStyle: 'italic', fontFamily: SANS }}>
          Записуйтесь заздалегідь
        </p>
      </>
    );
  }

  if (mode === 'promo') {
    if (!selectedDeal) {
      content = (
        <>
          {label('Flash Deal', { marginBottom: 18 })}
          <p style={{ margin: 0, fontSize: 12, color: pal.muted, fontStyle: 'italic', fontFamily: SANS }}>Оберіть Flash Deal зі списку</p>
        </>
      );
    } else {
      const orig     = selectedDeal.original_price / 100;
      const newPrice = Math.round(orig * (1 - selectedDeal.discount_pct / 100));
      content = (
        <>
          {label('Flash Deal', { marginBottom: 18 })}
          <p style={{ margin: 0, marginBottom: 18, fontSize: 20, fontFamily: SERIF, fontWeight: 700, color: pal.text, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
            {selectedDeal.service_name}
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 400, color: pal.muted, textDecoration: 'line-through', fontFamily: SANS }}>{orig}₴</span>
            <span style={{ fontSize: 48, fontFamily: SERIF, fontWeight: 700, color: pal.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{newPrice}₴</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: pal.pill, borderRadius: 8, padding: '5px 12px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: pal.pillText, letterSpacing: '0.08em', fontFamily: SANS }}>−{selectedDeal.discount_pct}%</span>
            {selectedDeal.slot_date && (
              <span style={{ fontSize: 10, color: pal.muted, fontFamily: SANS }}>
                · {formatUA(selectedDeal.slot_date)} {selectedDeal.slot_time?.slice(0, 5) || ''}
              </span>
            )}
          </div>
        </>
      );
    }
  }

  if (mode === 'review_spotlight') {
    if (!reviewText) {
      content = (
        <>
          {label('Відгук клієнта', { marginBottom: 18 })}
          <p style={{ margin: 0, fontSize: 12, color: pal.muted, fontStyle: 'italic', fontFamily: SANS }}>
            Оберіть відгук зі списку нижче
          </p>
        </>
      );
    } else {
      const fs = reviewText.length > 120 ? 14 : reviewText.length > 60 ? 17 : 21;
      content = (
        <>
          {label('Відгук клієнта', { marginBottom: 16 })}
          <p style={{ margin: 0, marginBottom: 16, fontSize: 20, color: '#D4935A', letterSpacing: 3, fontFamily: SANS }}>
            ★★★★★
          </p>
          <p style={{ margin: 0, marginBottom: 20, fontSize: fs, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, color: pal.text, lineHeight: 1.5, letterSpacing: '-0.005em' }}>
            «{reviewText}»
          </p>
          {reviewClientName && (
            <p style={{ margin: 0, fontSize: 11, color: pal.muted, fontFamily: SANS, fontWeight: 600, letterSpacing: '0.02em' }}>
              — {reviewClientName}
            </p>
          )}
        </>
      );
    }
  }

  if (mode === 'flash_window') {
    if (!flashWinSvcName || !flashWinTime) {
      content = (
        <>
          {label('Гаряче вікно', { marginBottom: 18 })}
          <p style={{ margin: 0, fontSize: 12, color: pal.muted, fontStyle: 'italic', fontFamily: SANS }}>
            Оберіть послугу, дату та час
          </p>
        </>
      );
    } else {
      const fwDay   = flashWinDate ? new Date(flashWinDate + 'T12:00:00').getDate() : '';
      const fwMonth = flashWinDate ? UA_MONTHS[new Date(flashWinDate + 'T12:00:00').getMonth()] : '';
      content = (
        <>
          {label('Гаряче вікно', { marginBottom: 14 })}
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#C05B5B', borderRadius: 10, padding: '7px 16px', marginBottom: 18 }}>
            <span style={{ fontSize: 26, fontFamily: SERIF, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
              −{flashWinDiscount}%
            </span>
          </div>
          <p style={{ margin: 0, marginBottom: 14, fontSize: 20, fontFamily: SERIF, fontWeight: 700, color: pal.text, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
            {flashWinSvcName}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: pal.pill, borderRadius: 8, padding: '5px 12px' }}>
              <span style={{ fontSize: 12, fontFamily: SANS, fontWeight: 700, color: pal.pillText }}>
                {fwDay} {fwMonth}
              </span>
            </div>
            <div style={{ background: pal.pill, borderRadius: 8, padding: '5px 12px' }}>
              <span style={{ fontSize: 12, fontFamily: SANS, fontWeight: 700, color: pal.pillText }}>
                {flashWinTime}
              </span>
            </div>
          </div>
        </>
      );
    }
  }

  return (
    <div style={{
      width: 360, height: 640,
      position: 'relative', overflow: 'hidden',
      background: pal.bg, fontFamily: SANS, userSelect: 'none',
    }}>
      <div style={{ position: 'absolute', top: 18, left: 22, display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: pal.brand, letterSpacing: '0.04em' }}>Bookit</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: pal.dot, marginLeft: 1 }}>.</span>
      </div>

      {showAvatar && (
        <div style={{
          position: 'absolute', top: 44, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            overflow: 'hidden', background: pal.pill,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {avatarBlob
              ? <img src={avatarBlob} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <span style={{ fontSize: 28, lineHeight: 1 }}>👤</span>
            }
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: pal.text, letterSpacing: '-0.01em', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </span>
        </div>
      )}

      <div style={{ position: 'absolute', top: contentTop, left: 28, right: 28, bottom: 120 }}>
        {content}
      </div>

      <div style={{
        position: 'absolute', bottom: 58, left: '50%', transform: 'translateX(-50%)',
        background: pal.sticker, borderRadius: 24, padding: '10px 24px',
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.13)', whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 14 }}>🔗</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: pal.stickerText, letterSpacing: '0.01em' }}>
          Записатися онлайн
        </span>
      </div>

      <div style={{ position: 'absolute', bottom: 26, left: 0, right: 0, textAlign: 'center' }}>
        <span style={{ fontSize: 9, color: pal.brand, letterSpacing: '0.08em', fontWeight: 500 }}>
          bookit.com.ua/{slug}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 12,
  background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.85)',
  fontSize: 13, color: '#2C1A14', outline: 'none', boxSizing: 'border-box',
};

export function StoryGenerator() {
  const { profile, masterProfile } = useMasterContext();
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [palIdx,     setPalIdx]     = useState(0);
  const [mode,       setMode]       = useState<Mode>('announcement');
  const [showAvatar, setShowAvatar] = useState(true);
  const [exporting,  setExporting]  = useState(false);
  const [exported,   setExported]   = useState(false);

  // Free text
  const [annoText,      setAnnoText]      = useState('Тепер до мене можна записатися онлайн 24/7.');
  // Free slots
  const [slotsDate,     setSlotsDate]     = useState<string | null>(null);
  const [selectedSvcId, setSelectedSvcId] = useState<string | null>(null);
  // Vacation
  const [vacStart,      setVacStart]      = useState<string | null>(null);
  const [vacEnd,        setVacEnd]        = useState<string | null>(null);
  // Promo (flash deal)
  const [dealIdx,       setDealIdx]       = useState(0);
  // Review Spotlight
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  // Flash Window
  const [flashWinSvcId,   setFlashWinSvcId]   = useState<string | null>(null);
  const [flashWinDate,    setFlashWinDate]    = useState<string | null>(null);
  const [flashWinTime,    setFlashWinTime]    = useState<string | null>(null);
  const [flashWinDiscount, setFlashWinDiscount] = useState(20);

  // Blur tease
  const [blurActive,       setBlurActive]       = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isStarterPlan = (masterProfile?.subscription_tier ?? 'starter') === 'starter';

  // Called on every control interaction — resets blur to 3s after last change
  const onControlChange = useCallback(() => {
    if (!PREMIUM_MODES.has(mode) || !isStarterPlan) return;
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setBlurActive(false);
    blurTimerRef.current = setTimeout(() => setBlurActive(true), 3_000);
  }, [mode, isStarterPlan]);

  // On mode switch: give 10s to configure before blur kicks in
  useEffect(() => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);

    if (PREMIUM_MODES.has(mode) && isStarterPlan) {
      setBlurActive(false);
      blurTimerRef.current = setTimeout(() => setBlurActive(true), 10_000);
    } else {
      setBlurActive(false);
    }

    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, [mode, isStarterPlan]);

  // Avatar as base64
  const [avatarBlob, setAvatarBlob] = useState<string | null>(null);
  const avatarUrl = profile?.avatar_url ?? null;
  useEffect(() => {
    if (!avatarUrl) { setAvatarBlob(null); return; }
    let cancelled = false;
    fetch(avatarUrl)
      .then(r => r.blob())
      .then(b => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(b);
      }))
      .then(dataUrl => { if (!cancelled) setAvatarBlob(dataUrl); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [avatarUrl]);

  const masterId    = masterProfile?.id ?? profile?.id ?? null;
  const displayName = masterProfile?.business_name || profile?.full_name || "Ваше ім'я";
  const slug        = masterProfile?.slug ?? 'bookit';

  const services    = useServices(masterId);
  const selectedSvc = services.find(s => s.id === selectedSvcId) ?? null;
  const flashWinSvc = services.find(s => s.id === flashWinSvcId) ?? null;

  // Single source of truth — same store as BookingWizard, covers 60 days ahead
  const todayStr  = new Date().toISOString().slice(0, 10);
  const futureStr = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: scheduleStore, isLoading: scheduleLoading } = useWizardSchedule(masterId, todayStr, futureStr);

  // Derive buffer + timezone from context (no extra DB fetch needed)
  const wh        = (masterProfile?.working_hours as Partial<WorkingHoursConfig> | null) ?? {};
  const bufferMin = wh.buffer_time_minutes ?? 0;

  // Free slots for "Вікна" mode
  const slots = useSlotsFromStore(
    mode === 'free_slots' ? slotsDate : null,
    selectedSvc?.duration_minutes ?? 60,
    bufferMin, wh, scheduleStore,
  );
  const slotsLoading = scheduleLoading;

  // Free slots for "Гаряче вікно" mode — same store, zero extra requests
  const flashWinSlots = useSlotsFromStore(
    mode === 'flash_window' ? flashWinDate : null,
    flashWinSvc?.duration_minutes ?? 60,
    bufferMin, wh, scheduleStore,
  );
  const flashWinSlotsLoading = scheduleLoading;

  const flashDeals    = useActiveFlashDeals(masterId);
  const starReviews   = useStarReviews(masterId);
  const pal           = PALETTES[palIdx];
  const selectedDeal  = flashDeals[dealIdx] ?? null;

  const selectedReview = starReviews.find(r => r.id === selectedReviewId) ?? null;

  // Auto-select first service and first review
  useEffect(() => {
    if (services.length > 0 && !selectedSvcId)  setSelectedSvcId(services[0].id);
    if (services.length > 0 && !flashWinSvcId)  setFlashWinSvcId(services[0].id);
  }, [services, selectedSvcId, flashWinSvcId]);
  useEffect(() => {
    if (starReviews.length > 0 && !selectedReviewId) setSelectedReviewId(starReviews[0].id);
  }, [starReviews, selectedReviewId]);

  // Reset slot time when date or service changes
  useEffect(() => { setFlashWinTime(null); }, [flashWinDate, flashWinSvcId]);

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current || exporting) return;
    setExporting(true);
    const node = canvasRef.current;

    node.style.top    = '0px';
    node.style.left   = '0px';
    node.style.zIndex = '-1';
    await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));

    try {
      await exportCanvasPng(node, `bookit-story-${mode}-${Date.now()}.png`);
      setExported(true);
      setTimeout(() => setExported(false), 2600);
      showToast({ type: 'success', title: 'Сторі збережено!', message: '1080×1920 px готово для Instagram' });
    } catch (e) {
      console.error('[StoryGenerator]', e);
      showToast({ type: 'error', title: 'Помилка експорту', message: e instanceof Error ? e.message : 'Спробуйте ще раз' });
    } finally {
      node.style.top    = '-9999px';
      node.style.left   = '-9999px';
      node.style.zIndex = '';
      setExporting(false);
    }
  }, [exporting, mode, showToast]);

  const handleDownloadOrUpgrade = useCallback(async () => {
    if (PREMIUM_MODES.has(mode) && isStarterPlan) {
      setShowUpgradeModal(true);
      return;
    }
    await handleDownload();
  }, [mode, isStarterPlan, handleDownload]);

  const isPremiumLocked = PREMIUM_MODES.has(mode) && isStarterPlan;
  const upgradeCopy = MODE_UPGRADE_COPY[mode] ?? null;

  /* Canvas data props */
  const canvasSharedProps = {
    pal, mode, showAvatar, avatarBlob, displayName, slug,
    annoText, slotsDate, slots, slotsLoading,
    selectedServiceName: selectedSvc?.name ?? null,
    vacStart, vacEnd, selectedDeal,
    reviewText: selectedReview?.comment ?? null,
    reviewClientName: selectedReview?.client_name ?? null,
    flashWinSvcName: flashWinSvc?.name ?? null,
    flashWinDate,
    flashWinTime,
    flashWinDiscount,
  };

  /* Controls */
  const controls = (
    <div className="space-y-3">
      {mode === 'announcement' && (
        <div>
          <label className="text-xs font-semibold text-[#6B5750] mb-1.5 block">Текст публікації</label>
          <textarea
            value={annoText} onChange={e => { setAnnoText(e.target.value); onControlChange(); }}
            rows={5} maxLength={200} placeholder="Ваш текст…"
            className="resize-none outline-none text-sm transition-all"
            style={{ ...INPUT_STYLE, height: 'auto' }}
          />
          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-[#A8928D]">{annoText.length}/200</span>
          </div>
        </div>
      )}

      {mode === 'free_slots' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#6B5750] mb-1.5 block">Послуга</label>
            {services.length === 0 ? (
              <div className="px-4 py-3 rounded-2xl text-xs text-[#A8928D]" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.85)' }}>
                Немає активних послуг. Додайте у розділі{' '}
                <span className="font-semibold text-[#789A99]">Послуги</span>.
              </div>
            ) : (
              <select value={selectedSvcId ?? ''} onChange={e => { setSelectedSvcId(e.target.value || null); onControlChange(); }} className="outline-none text-sm cursor-pointer" style={INPUT_STYLE}>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.emoji ? `${s.emoji} ` : ''}{s.name} ({s.duration_minutes} хв)</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-[#6B5750] mb-1.5 block">Дата</label>
            <input type="date" value={slotsDate ?? ''} min={todayStr} onChange={e => { setSlotsDate(e.target.value || null); onControlChange(); }} className="outline-none text-sm" style={INPUT_STYLE} />
            {slotsDate && !slotsLoading && (
              <p className={`text-[11px] mt-1.5 font-medium ${slots.length > 0 ? 'text-[#5C9E7A]' : 'text-[#A8928D]'}`}>
                {slots.length > 0 ? `${slots.length} вільних вікон знайдено` : 'Немає вільних вікон'}
              </p>
            )}
          </div>
        </div>
      )}

      {mode === 'vacation' && (
        <div className="space-y-2.5">
          <div>
            <label className="text-xs font-semibold text-[#6B5750] mb-1.5 block">З якого числа</label>
            <input type="date" value={vacStart ?? ''} onChange={e => { setVacStart(e.target.value || null); onControlChange(); }} className="outline-none text-sm" style={INPUT_STYLE} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#6B5750] mb-1.5 block">По яке число</label>
            <input type="date" value={vacEnd ?? ''} min={vacStart ?? ''} onChange={e => { setVacEnd(e.target.value || null); onControlChange(); }} className="outline-none text-sm" style={INPUT_STYLE} />
          </div>
        </div>
      )}

      {mode === 'promo' && (
        <div>
          <label className="text-xs font-semibold text-[#6B5750] mb-1.5 block">Активна Flash Deal</label>
          {flashDeals.length === 0 ? (
            <div className="px-4 py-3 rounded-2xl text-xs text-[#A8928D]" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.85)' }}>
              Немає активних флеш-акцій. Створіть у{' '}
              <span className="font-semibold text-[#789A99]">Дохід → Flash Deals</span>.
            </div>
          ) : (
            <select value={dealIdx} onChange={e => { setDealIdx(Number(e.target.value)); onControlChange(); }} className="outline-none text-sm cursor-pointer" style={INPUT_STYLE}>
              {flashDeals.map((d, i) => (
                <option key={d.id} value={i}>
                  {d.service_name} · {Math.round(d.original_price / 100 * (1 - d.discount_pct / 100))}₴ (−{d.discount_pct}%)
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {mode === 'review_spotlight' && (
        <div>
          <label className="text-xs font-semibold text-[#6B5750] mb-1.5 block">5★ відгук клієнта</label>
          {starReviews.length === 0 ? (
            <div className="px-4 py-3 rounded-2xl text-xs text-[#A8928D]" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.85)' }}>
              Немає опублікованих 5★ відгуків. Попросіть клієнта залишити відгук після запису.
            </div>
          ) : (
            <select value={selectedReviewId ?? ''} onChange={e => { setSelectedReviewId(e.target.value || null); onControlChange(); }} className="outline-none text-sm cursor-pointer" style={INPUT_STYLE}>
              {starReviews.map(r => (
                <option key={r.id} value={r.id}>
                  {r.client_name} — {(r.comment ?? '').slice(0, 40)}{(r.comment ?? '').length > 40 ? '…' : ''}
                </option>
              ))}
            </select>
          )}
          {selectedReview?.comment && (
            <p className="text-[11px] text-[#6B5750] mt-2 leading-relaxed px-1 line-clamp-3">
              «{selectedReview.comment}»
            </p>
          )}
        </div>
      )}

      {mode === 'flash_window' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#6B5750] mb-1.5 block">Послуга</label>
            {services.length === 0 ? (
              <div className="px-4 py-3 rounded-2xl text-xs text-[#A8928D]" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.85)' }}>
                Немає активних послуг.
              </div>
            ) : (
              <select value={flashWinSvcId ?? ''} onChange={e => { setFlashWinSvcId(e.target.value || null); onControlChange(); }} className="outline-none text-sm cursor-pointer" style={INPUT_STYLE}>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.emoji ? `${s.emoji} ` : ''}{s.name} ({s.duration_minutes} хв)</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-[#6B5750] mb-1.5 block">Дата</label>
            <input type="date" value={flashWinDate ?? ''} min={todayStr} onChange={e => { setFlashWinDate(e.target.value || null); onControlChange(); }} className="outline-none text-sm" style={INPUT_STYLE} />
          </div>
          {flashWinDate && (
            <div>
              <label className="text-xs font-semibold text-[#6B5750] mb-1.5 block">Час слоту</label>
              {flashWinSlotsLoading ? (
                <p className="text-[11px] text-[#A8928D]">Завантаження…</p>
              ) : flashWinSlots.length === 0 ? (
                <p className="text-[11px] text-[#A8928D]">Немає вільних вікон на цей день</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {flashWinSlots.map(s => (
                    <button
                      key={s} type="button"
                      onClick={() => { setFlashWinTime(s); onControlChange(); }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      style={flashWinTime === s
                        ? { background: 'linear-gradient(135deg,#789A99,#5C7E7D)', color: '#fff', boxShadow: '0 2px 8px rgba(120,154,153,0.35)' }
                        : { background: 'rgba(255,255,255,0.70)', color: '#6B5750', border: '1px solid rgba(255,255,255,0.85)' }
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-[#6B5750] mb-1.5 block">
              Знижка: <span className="text-[#C05B5B] font-bold">−{flashWinDiscount}%</span>
            </label>
            <input
              type="range" min={5} max={70} step={5}
              value={flashWinDiscount}
              onChange={e => { setFlashWinDiscount(Number(e.target.value)); onControlChange(); }}
              className="w-full cursor-pointer"
              style={{ accentColor: '#C05B5B' }}
            />
            <div className="flex justify-between text-[10px] text-[#A8928D] mt-0.5">
              <span>5%</span><span>70%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const isBlurLocked = isPremiumLocked && blurActive;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      <div>
        <h1 className="font-display text-2xl font-semibold text-[#2C1A14]">Конструктор Сторіс</h1>
        <p className="text-sm text-[#A8928D] mt-0.5">Шаблони сторіс · 6 палітр · Експорт 1080×1920 для Instagram</p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {MODES.map(m => {
          const active = m.id === mode;
          const Icon   = m.Icon;
          return (
            <button key={m.id} type="button" onClick={() => setMode(m.id)}
              className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0"
              style={active
                ? { background: 'linear-gradient(135deg,#789A99,#5C7E7D)', color: '#fff', boxShadow: '0 4px 12px rgba(120,154,153,0.35)' }
                : { background: 'rgba(255,255,255,0.70)', color: '#6B5750', border: '1px solid rgba(255,255,255,0.85)' }
              }
            >
              <Icon size={13} strokeWidth={2.5} />
              {m.label}
              {m.premium && (
                <span className="ml-0.5 text-[9px] font-bold px-1 py-0.5 rounded-md"
                  style={{ background: active ? 'rgba(255,255,255,0.25)' : 'rgba(212,147,90,0.15)', color: active ? '#fff' : '#D4935A' }}>
                  PRO
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row gap-5 items-start">

        {/* Controls column */}
        <div className="flex-1 space-y-4 w-full">

          <div>
            <p className="text-xs font-semibold text-[#6B5750] mb-2">Палітра</p>
            <div className="flex gap-2.5 flex-wrap">
              {PALETTES.map((p, i) => (
                <button key={p.id} type="button" title={p.label}
                  onClick={() => setPalIdx(i)}
                  className="relative w-8 h-8 rounded-full transition-all cursor-pointer"
                  style={{
                    background: p.bg,
                    border: i === palIdx ? '2.5px solid #789A99' : `2px solid ${p.muted}`,
                    boxShadow: i === palIdx ? '0 0 0 2px rgba(120,154,153,0.28)' : undefined,
                  }}
                >
                  {i === palIdx && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Check size={12} style={{ color: p.text }} strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
              <span className="self-center text-xs text-[#A8928D] ml-1">{PALETTES[palIdx].label}</span>
            </div>
          </div>

          {controls}

          {/* Inline teaser banner — shown to Starter on any premium mode */}
          <AnimatePresence>
            {isPremiumLocked && upgradeCopy && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className="rounded-2xl px-4 py-3.5 flex items-start gap-3 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg,rgba(212,147,90,0.10),rgba(120,154,153,0.08))',
                  border: '1px solid rgba(212,147,90,0.30)',
                }}
                onClick={() => setShowUpgradeModal(true)}
              >
                <span className="text-sm leading-none mt-0.5 shrink-0">✨</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#2C1A14] mb-0.5">{upgradeCopy.teaserTitle}</p>
                  <p className="text-[11px] text-[#6B5750] leading-relaxed">{upgradeCopy.teaserDesc}</p>
                </div>
                <span
                  className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-xl self-center"
                  style={{ background: 'rgba(212,147,90,0.18)', color: '#D4935A' }}
                >
                  PRO →
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button" onClick={() => setShowAvatar(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(255,255,255,0.85)' }}
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-[#2C1A14]">Показувати фото</p>
              <p className="text-[11px] text-[#A8928D]">Аватар та ім'я майстра</p>
            </div>
            {showAvatar
              ? <ToggleRight size={26} className="text-[#789A99] shrink-0" strokeWidth={1.8} />
              : <ToggleLeft  size={26} className="text-[#A8928D] shrink-0" strokeWidth={1.8} />
            }
          </button>

          {/* Download / Unlock button */}
          <motion.button
            whileTap={{ scale: 0.97 }} type="button"
            onClick={handleDownloadOrUpgrade}
            disabled={exporting}
            className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 cursor-pointer"
            style={isBlurLocked
              ? { background: 'linear-gradient(135deg,#D4935A,#C07840)', color: '#fff', boxShadow: '0 6px 20px rgba(212,147,90,0.38)' }
              : exported
                ? { background: 'linear-gradient(135deg,#5C9E7A,#4A8A68)', color: '#fff', boxShadow: '0 6px 20px rgba(92,158,122,0.35)' }
                : { background: 'linear-gradient(135deg,#2C1A14,#4A2E26)', color: '#fff', boxShadow: '0 6px 20px rgba(44,26,20,0.28)' }
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              {exporting ? (
                <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Генеруємо…
                </motion.span>
              ) : isBlurLocked ? (
                <motion.span key="u" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Lock size={16} /> Розблокувати на PRO
                </motion.span>
              ) : isPremiumLocked ? (
                <motion.span key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Download size={16} /> Завантажити
                </motion.span>
              ) : exported ? (
                <motion.span key="d" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Check size={16} strokeWidth={3} /> Збережено!
                </motion.span>
              ) : (
                <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Download size={16} /> Завантажити для Сторіс
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <p className="text-[10px] text-[#A8928D] text-center -mt-1">
            {isPremiumLocked ? 'Шаблон PRO · Оновіть тариф для збереження' : '1080×1920 px · ідеально для Instagram Stories'}
          </p>
        </div>

        {/* Preview column */}
        <div className="shrink-0 mx-auto md:mx-0">
          <p className="text-[10px] font-semibold text-[#A8928D] uppercase tracking-wider mb-2 text-center">
            Попередній перегляд
          </p>

          <div style={{ position: 'relative', width: 252, height: 448 }}>
            {/* Canvas preview with blur tease */}
            <div style={{
              width: 252, height: 448, overflow: 'hidden',
              borderRadius: 20,
              filter: isBlurLocked ? 'blur(10px)' : 'none',
              transition: 'filter 0.6s ease',
              boxShadow: '0 16px 48px rgba(44,26,20,0.22)',
            }}>
              <div style={{ transform: 'scale(0.7)', transformOrigin: 'top left', pointerEvents: 'none' }}>
                <StoryCanvas {...canvasSharedProps} />
              </div>
            </div>

            {/* Blur overlay badge */}
            <AnimatePresence>
              {isBlurLocked && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="absolute inset-0 flex items-center justify-center rounded-[20px]"
                  style={{ background: 'rgba(44,26,20,0.12)' }}
                >
                  <div
                    className="flex flex-col items-center gap-2 px-5 py-4 rounded-2xl text-center"
                    style={{ background: 'rgba(44,26,20,0.84)', backdropFilter: 'blur(4px)', maxWidth: 200 }}
                  >
                    <Lock size={18} strokeWidth={2.5} style={{ color: '#D4935A' }} />
                    <span className="text-white text-[11px] font-bold tracking-wide leading-tight">
                      {upgradeCopy?.overlayTitle ?? 'Доступно в PRO'}
                    </span>
                    <span className="text-white/55 text-[10px] leading-snug">
                      {upgradeCopy?.overlayHint ?? '700 ₴/міс'}
                    </span>
                    <span
                      className="text-[10px] font-bold px-3 py-1 rounded-full mt-0.5"
                      style={{ background: 'rgba(212,147,90,0.25)', color: '#F5C08A' }}
                    >
                      Перейти на PRO →
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 3-second countdown hint for starter on premium mode */}
            {isPremiumLocked && !blurActive && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <span className="text-[9px] text-[#A8928D] bg-white/80 rounded-full px-2 py-0.5">
                  Перегляд · 10 сек
                </span>
              </div>
            )}
          </div>

          {/* Hidden capture target */}
          <div
            ref={canvasRef}
            aria-hidden="true"
            style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: 360, height: 640, pointerEvents: 'none' }}
          >
            <StoryCanvas {...canvasSharedProps} />
          </div>
        </div>
      </div>

      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        source="marketing"
        feature={upgradeCopy?.modalTitle}
        description={upgradeCopy?.modalDesc}
      />
    </div>
  );
}
