'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Loader2, Check, ToggleLeft, ToggleRight, X,
  Megaphone, Clock, Calendar, Zap, Star, Flame, Lock, Plus,
} from 'lucide-react';
import { useMasterContext } from '@/lib/supabase/context';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast/context';
import { UpgradePromptModal } from '@/components/shared/UpgradePromptModal';
import { useWizardSchedule, type ScheduleStore } from '@/lib/supabase/hooks/useWizardSchedule';
import { usePortfolioItems } from '@/lib/supabase/hooks/usePortfolioItems';
import { generateAvailableSlots, type TimeRange } from '@/lib/utils/smartSlots';
import type { PortfolioItemFull, WorkingHoursConfig } from '@/types/database';
import { parseError } from '@/lib/utils/errors';

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
type Mode = 'announcement' | 'free_slots' | 'vacation' | 'promo' | 'review_spotlight' | 'flash_window' | 'portfolio_item';

const PREMIUM_MODES = new Set<Mode>(['free_slots', 'vacation', 'promo', 'review_spotlight', 'flash_window', 'portfolio_item']);

const MODES: { id: Mode; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; premium: boolean }[] = [
  { id: 'announcement',     label: 'Анонс',        Icon: Megaphone, premium: false },
  { id: 'free_slots',       label: 'Вікна',        Icon: Clock,     premium: true  },
  { id: 'vacation',         label: 'Відпустка',    Icon: Calendar,  premium: true  },
  { id: 'promo',            label: 'Акція',        Icon: Zap,       premium: true  },
  { id: 'review_spotlight', label: 'Відгук',       Icon: Star,      premium: true  },
  { id: 'flash_window',     label: 'Гаряче вікно', Icon: Flame,     premium: true  },
  { id: 'portfolio_item',   label: 'Робота',       Icon: Star,      premium: true  },
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

const SANS  = "var(--font-inter, 'Inter'), system-ui, sans-serif";
const SERIF = "var(--font-playfair, 'Playfair Display'), Georgia, serif";

function formatUA(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} ${UA_MONTHS[d.getMonth()]}`;
}

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

    const breaks: TimeRange[] = [
      ...(tpl.break_start && tpl.break_end
        ? [{ start: tpl.break_start.slice(0, 5), end: tpl.break_end.slice(0, 5) }]
        : []),
      ...(workingHours?.breaks ?? []),
    ];

    const workStart = exc?.start_time?.slice(0, 5) ?? tpl.start_time.slice(0, 5);
    const workEnd   = exc?.end_time?.slice(0, 5)   ?? tpl.end_time.slice(0, 5);

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
  portfolio_item: {
    modalTitle:   'Ваші роботи — ваша візитка',
    modalDesc:    'Створюйте професійні анонси ваших найкращих робіт прямо з портфоліо. PRO-шаблон робить фото ще привабливішими для клієнтів.',
    overlayTitle: 'Робота з портфоліо — тільки PRO',
    overlayHint:  'Преміум-шаблон для ваших робіт',
    teaserTitle:  'Фото, що приносять нові записи',
    teaserDesc:   'Оберіть роботу — і сторіс готова. Ваші клієнти оцінять професійний підхід.',
  },
};

/* ═══════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════ */
async function exportCanvasPng(node: HTMLElement, filename: string) {
  const [{ domToCanvas }, { saveAs }] = await Promise.all([import('modern-screenshot'), import('file-saver')]);
  
  console.log('[StoryGenerator] Starting capture (modern-canvas)...', { 
    nodeWidth: node.offsetWidth, 
    nodeHeight: node.offsetHeight,
  });

  // Ensure all images are decoded before capture
  const imgs = Array.from(node.querySelectorAll('img'));
  const bgImgs = Array.from(node.querySelectorAll('*')).filter(el => (el as HTMLElement).style.backgroundImage);
  
  console.log(`[StoryGenerator] Found ${imgs.length} images and ${bgImgs.length} bg images to decode`);

  try {
    await Promise.race([
      Promise.all(imgs.map(img => img.complete ? Promise.resolve() : img.decode().catch(() => {}))),
      new Promise(r => setTimeout(r, 2000))
    ]);

    const canvas = await domToCanvas(node, { 
      scale: 2, 
      width: 360,
      height: 640,
      backgroundColor: '#ffffff',
    });
    
    const dataUrl = canvas.toDataURL('image/png');
    
    if (!dataUrl || dataUrl.length < 10000) {
      throw new Error(`Invalid dataUrl generated (length: ${dataUrl?.length ?? 0})`);
    }

    console.log('[StoryGenerator] Capture success, dataUrl length:', dataUrl.length, 'Prefix:', dataUrl.slice(0, 50));
    saveAs(dataUrl, filename);
  } catch (err) {
    console.error('[StoryGenerator] Capture failed deeply:', err);
    throw err;
  }
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
  bgPhotoUrl: string | null;
  portfolioTitle: string | null;
  portfolioDesc: string | null;
  platePos: 'top' | 'center' | 'bottom';
  textAlign: 'left' | 'center' | 'right';
  transparency: number;
  isExporting?: boolean;
}

function StoryCanvas({
  pal, mode, showAvatar, avatarBlob, displayName, slug,
  annoText, slotsDate, slots, slotsLoading, selectedServiceName,
  vacStart, vacEnd, selectedDeal,
  reviewText, reviewClientName,
  flashWinSvcName, flashWinDate, flashWinTime, flashWinDiscount,
  bgPhotoUrl, portfolioTitle, portfolioDesc,
  platePos, textAlign, transparency,
  isExporting = false,
}: CanvasProps) {
  if (isExporting) {
    console.log('[StoryCanvas] Rendering for export:', {
      hasBg: !!bgPhotoUrl,
      hasAvatar: !!avatarBlob,
      avatarLen: avatarBlob?.length ?? 0,
      bgLen: bgPhotoUrl?.length ?? 0,
    });
  }
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

  let content: React.ReactNode = null;

  if (mode === 'announcement') {
    content = (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, fontFamily: SERIF, color: pal.text, opacity: 0.1, lineHeight: 0.1, marginBottom: 5 }}>“</div>
        <div style={{ 
          fontSize: annoText.length > 100 ? 18 : 24, 
          fontWeight: 700, fontFamily: SERIF, color: pal.text, 
          lineHeight: 1.4, letterSpacing: '-0.01em', fontStyle: 'italic',
          padding: '0 10px'
        }}>
          {annoText || "Ваше особливе повідомлення для клієнтів…"}
        </div>
        <div style={{ fontSize: 48, fontFamily: SERIF, color: pal.text, opacity: 0.1, lineHeight: 0.1, marginTop: 20, textAlign: 'right' }}>”</div>
      </div>
    );
  }

  if (mode === 'free_slots') {
    content = (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
          <div style={{ width: 24, height: 1, background: pal.dot, opacity: 0.2 }} />
          <Calendar size={12} color={pal.dot} style={{ opacity: 0.6 }} />
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: pal.muted }}>
            {slotsDate ? new Date(slotsDate + 'T12:00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' }) : 'Оберіть дату'}
          </span>
          <div style={{ width: 24, height: 1, background: pal.dot, opacity: 0.2 }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: SERIF, color: pal.text, textAlign: 'center', marginBottom: 20, lineHeight: 1.2 }}>
          {selectedServiceName || 'Вільні вікна'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {slotsLoading ? (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', fontSize: 12, color: pal.muted, padding: 10 }}>Шукаю вікна…</div>
          ) : slots.length > 0 ? (
            slots.slice(0, 9).map(s => (
              <div key={s} style={{ 
                padding: '8px 0', borderRadius: 14, background: 'rgba(255,255,255,0.35)', 
                border: '1px solid rgba(255,255,255,0.5)', color: pal.text, fontSize: 13, fontWeight: 700,
                textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                fontFamily: SANS
              }}>
                {s}
              </div>
            ))
          ) : (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', fontSize: 12, color: pal.muted, fontStyle: 'italic', padding: 10 }}>На жаль, вікон немає</div>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'vacation') {
    content = (
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', 
          borderRadius: 100, background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.6)',
          color: pal.muted, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20
        }}>
          🏠 Off-duty
        </div>
        <div style={{ fontSize: 12, color: pal.muted, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12, fontWeight: 600 }}>Відпустка</div>
        <div style={{ fontSize: 36, fontWeight: 700, fontFamily: SERIF, color: pal.text, lineHeight: 1 }}>
          {vacStart ? new Date(vacStart + 'T12:00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) : '—'} 
        </div>
        <div style={{ fontSize: 18, color: pal.dot, margin: '8px 0', opacity: 0.5 }}>до</div>
        <div style={{ fontSize: 36, fontWeight: 700, fontFamily: SERIF, color: pal.text, lineHeight: 1 }}>
          {vacEnd ? new Date(vacEnd + 'T12:00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) : '—'}
        </div>
        <div style={{ marginTop: 24, height: 1, width: 60, background: pal.dot, opacity: 0.1, marginInline: 'auto' }} />
      </div>
    );
  }

  if (mode === 'promo') {
    content = (
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', 
          borderRadius: 100, background: '#C05B5B', color: '#fff', fontSize: 10, fontWeight: 900, 
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, boxShadow: '0 4px 15px rgba(192,91,91,0.3)'
        }}>
          <Zap size={10} fill="#fff" /> Limited Offer
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: SERIF, color: pal.text, lineHeight: 1.2, marginBottom: 12 }}>
          {selectedDeal?.service_name || 'Спеціальна ціна'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 14, color: pal.muted, textDecoration: 'line-through', opacity: 0.6 }}>{selectedDeal?.original_price} ₴</span>
            <span style={{ fontSize: 10, color: '#C05B5B', fontWeight: 800 }}>−{selectedDeal?.discount_pct}%</span>
          </div>
          <div style={{ width: 1, height: 32, background: pal.dot, opacity: 0.1 }} />
          <span style={{ fontSize: 42, fontWeight: 900, color: pal.text, fontFamily: SERIF }}>
            {selectedDeal ? Math.round(selectedDeal.original_price * (1 - selectedDeal.discount_pct/100)) : '—'}₴
          </span>
        </div>
      </div>
    );
  }

  if (mode === 'review_spotlight') {
    content = (
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 16 }}>
          {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="#D4935A" color="#D4935A" style={{ opacity: 0.8 }} />)}
        </div>
        <div style={{ 
          fontSize: reviewText && reviewText.length > 100 ? 16 : 20, 
          fontWeight: 700, fontFamily: SERIF, color: pal.text, lineHeight: 1.5, fontStyle: 'italic', marginBottom: 24 
        }}>
          «{reviewText || "Неймовірний сервіс та якість! Обов'язково повернуся ще раз..."}»
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: pal.muted, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          {reviewClientName || "Щасливий клієнт"}
        </div>
      </div>
    );
  }

  if (mode === 'flash_window') {
    content = (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 15, height: 1, background: '#C05B5B', opacity: 0.3 }} />
          <div style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(192,91,91,0.1)', color: '#C05B5B', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Flash Window</div>
          <div style={{ width: 15, height: 1, background: '#C05B5B', opacity: 0.3 }} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: SERIF, color: pal.text, textAlign: 'center', marginBottom: 20, lineHeight: 1.2 }}>
          {flashWinSvcName || 'Гаряче вікно'}
        </div>
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 24px', borderRadius: 24, background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.5)' 
        }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 10, color: pal.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Коли</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: pal.text }}>{flashWinDate ? new Date(flashWinDate + 'T12:00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) : '—'}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: pal.muted }}>о {flashWinTime || '—'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#C05B5B', fontWeight: 900, textTransform: 'uppercase', marginBottom: 2 }}>Sale</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#C05B5B', fontFamily: SERIF, lineHeight: 1 }}>−{flashWinDiscount}%</div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'portfolio_item') {
    content = (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: pal.dot, opacity: 0.3 }} />
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: pal.muted }}>Focus</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: SERIF, color: pal.text, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
          {portfolioTitle || "Моя нова робота"}
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: pal.muted, fontStyle: 'italic', opacity: 0.7 }}>
          Деталі та запис у Direct ✉️
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: 360, height: 640,
      position: 'relative', overflow: 'hidden',
      background: pal.bg, fontFamily: SANS, userSelect: 'none',
    }}>
      {/* Background Photo Layer */}
      {bgPhotoUrl && (
        <div style={{ 
          position: 'absolute', 
          inset: 0,
          backgroundImage: `url(${bgPhotoUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 40%, rgba(0,0,0,0.3) 100%)' }} />
        </div>
      )}

      <div style={{ 
        position: 'absolute', top: 18, left: 22, display: 'flex', alignItems: 'center',
        padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)'
      }}>
        <span style={{ fontSize: 10, fontStyle: 'italic', fontWeight: 700, color: bgPhotoUrl ? '#fff' : pal.brand, letterSpacing: '0.04em' }}>Bookit</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: bgPhotoUrl ? '#fff' : pal.dot, marginLeft: 1 }}>.</span>
      </div>

      {showAvatar && (
        <div style={{
          position: 'absolute', top: 44, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          padding: '12px 20px', borderRadius: 24,
          background: bgPhotoUrl ? 'rgba(255,255,255,0.15)' : 'transparent',
          backdropFilter: bgPhotoUrl ? 'blur(10px)' : 'none',
          border: bgPhotoUrl ? '1px solid rgba(255,255,255,0.2)' : 'none',
          zIndex: 10,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            overflow: 'hidden', background: pal.pill,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${bgPhotoUrl ? 'rgba(255,255,255,0.5)' : pal.bg}`,
          }}>
            {avatarBlob
              ? <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  backgroundImage: `url(${avatarBlob})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  display: 'block'
                }} />
              : <span style={{ fontSize: 28, lineHeight: 1 }}>👤</span>
            }
          </div>
          <span style={{ 
            fontSize: 12, fontWeight: 600, color: bgPhotoUrl ? '#fff' : pal.text, 
            letterSpacing: '-0.01em', maxWidth: 160, overflow: 'hidden', 
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textShadow: bgPhotoUrl ? '0 1px 4px rgba(0,0,0,0.2)' : 'none'
          }}>
            {displayName}
          </span>
        </div>
      )}

      {/* Main Content Plate */}
      <div style={{ 
        position: 'absolute',
        left: 24, right: 24,
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
        textAlign: textAlign,

        ...(platePos === 'center' ? {
          top: '50%',
          transform: 'translateY(-50%)',
        } : platePos === 'top' ? {
          top: contentTop + 10,
        } : {
          bottom: 140,
        }),

        width: 'auto',
        alignSelf: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
        padding: mode === 'portfolio_item' ? '18px 24px' : '28px 32px',
        borderRadius: 32,

        background: bgPhotoUrl ? `rgba(255,255,255,${transparency / 100})` : 'transparent',
        // CRITICAL FIX: backdrop-filter breaks html-to-image rendering (results in white/blank screen)
        // We disable it during export and rely on the rgba background above.
        backdropFilter: (bgPhotoUrl && !isExporting) ? `blur(${transparency < 20 ? 60 : 45}px) saturate(140%)` : 'none',
        WebkitBackdropFilter: (bgPhotoUrl && !isExporting) ? `blur(${transparency < 20 ? 60 : 45}px) saturate(140%)` : 'none',
        boxShadow: bgPhotoUrl ? `0 15px 50px rgba(0,0,0,${Math.min(0.2, (100 - transparency) / 400)})` : 'none',
        border: bgPhotoUrl ? `1px solid rgba(255,255,255,${Math.max(0.2, transparency / 100 + 0.1)})` : 'none',
        
        textShadow: transparency < 40 ? '0 1px 2px rgba(255,255,255,0.4)' : 'none',
      }}>
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

