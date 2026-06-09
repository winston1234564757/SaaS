'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Loader2, Check, ToggleLeft, ToggleRight, X,
  Megaphone, Lock, Plus, Send, ChevronDown
} from 'lucide-react';
import { useMasterContext } from '@/lib/supabase/context';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast/context';
import { UpgradePromptModal } from '@/components/shared/UpgradePromptModal';
import { useWizardSchedule } from '@/lib/supabase/hooks/useWizardSchedule';
import { useSlotsFromStore } from '@/lib/supabase/hooks/useSlotsFromStore';
import { usePortfolioItems } from '@/lib/supabase/hooks/usePortfolioItems';
import type { WorkingHoursConfig } from '@/types/database';
import { parseError } from '@/lib/utils/errors';
import { getNow } from '@/lib/utils/now';
import { cn } from '@/lib/utils/cn';

import { StoryCanvas } from './story/StoryCanvas';
import {
  PALETTES, MODES, PREMIUM_MODES, VALID_MODES, MODE_UPGRADE_COPY, INPUT_STYLE,
} from './story/storyConstants';
import { useServices, useActiveFlashDeals, useStarReviews } from './story/useStoryData';
import { exportCanvasPng } from './story/storyExport';
import type { Mode, StoryGeneratorProps } from './story/storyTypes';

