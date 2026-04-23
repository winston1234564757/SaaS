'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Loader2, Check, ToggleLeft, ToggleRight,
  Megaphone, Clock, Calendar, Zap,
} from 'lucide-react';
import { useMasterContext } from '@/lib/supabase/context';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast/context';
import type { WorkingHoursConfig, BreakWindow } from '@/types/database';

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
type Mode = 'announcement' | 'free_slots' | 'vacation' | 'promo';

const MODES: { id: Mode; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { id: 'announcement', label: 'Анонс',     Icon: Megaphone },
  { id: 'free_slots',   label: 'Вікна',     Icon: Clock     },
  { id: 'vacation',     label: 'Відпустка', Icon: Calendar  },
  { id: 'promo',        label: 'Акція',     Icon: Zap       },
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
const DOW = ['sun','mon','tue','wed','thu','fri','sat'] as const;

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS  = "'Inter', system-ui, -apple-system, sans-serif";

function formatUA(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} ${UA_MONTHS[d.getMonth()]}`;
}
function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

interface BookingSlim { start_time: string; end_time: string; status: string; }

/* Fluid Anchor: snaps to end of break/booking instead of skipping fixed-grid points.
   This prevents gaps like "no slot 14:30–15:40" when a break ends at 14:30. */
function computeSlots(
  startTime: string, endTime: string,
  durationMin: number, bufferMin: number,
  breaks: BreakWindow[], bookings: BookingSlim[],
  todayNowMin: number | null,
): string[] {
  const end   = timeToMin(endTime);
  const slots: string[] = [];
  let t = timeToMin(startTime);

  const activeBookings = bookings.filter(b => b.status !== 'cancelled');

  while (t + durationMin <= end) {
    const slotEnd = t + durationMin;

    // Skip past slots when generating for today
    if (todayNowMin !== null && t <= todayNowMin) { t = todayNowMin + 1; continue; }

    const hitBreak = breaks.find(b => t < timeToMin(b.end) && slotEnd > timeToMin(b.start));
    if (hitBreak) { t = timeToMin(hitBreak.end); continue; }

    const hitBooking = activeBookings.find(b => t < timeToMin(b.end_time) && slotEnd > timeToMin(b.start_time));
    if (hitBooking) { t = timeToMin(hitBooking.end_time); continue; }

    slots.push(minToTime(t));
    t += durationMin + bufferMin;
  }
  return slots;
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

function useAvailableSlots(date: string | null, masterId: string | null, durationMin: number) {
  const [slots, setSlots]     = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date || !masterId || durationMin <= 0) { setSlots([]); return; }
    setLoading(true);
    const supabase = createClient();
    const dow = DOW[new Date(date + 'T12:00:00').getDay()];

    Promise.all([
      supabase.from('schedule_templates').select('start_time,end_time,is_working').eq('master_id', masterId).eq('day_of_week', dow).maybeSingle(),
      supabase.from('master_profiles').select('working_hours').eq('id', masterId).maybeSingle(),
      supabase.from('bookings').select('start_time,end_time,status').eq('master_id', masterId).eq('date', date).neq('status', 'cancelled'),
    ]).then(([tplRes, mpRes, bkRes]) => {
      const tpl = tplRes.data;
      if (!tpl?.is_working) { setSlots([]); return; }
      const wh       = (mpRes.data?.working_hours ?? {}) as Partial<WorkingHoursConfig>;
      const breaks   = (wh.breaks ?? []) as BreakWindow[];
      const buffer   = wh.buffer_time_minutes ?? 0;
      const bookings = (bkRes.data ?? []) as BookingSlim[];
      const now = new Date();
      const isToday = date === now.toISOString().slice(0, 10);
      const todayNowMin = isToday ? now.getHours() * 60 + now.getMinutes() : null;
      setSlots(computeSlots(tpl.start_time, tpl.end_time, durationMin, buffer, breaks, bookings, todayNowMin));
    }).catch(() => setSlots([])).finally(() => setLoading(false));
  }, [date, masterId, durationMin]);

  return { slots, loading };
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

/* ═══════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════ */
async function exportCanvasPng(node: HTMLElement, filename: string) {
  const [{ toPng }, { saveAs }] = await Promise.all([import('html-to-image'), import('file-saver')]);
  saveAs(await toPng(node, { pixelRatio: 3, cacheBust: true }), filename);
}

/* ═══════════════════════════════════════════════════════
   STORY CANVAS — stable DOM node, never remounted
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
}

function StoryCanvas({
  pal, mode, showAvatar, avatarBlob, displayName, slug,
  annoText, slotsDate, slots, slotsLoading, selectedServiceName,
  vacStart, vacEnd, selectedDeal,
}: CanvasProps) {
  /* Layout geometry */
  const avatarBlockH = showAvatar ? 110 : 0;
  const contentTop   = 50 + avatarBlockH + 10;

  /* Tracked uppercase label */
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

  /* Adaptive slot grid */
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

  /* Mode content */
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

  return (
    <div style={{
      width: 360, height: 640,
      position: 'relative', overflow: 'hidden',
      background: pal.bg, fontFamily: SANS, userSelect: 'none',
    }}>

      {/* Brand mark — top left */}
      <div style={{ position: 'absolute', top: 18, left: 22, display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: pal.brand, letterSpacing: '0.04em' }}>Bookit</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: pal.dot, marginLeft: 1 }}>.</span>
      </div>

      {/* Avatar */}
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

      {/* Mode content */}
      <div style={{ position: 'absolute', top: contentTop, left: 28, right: 28, bottom: 120 }}>
        {content}
      </div>

      {/* Instagram-style link sticker */}
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

      {/* Slug */}
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

  const [annoText,      setAnnoText]      = useState('Тепер до мене можна записатися онлайн 24/7.');
  const [slotsDate,     setSlotsDate]     = useState<string | null>(null);
  const [selectedSvcId, setSelectedSvcId] = useState<string | null>(null);
  const [vacStart,      setVacStart]      = useState<string | null>(null);
  const [vacEnd,        setVacEnd]        = useState<string | null>(null);
  const [dealIdx,       setDealIdx]       = useState(0);

  /* Avatar as base64 data URL — html-to-image inlines it without a separate fetch */
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

  /* Data */
  const services   = useServices(masterId);
  const selectedSvc = services.find(s => s.id === selectedSvcId) ?? null;
  const durationMin = selectedSvc?.duration_minutes ?? 60;

  const { slots, loading: slotsLoading } = useAvailableSlots(
    mode === 'free_slots' ? slotsDate : null,
    masterId,
    durationMin,
  );
  const flashDeals   = useActiveFlashDeals(masterId);
  const pal          = PALETTES[palIdx];
  const selectedDeal = flashDeals[dealIdx] ?? null;
  const todayStr     = new Date().toISOString().slice(0, 10);

  /* Auto-select first service */
  useEffect(() => {
    if (services.length > 0 && !selectedSvcId) setSelectedSvcId(services[0].id);
  }, [services, selectedSvcId]);

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current || exporting) return;
    setExporting(true);
    const node = canvasRef.current;

    // Bring on-screen so the browser paints the compositing layer, then capture.
    // z-index:-1 keeps it behind everything so the user sees nothing.
    node.style.top  = '0px';
    node.style.left = '0px';
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

  /* Mode controls */
  const controls = (
    <div className="space-y-3">
      {mode === 'announcement' && (
        <div>
          <label className="text-xs font-semibold text-[#6B5750] mb-1.5 block">Текст публікації</label>
          <textarea
            value={annoText} onChange={e => setAnnoText(e.target.value)}
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
                Немає активних послуг. Додайте їх у розділі{' '}
                <span className="font-semibold text-[#789A99]">Послуги</span>.
              </div>
            ) : (
              <select
                value={selectedSvcId ?? ''}
                onChange={e => setSelectedSvcId(e.target.value || null)}
                className="outline-none text-sm cursor-pointer"
                style={INPUT_STYLE}
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.emoji ? `${s.emoji} ` : ''}{s.name} ({s.duration_minutes} хв)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-[#6B5750] mb-1.5 block">Дата</label>
            <input
              type="date" value={slotsDate ?? ''} min={todayStr}
              onChange={e => setSlotsDate(e.target.value || null)}
              className="outline-none text-sm"
              style={INPUT_STYLE}
            />
            {slotsDate && !slotsLoading && (
              <p className={`text-[11px] mt-1.5 font-medium ${slots.length > 0 ? 'text-[#5C9E7A]' : 'text-[#A8928D]'}`}>
                {slots.length > 0 ? `${slots.length} вільних вікон знайдено` : 'Немає вільних вікон на цей день'}
              </p>
            )}
          </div>
        </div>
      )}

      {mode === 'vacation' && (
        <div className="space-y-2.5">
          <div>
            <label className="text-xs font-semibold text-[#6B5750] mb-1.5 block">З якого числа</label>
            <input type="date" value={vacStart ?? ''} onChange={e => setVacStart(e.target.value || null)} className="outline-none text-sm" style={INPUT_STYLE} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#6B5750] mb-1.5 block">По яке число</label>
            <input type="date" value={vacEnd ?? ''} min={vacStart ?? ''} onChange={e => setVacEnd(e.target.value || null)} className="outline-none text-sm" style={INPUT_STYLE} />
          </div>
        </div>
      )}

      {mode === 'promo' && (
        <div>
          <label className="text-xs font-semibold text-[#6B5750] mb-1.5 block">Активна Flash Deal</label>
          {flashDeals.length === 0 ? (
            <div className="px-4 py-3 rounded-2xl text-xs text-[#A8928D]" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.85)' }}>
              Немає активних флеш-акцій. Створіть їх у{' '}
              <span className="font-semibold text-[#789A99]">Дохід → Flash Deals</span>.
            </div>
          ) : (
            <select
              value={dealIdx}
              onChange={e => setDealIdx(Number(e.target.value))}
              className="outline-none text-sm cursor-pointer"
              style={INPUT_STYLE}
            >
              {flashDeals.map((d, i) => (
                <option key={d.id} value={i}>
                  {d.service_name} · {Math.round(d.original_price / 100 * (1 - d.discount_pct / 100))}₴ (−{d.discount_pct}%)
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      <div>
        <h1 className="font-display text-2xl font-semibold text-[#2C1A14]">Генератор Сторіс</h1>
        <p className="text-sm text-[#A8928D] mt-0.5">Живі дані · 6 палітр · Експорт 1080×1920 для Instagram</p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {MODES.map(m => {
          const active = m.id === mode;
          const Icon = m.Icon;
          return (
            <button key={m.id} type="button" onClick={() => setMode(m.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0"
              style={active
                ? { background: 'linear-gradient(135deg,#789A99,#5C7E7D)', color: '#fff', boxShadow: '0 4px 12px rgba(120,154,153,0.35)' }
                : { background: 'rgba(255,255,255,0.70)', color: '#6B5750', border: '1px solid rgba(255,255,255,0.85)' }
              }
            >
              <Icon size={13} strokeWidth={2.5} />{m.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row gap-5 items-start">

        {/* Controls column */}
        <div className="flex-1 space-y-4 w-full">

          {/* Palette */}
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

          {/* Avatar toggle */}
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

          {/* Download */}
          <motion.button
            whileTap={{ scale: 0.97 }} type="button"
            onClick={handleDownload} disabled={exporting}
            className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors duration-300 disabled:opacity-50 cursor-pointer"
            style={{
              background: exported
                ? 'linear-gradient(135deg,#5C9E7A,#4A8A68)'
                : 'linear-gradient(135deg,#2C1A14,#4A2E26)',
              color: '#fff',
              boxShadow: exported ? '0 6px 20px rgba(92,158,122,0.35)' : '0 6px 20px rgba(44,26,20,0.28)',
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {exporting ? (
                <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Генеруємо…
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
            1080×1920 px · ідеально для Instagram Stories
          </p>
        </div>

        {/* Preview column */}
        <div className="shrink-0 mx-auto md:mx-0">
          <p className="text-[10px] font-semibold text-[#A8928D] uppercase tracking-wider mb-2 text-center">
            Попередній перегляд
          </p>
          {/* 252×448 visual display — scale(0.7) of 360×640. No canvasRef here. */}
          <div style={{
            width: 252, height: 448, overflow: 'hidden',
            borderRadius: 20, boxShadow: '0 16px 48px rgba(44,26,20,0.22)',
          }}>
            <div style={{ transform: 'scale(0.7)', transformOrigin: 'top left', pointerEvents: 'none' }}>
              <StoryCanvas
                pal={pal} mode={mode}
                showAvatar={showAvatar} avatarBlob={avatarBlob}
                displayName={displayName} slug={slug}
                annoText={annoText}
                slotsDate={slotsDate} slots={slots} slotsLoading={slotsLoading}
                selectedServiceName={selectedSvc?.name ?? null}
                vacStart={vacStart} vacEnd={vacEnd}
                selectedDeal={selectedDeal}
              />
            </div>
          </div>

          {/* Hidden capture target — full 360×640, no transform, no overflow clip.
              html-to-image sees the real layout size and captures the full canvas. */}
          <div
            ref={canvasRef}
            aria-hidden="true"
            style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: 360, height: 640, pointerEvents: 'none' }}
          >
            <StoryCanvas
              pal={pal} mode={mode}
              showAvatar={showAvatar} avatarBlob={avatarBlob}
              displayName={displayName} slug={slug}
              annoText={annoText}
              slotsDate={slotsDate} slots={slots} slotsLoading={slotsLoading}
              selectedServiceName={selectedSvc?.name ?? null}
              vacStart={vacStart} vacEnd={vacEnd}
              selectedDeal={selectedDeal}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