interface StoryGeneratorProps {
  isOpen?: boolean;
  onClose?: boolean | (() => void);
  items?: PortfolioItemFull[];
  masterName?: string;
  masterSlug?: string;
}

export function StoryGenerator({ isOpen, onClose, items: externalItems, masterName, masterSlug }: StoryGeneratorProps = {}) {
  const { profile, masterProfile } = useMasterContext();
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [palIdx,     setPalIdx]     = useState(0);
  const [mode,       setMode]       = useState<Mode>('announcement');
  const [showAvatar, setShowAvatar] = useState(true);
  const [exporting,  setExporting]  = useState(false);
  const [exported,   setExported]   = useState(false);

  const [annoText,      setAnnoText]      = useState('Тепер до мене можна записатися онлайн 24/7.');
  const [slotsDate,     setSlotsDate]     = useState<string | null>(null);
  const [selectedSvcId, setSelectedSvcId] = useState<string | null>(null);
  const [vacStart,      setVacStart]      = useState<string | null>(null);
  const [vacEnd,        setVacEnd]        = useState<string | null>(null);
  const [dealIdx,       setDealIdx]       = useState(0);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [flashWinSvcId,    setFlashWinSvcId]    = useState<string | null>(null);
  const [flashWinDate,     setFlashWinDate]     = useState<string | null>(null);
  const [flashWinTime,     setFlashWinTime]     = useState<string | null>(null);
  const [flashWinDiscount, setFlashWinDiscount] = useState(20);

  const [platePos,     setPlatePos]     = useState<'top' | 'center' | 'bottom'>('center');
  const [textAlign,    setTextAlign]    = useState<'left' | 'center' | 'right'>('center');
  const [transparency, setTransparency] = useState(38);

  const [customBgPhoto, setCustomBgPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: portfolioItems = [] } = usePortfolioItems(externalItems);
  const [selectedBgPhotoId, setSelectedBgPhotoId] = useState<string | null>(null);
  const bgPhotoUrlRaw = useMemo(() => {
    if (selectedBgPhotoId) {
      const it = portfolioItems.find(i => i.id === selectedBgPhotoId);
      return it?.photos[0]?.url ?? null;
    }
    return customBgPhoto;
  }, [selectedBgPhotoId, portfolioItems, customBgPhoto]);

  const [bgPhotoBlob, setBgPhotoBlob] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);

  useEffect(() => {
    if (!bgPhotoUrlRaw) { 
      setBgPhotoBlob(null); 
      setIsPhotoLoading(false);
      return; 
    }
    if (bgPhotoUrlRaw.startsWith('data:')) { 
      setBgPhotoBlob(bgPhotoUrlRaw); 
      setIsPhotoLoading(false);
      return; 
    }

    setIsPhotoLoading(true);
    let cancelled = false;
    fetch(bgPhotoUrlRaw, { cache: 'no-cache' })
      .then(r => {
        if (!r.ok) throw new Error('Fetch failed');
        return r.blob();
      })
      .then(b => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(b);
      }))
      .then(dataUrl => { 
        if (!cancelled) {
          setBgPhotoBlob(dataUrl);
          setIsPhotoLoading(false);
        }
      })
      .catch((err) => { 
        console.warn('[StoryGenerator] bg photo load failed:', err);
        if (!cancelled) {
          setBgPhotoBlob(null); 
          setIsPhotoLoading(false);
        }
      }); 
    return () => { cancelled = true; };
  }, [bgPhotoUrlRaw]);

  const bgPhotoUrl = bgPhotoBlob;

  const [blurActive,       setBlurActive]       = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isStarterPlan = (masterProfile?.subscription_tier ?? 'starter') === 'starter';

  const onControlChange = useCallback(() => {
    if (!PREMIUM_MODES.has(mode) || !isStarterPlan) return;
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setBlurActive(false);
    blurTimerRef.current = setTimeout(() => setBlurActive(true), 3_000);
  }, [mode, isStarterPlan]);

  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast({ type: 'error', title: 'Фото занадто велике', message: 'Макс. 10MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomBgPhoto(reader.result as string);
      setSelectedBgPhotoId(null);
      onControlChange();
    };
    reader.readAsDataURL(file);
  };

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
  const displayName = masterName || masterProfile?.business_name || profile?.full_name || "Ваше ім'я";
  const slug        = masterSlug || masterProfile?.slug || 'bookit';

  const services    = useServices(masterId);
  const selectedSvc = services.find(s => s.id === selectedSvcId) ?? null;
  const flashWinSvc = services.find(s => s.id === flashWinSvcId) ?? null;

  const todayStr  = new Date().toISOString().slice(0, 10);
  const futureStr = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: scheduleStore, isLoading: scheduleLoading } = useWizardSchedule(masterId, todayStr, futureStr);

  const wh        = (masterProfile?.working_hours as Partial<WorkingHoursConfig> | null) ?? {};
  const bufferMin = wh.buffer_time_minutes ?? 0;

  const slots = useSlotsFromStore(
    mode === 'free_slots' ? slotsDate : null,
    selectedSvc?.duration_minutes ?? 60,
    bufferMin, wh, scheduleStore,
  );
  const slotsLoading = scheduleLoading;

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

  useEffect(() => {
    if (services.length > 0 && !selectedSvcId)  setSelectedSvcId(services[0].id);
    if (services.length > 0 && !flashWinSvcId)  setFlashWinSvcId(services[0].id);
  }, [services, selectedSvcId, flashWinSvcId]);
  useEffect(() => {
    if (starReviews.length > 0 && !selectedReviewId) setSelectedReviewId(starReviews[0].id);
  }, [starReviews, selectedReviewId]);

  useEffect(() => { setFlashWinTime(null); }, [flashWinDate, flashWinSvcId]);

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current || exporting) return;
    
    if (isPhotoLoading) {
      showToast({ type: 'warning', title: 'Завантаження...', message: 'Чекаємо, поки фото підготується' });
      return;
    }

    setExporting(true);
    const node = canvasRef.current;

    console.log('[StoryGenerator] Pre-capture state:', {
      bgPhotoLen: bgPhotoUrl?.length ?? 0,
      bgPhotoPrefix: bgPhotoUrl?.slice(0, 30),
      avatarLen: avatarBlob?.length ?? 0,
      avatarPrefix: avatarBlob?.slice(0, 30),
      innerHTML_len: node.innerHTML.length,
      mode,
      platePos,
      textAlign,
      transparency
    });

    // Max reliability for mobile devices
    await new Promise(r => setTimeout(r, 1500));

    try {
      await exportCanvasPng(node, `bookit-story-${mode}-${Date.now()}.png`);
      setExported(true);
      setTimeout(() => setExported(false), 2600);
      showToast({ type: 'success', title: 'Сторі збережено!', message: '1080×1920 px готово для Instagram' });
    } catch (e) {
      console.error('[StoryGenerator]', e);
      showToast({ type: 'error', title: 'Помилка експорту', message: parseError(e) });
    } finally {
      setExporting(false);
    }
  }, [exporting, mode, showToast, isPhotoLoading, bgPhotoUrl, avatarBlob, platePos, textAlign, transparency, showAvatar, palIdx]);

  const handleDownloadOrUpgrade = useCallback(async () => {
    if (PREMIUM_MODES.has(mode) && isStarterPlan) {
      setShowUpgradeModal(true);
      return;
    }
    await handleDownload();
  }, [mode, isStarterPlan, handleDownload]);

  const isPremiumLocked = PREMIUM_MODES.has(mode) && isStarterPlan;
  const upgradeCopy = MODE_UPGRADE_COPY[mode] ?? null;

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
    bgPhotoUrl,
    portfolioTitle: customBgPhoto ? 'Ваше фото' : (portfolioItems.find(i => i.id === selectedBgPhotoId)?.title ?? null),
    portfolioDesc: customBgPhoto ? null : (portfolioItems.find(i => i.id === selectedBgPhotoId)?.description ?? null),
    platePos, textAlign, transparency,
  };

  const controls = (
    <div className="space-y-3">
      {mode === 'announcement' && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Текст публікації</label>
          <textarea
            value={annoText} onChange={e => { setAnnoText(e.target.value); onControlChange(); }}
            rows={5} maxLength={200} placeholder="Ваш текст…"
            className="resize-none outline-none text-sm transition-all"
            style={{ ...INPUT_STYLE, height: 'auto' }}
          />
          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-muted-foreground/60">{annoText.length}/200</span>
          </div>
        </div>
      )}

      {mode === 'free_slots' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Послуга</label>
            {services.length === 0 ? (
              <div className="px-4 py-3 rounded-2xl text-xs text-muted-foreground/60" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.85)' }}>
                Немає активних послуг. Додайте у розділі{' '}
                <span className="font-semibold text-primary">Послуги</span>.
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
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Дата</label>
            <input type="date" value={slotsDate ?? ''} min={todayStr} onChange={e => { setSlotsDate(e.target.value || null); onControlChange(); }} className="outline-none text-sm" style={INPUT_STYLE} />
            {slotsDate && !slotsLoading && (
              <p className={`text-[11px] mt-1.5 font-medium ${slots.length > 0 ? 'text-success' : 'text-muted-foreground/60'}`}>
                {slots.length > 0 ? `${slots.length} вільних вікон знайдено` : 'Немає вільних вікон'}
              </p>
            )}
          </div>
        </div>
      )}

      {mode === 'vacation' && (
        <div className="space-y-2.5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">З якого числа</label>
            <input type="date" value={vacStart ?? ''} onChange={e => { setVacStart(e.target.value || null); onControlChange(); }} className="outline-none text-sm" style={INPUT_STYLE} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">По яке число</label>
            <input type="date" value={vacEnd ?? ''} min={vacStart ?? ''} onChange={e => { setVacEnd(e.target.value || null); onControlChange(); }} className="outline-none text-sm" style={INPUT_STYLE} />
          </div>
        </div>
      )}

      {mode === 'promo' && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Активна Flash Deal</label>
          {flashDeals.length === 0 ? (
            <div className="px-4 py-3 rounded-2xl text-xs text-muted-foreground/60" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.85)' }}>
              Немає активних флеш-акцій. Створіть у{' '}
              <span className="font-semibold text-primary">Дохід → Flash Deals</span>.
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
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">5★ відгук клієнта</label>
          {starReviews.length === 0 ? (
            <div className="px-4 py-3 rounded-2xl text-xs text-muted-foreground/60" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.85)' }}>
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
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed px-1 line-clamp-3">
              «{selectedReview.comment}»
            </p>
          )}
        </div>
      )}

      {mode === 'flash_window' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Послуга</label>
            {services.length === 0 ? (
              <div className="px-4 py-3 rounded-2xl text-xs text-muted-foreground/60" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.85)' }}>
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
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Дата</label>
            <input type="date" value={flashWinDate ?? ''} min={todayStr} onChange={e => { setFlashWinDate(e.target.value || null); onControlChange(); }} className="outline-none text-sm" style={INPUT_STYLE} />
          </div>
          {flashWinDate && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Час слоту</label>
              {flashWinSlotsLoading ? (
                <p className="text-[11px] text-muted-foreground/60">Завантаження…</p>
              ) : flashWinSlots.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/60">Немає вільних вікон на цей день</p>
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
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Знижка: <span className="text-destructive font-bold">−{flashWinDiscount}%</span>
            </label>
            <input
              type="range" min={5} max={70} step={5}
              value={flashWinDiscount}
              onChange={e => { setFlashWinDiscount(Number(e.target.value)); onControlChange(); }}
              className="w-full cursor-pointer"
              style={{ accentColor: '#C05B5B' }}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-0.5">
              <span>5%</span><span>70%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const isBlurLocked = isPremiumLocked && blurActive;

  const contentBody = (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Конструктор Сторіс</h1>
        <p className="text-sm text-muted-foreground/60 mt-0.5">Шаблони сторіс · 6 палітр · Експорт 1080×1920 для Instagram</p>
      </div>

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
        <div className="flex-1 space-y-4 w-full">
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-muted-foreground">Фон (Фото)</p>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Plus size={12} /> Завантажити своє
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleCustomPhotoUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                type="button"
                onClick={() => { setSelectedBgPhotoId(null); setCustomBgPhoto(null); }}
                className={`relative w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all shrink-0 ${
                  (!selectedBgPhotoId && !customBgPhoto) ? 'border-primary bg-primary/10 text-primary' : 'border-white/60 bg-white/40 text-muted-foreground/40'
                }`}
              >
                <X size={18} />
              </button>
              {customBgPhoto && (
                <button
                  type="button"
                  onClick={() => { setSelectedBgPhotoId(null); onControlChange(); }}
                  className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    (!selectedBgPhotoId && customBgPhoto) ? 'border-primary shadow-md scale-95 ring-2 ring-primary/20' : 'border-transparent'
                  }`}
                >
                  <img src={customBgPhoto} className="w-full h-full object-cover" />
                  {(!selectedBgPhotoId && customBgPhoto) && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Check size={14} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              )}

              {portfolioItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setSelectedBgPhotoId(item.id); onControlChange(); }}
                  className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedBgPhotoId === item.id ? 'border-primary shadow-md scale-95' : 'border-transparent'
                  }`}
                >
                  <img src={item.photos[0]?.url} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Палітра</p>
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
              <span className="self-center text-xs text-muted-foreground/60 ml-1">{PALETTES[palIdx].label}</span>
            </div>
          </div>

          {controls}

          <div className="pt-4 border-t border-white/40 space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Налаштування плашки</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-muted-foreground block mb-1">Позиція</label>
                  <div className="flex bg-white/40 rounded-xl p-0.5 border border-white/60">
                    {(['top', 'center', 'bottom'] as const).map(p => (
                      <button key={p} type="button" onClick={() => { setPlatePos(p); onControlChange(); }} 
                        className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${platePos === p ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground/60 hover:text-muted-foreground'}`}>
                        {p === 'top' ? 'Вгору' : p === 'center' ? 'Центр' : 'Низ'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-muted-foreground block mb-1">Текст</label>
                  <div className="flex bg-white/40 rounded-xl p-0.5 border border-white/60">
                    {(['left', 'center', 'right'] as const).map(a => (
                      <button key={a} type="button" onClick={() => { setTextAlign(a); onControlChange(); }} 
                        className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${textAlign === a ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground/60 hover:text-muted-foreground'}`}>
                        {a === 'left' ? '⬅️' : a === 'center' ? '↔️' : '➡️'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Прозорість скла</label>
                <span className="text-[10px] font-bold text-primary">{transparency}%</span>
              </div>
              <input 
                type="range" min={0} max={100} step={1}
                value={transparency} 
                onChange={e => { setTransparency(Number(e.target.value)); onControlChange(); }}
                className="w-full cursor-pointer h-1.5 bg-white/50 rounded-lg appearance-none"
                style={{ accentColor: '#789A99' }}
              />
            </div>
          </div>

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
                  <p className="text-xs font-bold text-foreground mb-0.5">{upgradeCopy.teaserTitle}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{upgradeCopy.teaserDesc}</p>
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
              <p className="text-sm font-semibold text-foreground">Показувати фото</p>
              <p className="text-[11px] text-muted-foreground/60">Аватар та ім'я майстра</p>
            </div>
            {showAvatar
              ? <ToggleRight size={26} className="text-primary shrink-0" strokeWidth={1.8} />
              : <ToggleLeft  size={26} className="text-muted-foreground/60 shrink-0" strokeWidth={1.8} />
            }
          </button>

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

          <p className="text-[10px] text-muted-foreground/60 text-center -mt-1">
            {isPremiumLocked ? 'Шаблон PRO · Оновіть тариф для збереження' : '1080×1920 px · ідеально для Instagram Stories'}
          </p>
        </div>

        <div className="shrink-0 mx-auto md:mx-0">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 text-center">
            Попередній перегляд
          </p>

          <div style={{ position: 'relative', width: 252, height: 448 }}>
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

            {isPremiumLocked && !blurActive && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <span className="text-[9px] text-muted-foreground/60 bg-white/80 rounded-full px-2 py-0.5">
                  Перегляд · 10 сек
                </span>
              </div>
            )}
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

  if (isOpen !== undefined) {
    return (
      <>
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-[100] flex flex-col bg-background overflow-y-auto pb-20"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-border">
                <h2 className="font-display text-lg font-bold">Генератор Сторіс</h2>
                <button onClick={() => typeof onClose === 'function' && onClose()} className="p-2 hover:bg-secondary rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              {contentBody}
            </motion.div>
          )}
        </AnimatePresence>
        <div
          ref={canvasRef}
          aria-hidden="true"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: 380, 
            height: 660, 
            pointerEvents: 'none', 
            opacity: 0.05, 
            zIndex: -200,
            background: '#ffffff'
          }}
        >
          <div style={{ transform: 'scale(1)', transformOrigin: 'top left' }}>
            <StoryCanvas {...canvasSharedProps} isExporting={true} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {contentBody}
      <div
        ref={canvasRef}
        aria-hidden="true"
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: 380, 
          height: 660, 
          pointerEvents: 'none', 
          opacity: 0.05, 
          zIndex: -200,
          background: '#ffffff'
        }}
      >
        <div style={{ transform: 'scale(1)', transformOrigin: 'top left' }}>
          <StoryCanvas {...canvasSharedProps} isExporting={true} />
        </div>
      </div>
    </>
  );
}