export function StoryGenerator({ isOpen, onClose, items: externalItems, masterName, masterSlug, initialMode, initialPortfolioId }: StoryGeneratorProps = {}) {
  const { profile, masterProfile } = useMasterContext();
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [hasInteracted, setHasInteracted] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect TMA once on mount — avoids repeated inline typeof window checks
  const [isTMA, setIsTMA] = useState(false);
  useEffect(() => { setIsTMA(!!window.Telegram?.WebApp?.initData); }, []);

  const startMode: Mode = (initialMode && VALID_MODES.has(initialMode as Mode)) ? initialMode as Mode : 'announcement';

  const [palIdx, setPalIdx] = useState(0);
  const [mode, setMode] = useState<Mode>(startMode);
  const [showAvatar, setShowAvatar] = useState(true);
  const [showSticker, setShowSticker] = useState(true);
  const [ctaText, setCtaText] = useState('Записатися онлайн');
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const [annoText, setAnnoText] = useState('Тепер до мене можна записатися онлайн 24/7.');
  const [slotsDate, setSlotsDate] = useState<string | null>(null);
  const [selectedSvcId, setSelectedSvcId] = useState<string | null>(null);
  const [vacStart, setVacStart] = useState<string | null>(null);
  const [vacEnd, setVacEnd] = useState<string | null>(null);
  const [dealIdx, setDealIdx] = useState(0);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [flashWinSvcId, setFlashWinSvcId] = useState<string | null>(null);
  const [flashWinDate, setFlashWinDate] = useState<string | null>(null);
  const [flashWinTime, setFlashWinTime] = useState<string | null>(null);
  const [flashWinDiscount, setFlashWinDiscount] = useState(20);

  const [platePos, setPlatePos] = useState<'top' | 'center' | 'bottom'>('center');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [transparency, setTransparency] = useState(38);

  const [customBgPhoto, setCustomBgPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: portfolioItems = [] } = usePortfolioItems(externalItems);
  const [selectedBgPhotoId, setSelectedBgPhotoId] = useState<string | null>(initialPortfolioId ?? null);
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
    if (!bgPhotoUrlRaw) { setBgPhotoBlob(null); setIsPhotoLoading(false); return; }
    if (bgPhotoUrlRaw.startsWith('data:')) { setBgPhotoBlob(bgPhotoUrlRaw); setIsPhotoLoading(false); return; }
    setIsPhotoLoading(true);
    let cancelled = false;
    fetch(bgPhotoUrlRaw, { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error('Fetch failed'); return r.blob(); })
      .then(b => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(b);
      }))
      .then(dataUrl => { if (!cancelled) { setBgPhotoBlob(dataUrl); setIsPhotoLoading(false); } })
      .catch((err) => {
        console.warn('[StoryGenerator] bg photo load failed:', err);
        if (!cancelled) { setBgPhotoBlob(null); setIsPhotoLoading(false); }
      });
    return () => { cancelled = true; };
  }, [bgPhotoUrlRaw]);

  const bgPhotoUrl = bgPhotoBlob;

  const [blurActive, setBlurActive] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStarterPlan = (masterProfile?.subscription_tier ?? 'starter') === 'starter';

  const onControlChange = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      setShowScrollHint(true);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => setShowScrollHint(false), 4_000);
    }
    if (!PREMIUM_MODES.has(mode) || !isStarterPlan) return;
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setBlurActive(false);
    blurTimerRef.current = setTimeout(() => setBlurActive(true), 3_000);
  }, [mode, isStarterPlan, hasInteracted]);

  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast({ type: 'error', title: 'Фото занадто велике', message: 'Макс. 10MB' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => { setCustomBgPhoto(reader.result as string); setSelectedBgPhotoId(null); onControlChange(); };
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
    return () => { if (blurTimerRef.current) clearTimeout(blurTimerRef.current); };
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
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(b);
      }))
      .then(dataUrl => { if (!cancelled) setAvatarBlob(dataUrl); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [avatarUrl]);

  const masterId = masterProfile?.id ?? profile?.id ?? null;
  const displayName = masterName || masterProfile?.business_name || profile?.full_name || "Ваше ім'я";
  const slug = masterSlug || masterProfile?.slug || 'bookit';

  const services = useServices(masterId);
  const selectedSvc = services.find(s => s.id === selectedSvcId) ?? null;
  const flashWinSvc = services.find(s => s.id === flashWinSvcId) ?? null;

  const _now = getNow();
  const todayStr = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;
  const _future = new Date(_now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const futureStr = `${_future.getFullYear()}-${String(_future.getMonth() + 1).padStart(2, '0')}-${String(_future.getDate()).padStart(2, '0')}`;
  const { data: scheduleStore, isLoading: scheduleLoading } = useWizardSchedule(masterId, todayStr, futureStr);

  const wh = (masterProfile?.working_hours as Partial<WorkingHoursConfig> | null) ?? {};
  const bufferMin = wh.buffer_time_minutes ?? 0;

  const slots = useSlotsFromStore(mode === 'free_slots' ? slotsDate : null, selectedSvc?.duration_minutes ?? 60, bufferMin, wh, scheduleStore);
  const slotsLoading = scheduleLoading;
  const flashWinSlots = useSlotsFromStore(mode === 'flash_window' ? flashWinDate : null, flashWinSvc?.duration_minutes ?? 60, bufferMin, wh, scheduleStore);
  const flashWinSlotsLoading = scheduleLoading;

  const flashDeals = useActiveFlashDeals(masterId);
  const starReviews = useStarReviews(masterId);
  const pal = PALETTES[palIdx];
  const selectedDeal = flashDeals[dealIdx] ?? null;
  const selectedReview = starReviews.find(r => r.id === selectedReviewId) ?? null;

  useEffect(() => {
    if (services.length > 0 && !selectedSvcId) setSelectedSvcId(services[0].id);
    if (services.length > 0 && !flashWinSvcId) setFlashWinSvcId(services[0].id);
  }, [services, selectedSvcId, flashWinSvcId]);
  useEffect(() => { if (starReviews.length > 0 && !selectedReviewId) setSelectedReviewId(starReviews[0].id); }, [starReviews, selectedReviewId]);
  useEffect(() => { setFlashWinTime(null); }, [flashWinDate, flashWinSvcId]);

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current || exporting) return;
    if (isPhotoLoading) {
      showToast({ type: 'warning', title: 'Завантаження...', message: 'Чекаємо, поки фото підготується' });
      return;
    }
    setExporting(true);
    const node = canvasRef.current;
    await new Promise(r => setTimeout(r, 1500));
    try {
      const filename = `bookit-story-${mode}-${Date.now()}.jpg`;
      const dataUrl = await exportCanvasPng(node, filename, isTMA);
      if (isTMA) {
        showToast({ type: 'info', title: 'Генеруємо', message: 'Майже готово, надсилаємо файл боту' });
        const { data: { session } } = await createClient().auth.getSession();
        const res = await fetch('/api/marketing/send-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
          body: JSON.stringify({ dataUrl, filename, caption: `Ваша сторіс "${MODES.find(m => m.id === mode)?.label}" готова!` }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Не вдалося відправити через бота');
        }
        showToast({ type: 'success', title: 'Відправлено!', message: 'Зазирніть у чат з ботом' });
      } else {
        showToast({ type: 'success', title: 'Сторі збережено!', message: '1080x1920 px готово для Instagram' });
      }
      setExported(true);
      setTimeout(() => setExported(false), 2600);
    } catch (e) {
      console.error('[StoryGenerator]', e);
      showToast({ type: 'error', title: 'Помилка', message: parseError(e) });
    } finally {
      setExporting(false);
    }
  }, [exporting, mode, showToast, isPhotoLoading, isTMA]);

  const handleDownloadOrUpgrade = useCallback(async () => {
    if (PREMIUM_MODES.has(mode) && isStarterPlan) { setShowUpgradeModal(true); return; }
    await handleDownload();
  }, [mode, isStarterPlan, handleDownload]);

  const isPremiumLocked = PREMIUM_MODES.has(mode) && isStarterPlan;
  const upgradeCopy = MODE_UPGRADE_COPY[mode] ?? null;

  const canvasSharedProps = useMemo(() => ({
    pal, mode, showAvatar, avatarBlob, displayName, slug,
    annoText, slotsDate, slots, slotsLoading,
    selectedServiceName: selectedSvc?.name ?? null,
    vacStart, vacEnd, selectedDeal,
    reviewText: selectedReview?.comment ?? null,
    reviewClientName: selectedReview?.client_name ?? null,
    flashWinSvcName: flashWinSvc?.name ?? null,
    flashWinDate, flashWinTime, flashWinDiscount,
    bgPhotoUrl,
    portfolioTitle: customBgPhoto ? 'Ваше фото' : (portfolioItems.find(i => i.id === selectedBgPhotoId)?.title ?? null),
    portfolioDesc: customBgPhoto ? null : (portfolioItems.find(i => i.id === selectedBgPhotoId)?.description ?? null),
    platePos, textAlign, transparency,
    showSticker, ctaText,
  }), [
    pal, mode, showAvatar, avatarBlob, displayName, slug,
    annoText, slotsDate, slots, slotsLoading,
    selectedSvc, vacStart, vacEnd, selectedDeal,
    selectedReview, flashWinSvc, flashWinDate, flashWinTime, flashWinDiscount,
    bgPhotoUrl, customBgPhoto, portfolioItems, selectedBgPhotoId,
    platePos, textAlign, transparency, showSticker, ctaText,
  ]);

  const controls = (
    <div className="space-y-3">
      {mode === 'announcement' && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Текст публікації</label>
          <textarea value={annoText} onChange={e => { setAnnoText(e.target.value); onControlChange(); }}
            rows={5} maxLength={200} placeholder="Ваш текст..."
            className="resize-none outline-none text-sm transition-colors duration-150" style={{ ...INPUT_STYLE, height: 'auto' }} />
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
              <div className="px-4 py-3 rounded-2xl text-xs text-muted-foreground/60 bg-secondary/60 border border-border">
                Немає активних послуг. Додайте у розділі <span className="font-semibold text-primary">Послуги</span>.
              </div>
            ) : (
              <select value={selectedSvcId ?? ''} onChange={e => { setSelectedSvcId(e.target.value || null); onControlChange(); }} className="outline-none text-sm cursor-pointer" style={INPUT_STYLE}>
                {services.map(s => <option key={s.id} value={s.id}>{s.emoji ? `${s.emoji} ` : ''}{s.name} ({s.duration_minutes} хв)</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Дата</label>
            <input type="date" value={slotsDate ?? ''} min={todayStr} onChange={e => { setSlotsDate(e.target.value || null); onControlChange(); }} aria-label="Дата слоту для сторіс" className="outline-none text-sm" style={INPUT_STYLE} />
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
            <input type="date" value={vacStart ?? ''} onChange={e => { setVacStart(e.target.value || null); onControlChange(); }} aria-label="Початок відпустки" className="outline-none text-sm" style={INPUT_STYLE} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">По яке число</label>
            <input type="date" value={vacEnd ?? ''} min={vacStart ?? ''} onChange={e => { setVacEnd(e.target.value || null); onControlChange(); }} aria-label="Кінець відпустки" className="outline-none text-sm" style={INPUT_STYLE} />
          </div>
        </div>
      )}
      {mode === 'promo' && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Активна Flash Deal</label>
          {flashDeals.length === 0 ? (
            <div className="px-4 py-3 rounded-2xl text-xs text-muted-foreground/60 bg-secondary/60 border border-border">
              Немає активних флеш-акцій. Створіть у <span className="font-semibold text-primary">Дохід → Flash Deals</span>.
            </div>
          ) : (
            <select value={dealIdx} onChange={e => { setDealIdx(Number(e.target.value)); onControlChange(); }} className="outline-none text-sm cursor-pointer" style={INPUT_STYLE}>
              {flashDeals.map((d, i) => <option key={d.id} value={i}>{d.service_name} · {Math.round(d.original_price / 100 * (1 - d.discount_pct / 100))}₴ (−{d.discount_pct}%)</option>)}
            </select>
          )}
        </div>
      )}
      {mode === 'review_spotlight' && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">5★ відгук клієнта</label>
          {starReviews.length === 0 ? (
            <div className="px-4 py-3 rounded-2xl text-xs text-muted-foreground/60 bg-secondary/60 border border-border">
              Немає опублікованих 5★ відгуків. Попросіть клієнта залишити відгук після запису.
            </div>
          ) : (
            <select value={selectedReviewId ?? ''} onChange={e => { setSelectedReviewId(e.target.value || null); onControlChange(); }} className="outline-none text-sm cursor-pointer" style={INPUT_STYLE}>
              {starReviews.map(r => <option key={r.id} value={r.id}>{r.client_name} — {(r.comment ?? '').slice(0, 40)}{(r.comment ?? '').length > 40 ? '...' : ''}</option>)}
            </select>
          )}
          {selectedReview?.comment && (
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed px-1 line-clamp-3">«{selectedReview.comment}»</p>
          )}
        </div>
      )}
      {mode === 'flash_window' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Послуга</label>
            {services.length === 0 ? (
              <div className="px-4 py-3 rounded-2xl text-xs text-muted-foreground/60 bg-secondary/60 border border-border">Немає активних послуг.</div>
            ) : (
              <select value={flashWinSvcId ?? ''} onChange={e => { setFlashWinSvcId(e.target.value || null); onControlChange(); }} className="outline-none text-sm cursor-pointer" style={INPUT_STYLE}>
                {services.map(s => <option key={s.id} value={s.id}>{s.emoji ? `${s.emoji} ` : ''}{s.name} ({s.duration_minutes} хв)</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Дата</label>
            <input type="date" value={flashWinDate ?? ''} min={todayStr} onChange={e => { setFlashWinDate(e.target.value || null); onControlChange(); }} aria-label="Дата флеш-пропозиції" className="outline-none text-sm" style={INPUT_STYLE} />
          </div>
          {flashWinDate && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Час слоту</label>
              {flashWinSlotsLoading ? (
                <p className="text-[11px] text-muted-foreground/60">Завантаження...</p>
              ) : flashWinSlots.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/60">Немає вільних вікон на цей день</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {flashWinSlots.map(s => (
                    <button key={s} type="button" onClick={() => { setFlashWinTime(s); onControlChange(); }}
                      className={cn("px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer active:scale-[0.88]",
                        flashWinTime === s ? "bg-[var(--btn-primary-bg)] text-[var(--accent-on)]" : "bg-secondary/70 text-text-secondary border border-border")}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Знижка: <span className="text-destructive font-bold">−{flashWinDiscount}%</span></label>
            <input type="range" min={5} max={70} step={5} value={flashWinDiscount}
              onChange={e => { setFlashWinDiscount(Number(e.target.value)); onControlChange(); }}
              aria-label="Відсоток знижки флеш-пропозиції" className="w-full cursor-pointer" style={{ accentColor: 'var(--accent)' }} />
            <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-0.5"><span>5%</span><span>70%</span></div>
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
          const Icon = m.Icon;
          return (
            <button key={m.id} type="button" aria-pressed={active} onClick={() => setMode(m.id)}
              className={cn("relative flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer shrink-0 active:scale-[0.88]",
                active
                  ? "bg-[var(--btn-primary-bg)] text-[var(--accent-on)] shadow-[0_4px_12px_color-mix(in_srgb,var(--accent)_25%,transparent)]"
                  : "bg-secondary/70 text-text-secondary border border-border")}>
              <Icon size={13} strokeWidth={2.5} />
              {m.label}
              {m.premium && (
                <span className={cn("ml-0.5 text-[10px] font-bold px-1 py-0.5 rounded-md", active ? "bg-accent-on/25 text-accent-on" : "bg-warning/15 text-warning")}>PRO</span>
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
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                <Plus size={12} /> Завантажити своє
              </button>
              <input type="file" ref={fileInputRef} onChange={handleCustomPhotoUpload} accept="image/*" className="hidden" aria-hidden="true" tabIndex={-1} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button type="button" onClick={() => { setSelectedBgPhotoId(null); setCustomBgPhoto(null); }} aria-label="Без фону"
                className={`relative size-12 rounded-xl flex items-center justify-center border-2 transition-colors duration-150 shrink-0 active:scale-[0.88] cursor-pointer ${(!selectedBgPhotoId && !customBgPhoto) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary/40 text-text-secondary'}`}>
                <X size={18} />
              </button>
              {customBgPhoto && (
                <button type="button" onClick={() => { setSelectedBgPhotoId(null); onControlChange(); }}
                  className={`relative size-12 rounded-xl overflow-hidden border-2 transition-colors duration-150 shrink-0 active:scale-[0.88] cursor-pointer ${(!selectedBgPhotoId && customBgPhoto) ? 'border-primary shadow-md scale-95 ring-2 ring-primary/20' : 'border-transparent'}`}>
                  <img src={customBgPhoto} className="w-full h-full object-cover" alt="" />
                  {(!selectedBgPhotoId && customBgPhoto) && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Check size={14} className="text-white" strokeWidth={3} /></div>
                  )}
                </button>
              )}
              {portfolioItems.map(item => (
                <button key={item.id} type="button" onClick={() => { setSelectedBgPhotoId(item.id); onControlChange(); }}
                  aria-label={item.title ?? 'Фото з портфоліо'}
                  className={`relative size-12 rounded-xl overflow-hidden border-2 transition-colors duration-150 shrink-0 active:scale-[0.88] cursor-pointer ${selectedBgPhotoId === item.id ? 'border-primary shadow-md scale-95' : 'border-transparent'}`}>
                  <img src={item.photos[0]?.url} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Палітра</p>
            <div className="flex gap-2.5 flex-wrap">
              {PALETTES.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  aria-label={p.label}
                  aria-pressed={i === palIdx}
                  onClick={() => setPalIdx(i)}
                  className="relative size-8 rounded-full transition-colors duration-150 cursor-pointer"
                  style={{
                    background: p.bg,
                    border: i === palIdx ? '2.5px solid var(--accent)' : `2px solid ${p.muted}`,
                    boxShadow: i === palIdx ? '0 0 0 2px color-mix(in srgb, var(--accent) 28%, transparent)' : undefined,
                  }}>
                  {i === palIdx && <span className="absolute inset-0 flex items-center justify-center"><Check size={12} style={{ color: p.text }} strokeWidth={3} /></span>}
                </button>
              ))}
              <span className="self-center text-xs text-muted-foreground/60 ml-1">{PALETTES[palIdx].label}</span>
            </div>
          </div>

          {controls}

          <div className="pt-4 border-t border-border space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Налаштування плашки</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Позиція</label>
                  <div className="flex bg-secondary/40 rounded-xl p-0.5 border border-border">
                    {(['top', 'center', 'bottom'] as const).map(pos => (
                      <button key={pos} type="button" onClick={() => { setPlatePos(pos); onControlChange(); }}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-colors duration-150 active:scale-[0.88] cursor-pointer ${platePos === pos ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'}`}>
                        {pos === 'top' ? 'Вгору' : pos === 'center' ? 'Центр' : 'Низ'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Текст</label>
                  <div className="flex bg-secondary/40 rounded-xl p-0.5 border border-border">
                    {(['left', 'center', 'right'] as const).map(a => (
                      <button key={a} type="button" onClick={() => { setTextAlign(a); onControlChange(); }}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-colors duration-150 active:scale-[0.88] cursor-pointer ${textAlign === a ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground'}`}>
                        {a === 'left' ? 'Ліво' : a === 'center' ? 'Центр' : 'Право'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Прозорість скла</label>
                <span className="text-[10px] font-bold text-primary">{transparency}%</span>
              </div>
              <input type="range" min={0} max={100} step={1} value={transparency}
                onChange={e => { setTransparency(Number(e.target.value)); onControlChange(); }}
                aria-label="Прозорість скла" className="w-full cursor-pointer h-1.5 bg-secondary/50 rounded-lg appearance-none" style={{ accentColor: 'var(--accent)' }} />
            </div>
          </div>

          <AnimatePresence>
            {isPremiumLocked && upgradeCopy && (
              <motion.button type="button"
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
                className="w-full rounded-2xl px-4 py-3.5 flex items-start gap-3 text-left"
                style={{ background: 'var(--accent-soft)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}
                onClick={() => setShowUpgradeModal(true)}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground mb-0.5">{upgradeCopy.teaserTitle}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{upgradeCopy.teaserDesc}</p>
                </div>
                <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-xl self-center"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>PRO</span>
              </motion.button>
            )}
          </AnimatePresence>

          <button type="button" onClick={() => setShowAvatar(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-colors duration-150 cursor-pointer bg-secondary/70 border border-border active:scale-[0.88]">
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Показувати фото</p>
              <p className="text-[11px] text-muted-foreground/60">Аватар та ім&apos;я майстра</p>
            </div>
            {showAvatar ? <ToggleRight size={26} className="text-primary shrink-0" strokeWidth={1.8} /> : <ToggleLeft size={26} className="text-muted-foreground/60 shrink-0" strokeWidth={1.8} />}
          </button>

          <button type="button" onClick={() => setShowSticker(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-colors duration-150 cursor-pointer bg-secondary/70 border border-border active:scale-[0.88]">
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Кнопка запису</p>
              <p className="text-[11px] text-muted-foreground/60">Стікер з текстом внизу сторіс</p>
            </div>
            {showSticker ? <ToggleRight size={26} className="text-primary shrink-0" strokeWidth={1.8} /> : <ToggleLeft size={26} className="text-muted-foreground/60 shrink-0" strokeWidth={1.8} />}
          </button>

          {showSticker && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Текст кнопки</label>
              <input
                value={ctaText}
                onChange={e => { setCtaText(e.target.value.slice(0, 28)); onControlChange(); }}
                maxLength={28}
                placeholder="Записатися онлайн"
                className="outline-none text-sm"
                style={INPUT_STYLE}
              />
              <div className="flex justify-end mt-1">
                <span className="text-[10px] text-muted-foreground/60">{ctaText.length}/28</span>
              </div>
            </div>
          )}

          <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={handleDownloadOrUpgrade} disabled={exporting}
            className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-[background-color,box-shadow] duration-200 disabled:opacity-50 cursor-pointer"
            style={exported
              ? { background: 'var(--success)', color: '#fff', boxShadow: '0 6px 20px color-mix(in srgb, var(--success) 30%, transparent)' }
              : { background: 'var(--btn-primary-bg)', color: 'var(--accent-on)', boxShadow: '0 6px 20px color-mix(in srgb, var(--accent) 25%, transparent)' }}>
            <AnimatePresence mode="popLayout" initial={false}>
              {exporting ? (
                <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Генеруємо...
                </motion.span>
              ) : isBlurLocked ? (
                <motion.span key="u" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Lock size={16} /> Розблокувати на PRO
                </motion.span>
              ) : isPremiumLocked ? (
                <motion.span key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Download size={16} /> {isTMA ? 'Отримати в Telegram' : 'Завантажити'}
                </motion.span>
              ) : exported ? (
                <motion.span key="d" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Check size={16} strokeWidth={3} /> {isTMA ? 'Відправлено!' : 'Збережено!'}
                </motion.span>
              ) : (
                <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Megaphone size={16} /> {isTMA ? 'Отримати в Telegram' : 'Завантажити для Сторіс'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <p className="text-[10px] text-muted-foreground/60 text-center -mt-1">
            {isPremiumLocked ? 'Шаблон PRO · Оновіть тариф для збереження' : '1080×1920 px · ідеально для Instagram Stories'}
          </p>
        </div>

        <AnimatePresence>
          {showScrollHint && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex justify-center md:hidden w-full -mt-1 mb-1"
            >
              <motion.button
                type="button"
                aria-label="Перейти до попереднього перегляду"
                onClick={() => {
                  previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setShowScrollHint(false);
                }}
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-full active:scale-95"
                style={{
                  background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                  color: 'var(--accent)',
                }}
              >
                <span className="text-[11px] font-semibold leading-none">Перегляд</span>
                <ChevronDown size={20} strokeWidth={2.5} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={previewRef} className="shrink-0 mx-auto md:mx-0">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 text-center">Попередній перегляд</p>
          <div style={{ position: 'relative', width: 252, height: 448 }}>
            <div style={{
              width: 252, height: 448, overflow: 'hidden', borderRadius: 20,
              filter: isBlurLocked ? 'blur(10px)' : 'none',
              transition: 'filter 0.6s ease',
              boxShadow: '0 16px 48px color-mix(in srgb, var(--accent) 15%, transparent)',
            }}>
              <div style={{ transform: 'scale(0.7)', transformOrigin: 'top left', pointerEvents: 'none' }}>
                <StoryCanvas {...canvasSharedProps} />
              </div>
            </div>
            <AnimatePresence>
              {isBlurLocked && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="absolute inset-0 flex items-center justify-center rounded-[20px]"
                  style={{ background: 'color-mix(in srgb, var(--text-primary) 8%, transparent)' }}>
                  <div className="flex flex-col items-center gap-2 px-5 py-4 rounded-2xl text-center"
                    style={{ background: 'color-mix(in srgb, var(--text-primary) 90%, transparent)', backdropFilter: 'blur(4px)', maxWidth: 200 }}>
                    <Lock size={18} strokeWidth={2.5} style={{ color: 'var(--accent-on)' }} />
                    <span className="text-[11px] font-bold tracking-wide leading-tight" style={{ color: 'var(--accent-on)' }}>{upgradeCopy?.overlayTitle ?? 'Доступно в PRO'}</span>
                    <span className="text-[10px] leading-snug" style={{ color: 'color-mix(in srgb, var(--accent-on) 55%, transparent)' }}>{upgradeCopy?.overlayHint ?? '700 грн/міс'}</span>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full mt-0.5"
                      style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>Перейти на PRO</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {isPremiumLocked && !blurActive && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <span className="text-[9px] text-muted-foreground/60 bg-background/80 rounded-full px-2 py-0.5">Перегляд · 10 сек</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <UpgradePromptModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} source="marketing" feature={upgradeCopy?.modalTitle} description={upgradeCopy?.modalDesc} />
    </div>
  );

  const sharedBottom = (
    <>
      <AnimatePresence>
        {exporting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-background/60 backdrop-blur-xl">
            <div className="flex flex-col items-center gap-6 text-center px-8">
              <div className="relative">
                <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
                  className="size-24 rounded-full border-2 border-dashed border-primary/30" />
                <motion.div initial={{ x: -20, y: 20, opacity: 0 }} animate={{ x: 0, y: 0, opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center">
                  <Send className="size-10 text-primary" />
                </motion.div>
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-xl font-bold text-foreground">Створюємо магію...</h3>
                <p className="text-sm text-muted-foreground/60 max-w-[240px]">
                  {isTMA ? 'Готуємо Ultra-HD файл для вашого Telegram' : 'Готуємо преміум-зображення для вашої галереї'}
                </p>
              </div>
              <div className="w-48 h-1.5 bg-background/40 rounded-full overflow-hidden border border-border">
                <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1/2 h-full bg-gradient-to-r from-transparent via-primary to-transparent" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={canvasRef} aria-hidden="true"
        style={{ position: 'fixed', top: 0, left: '-9999px', width: 360, height: 640, pointerEvents: 'none', opacity: 1, zIndex: -200, background: '#ffffff', overflow: 'hidden' }}>
        <StoryCanvas {...canvasSharedProps} isExporting={true} />
      </div>
    </>
  );

  if (isOpen !== undefined) {
    return (
      <>
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-[100] flex flex-col bg-background overflow-y-auto pb-20">
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-border">
                <h2 className="font-display text-lg font-bold">Генератор Сторіс</h2>
                <button type="button" onClick={() => typeof onClose === 'function' && onClose()} aria-label="Закрити" className="p-2 hover:bg-secondary rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              {contentBody}
            </motion.div>
          )}
        </AnimatePresence>
        {sharedBottom}
      </>
    );
  }

  return (
    <>
      {contentBody}
      {sharedBottom}
    </>
  );
}
