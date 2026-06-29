'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useMasterContext } from '@/lib/supabase/context';
import { usePortfolioItems } from '@/lib/supabase/hooks/usePortfolioItems';
import { useWizardSchedule } from '@/lib/supabase/hooks/useWizardSchedule';
import { useSlotsFromStore } from '@/lib/supabase/hooks/useSlotsFromStore';
import { getNow } from '@/lib/utils/now';
import type { WorkingHoursConfig, PortfolioItemFull } from '@/types/database';
import { useServices, useActiveFlashDeals, useStarReviews } from './useStoryData';
import {
  PALETTES, PREMIUM_MODES, MODE_UPGRADE_COPY, VALID_MODES,
  presetById, TEXT_SCALES, resolveTextTheme,
} from './storyConstants';
import { STEPS, STEP_INDEX, isStepComplete } from './storySteps';
import type {
  Mode, StepId, StyleId, TextSize, StepCompletion, CanvasProps, StoryEditorState, StorySetters,
  StoryGeneratorProps, UpgradeCopy, ServiceSlim, FlashDealRow, StarReview,
} from './storyTypes';

export interface UseStoryEditor {
  // step nav
  currentStep: StepId;
  currentIndex: number;
  goNext(): void;
  goBack(): void;
  goToStep(id: StepId): void;
  isFirst: boolean;
  isLast: boolean;
  stepCompletion: Record<StepId, boolean>;
  // canvas
  canvasSharedProps: CanvasProps;
  // premium gating
  isPremiumLocked: boolean;
  isBlurLocked: boolean;
  blurActive: boolean;
  upgradeCopy: UpgradeCopy | null;
  showUpgradeModal: boolean;
  setShowUpgradeModal(v: boolean): void;
  // state + wrapped setters
  state: StoryEditorState;
  set: StorySetters;
  onControlChange(): void;
  // derived data for panels
  services: ServiceSlim[];
  flashDeals: FlashDealRow[];
  starReviews: StarReview[];
  selectedReview: StarReview | null;
  slots: string[]; slotsLoading: boolean;
  flashWinSlots: string[]; flashWinSlotsLoading: boolean;
  portfolioItems: PortfolioItemFull[];
  isPhotoLoading: boolean;
  isStarterPlan: boolean;
  isTMA: boolean;
  todayStr: string;
}

export function useStoryEditor(props: StoryGeneratorProps): UseStoryEditor {
  const { items: externalItems, masterName, masterSlug, initialMode, initialPortfolioId } = props;
  const { profile, masterProfile } = useMasterContext();

  const startMode: Mode = (initialMode && VALID_MODES.has(initialMode as Mode)) ? initialMode as Mode : 'announcement';

  // ── core state ──
  const [palIdx, setPalIdx] = useState(0);
  const [mode, setMode] = useState<Mode>(startMode);
  const [showAvatar, setShowAvatar] = useState(true);
  const [showLinkZone, setShowLinkZone] = useState(true);
  const [styleId, setStyleId] = useState<StyleId>('elegant');
  const [textSize, setTextSize] = useState<TextSize>('M');

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

  const [customBgPhoto, setCustomBgPhoto] = useState<string | null>(null);

  const { data: portfolioItems = [] } = usePortfolioItems(externalItems);
  const firstWithPhoto = externalItems?.find(i => i.photos.length > 0);
  const [selectedBgPhotoId, setSelectedBgPhotoId] = useState<string | null>(
    initialPortfolioId ?? firstWithPhoto?.id ?? null,
  );

  // ── step navigation ──
  const [currentStep, setStep] = useState<StepId>('type');
  const currentIndex = STEP_INDEX[currentStep];
  const goToStep = useCallback((id: StepId) => setStep(id), []);
  const goNext = useCallback(() => setStep(STEPS[Math.min(STEP_INDEX[currentStep] + 1, STEPS.length - 1)].id), [currentStep]);
  const goBack = useCallback(() => setStep(STEPS[Math.max(STEP_INDEX[currentStep] - 1, 0)].id), [currentStep]);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === STEPS.length - 1;

  // ── TMA detection ──
  const [isTMA, setIsTMA] = useState(false);
  useEffect(() => { setIsTMA(!!window.Telegram?.WebApp?.initData); }, []);

  // ── background source (mutually exclusive: portfolio / custom) ──
  const bgPhotoUrlRaw = useMemo(() => {
    if (selectedBgPhotoId) return portfolioItems.find(i => i.id === selectedBgPhotoId)?.photos[0]?.url ?? null;
    return customBgPhoto;
  }, [selectedBgPhotoId, customBgPhoto, portfolioItems]);

  // ── bg photo blob conversion (CORS-safe for export) ──
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
        console.warn('[StoryEditor] bg photo load failed:', err);
        if (!cancelled) { setBgPhotoBlob(null); setIsPhotoLoading(false); }
      });
    return () => { cancelled = true; };
  }, [bgPhotoUrlRaw]);

  const bgPhotoUrl = bgPhotoBlob;

  // ── avatar blob conversion ──
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

  // ── premium gating ──
  const isStarterPlan = (masterProfile?.subscription_tier ?? 'starter') === 'starter';
  const [blurActive, setBlurActive] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onControlChange = useCallback(() => {
    if (!PREMIUM_MODES.has(mode) || !isStarterPlan) return;
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setBlurActive(false);
    blurTimerRef.current = setTimeout(() => setBlurActive(true), 3_000);
  }, [mode, isStarterPlan]);

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

  const isPremiumLocked = PREMIUM_MODES.has(mode) && isStarterPlan;
  const isBlurLocked = isPremiumLocked && blurActive;
  const upgradeCopy = MODE_UPGRADE_COPY[mode] ?? null;

  // ── identity + data ──
  const masterId = masterProfile?.id ?? profile?.id ?? null;
  const displayName = masterName || masterProfile?.business_name || profile?.full_name || "Ваше ім'я";
  const slug = masterSlug || masterProfile?.slug || 'bookit';

  const services = useServices(masterId);
  // derive effective ids (fall back to first) замість sync-в-effect
  const activeSvcId = selectedSvcId ?? services[0]?.id ?? null;
  const activeFlashWinSvcId = flashWinSvcId ?? services[0]?.id ?? null;
  const selectedSvc = services.find(s => s.id === activeSvcId) ?? null;
  const flashWinSvc = services.find(s => s.id === activeFlashWinSvcId) ?? null;

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
  const activeReviewId = selectedReviewId ?? starReviews[0]?.id ?? null;
  const selectedReview = starReviews.find(r => r.id === activeReviewId) ?? null;

  // ── style preset + auto text theme ──
  const preset = presetById(styleId);
  const textTheme = resolveTextTheme({ bgPhotoUrl, palBg: pal.bg });
  const textScale = TEXT_SCALES[textSize];

  // ── canvas props ──
  const canvasSharedProps = useMemo<CanvasProps>(() => ({
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
    // preset
    headingFont: preset.headingFont, bodyFont: preset.bodyFont, treatment: preset.treatment,
    headingWeight: preset.headingWeight, align: preset.align, platePos: preset.platePos,
    uppercase: preset.uppercase, letterSpacing: preset.letterSpacing, textScale,
    // auto theme
    textColor: textTheme.textColor, mutedColor: textTheme.mutedColor,
    plateBg: textTheme.plateBg, textShadow: textTheme.shadow,
    // frame
    showLinkZone,
  }), [
    pal, mode, showAvatar, avatarBlob, displayName, slug,
    annoText, slotsDate, slots, slotsLoading,
    selectedSvc, vacStart, vacEnd, selectedDeal,
    selectedReview, flashWinSvc, flashWinDate, flashWinTime, flashWinDiscount,
    bgPhotoUrl, customBgPhoto, portfolioItems, selectedBgPhotoId,
    preset, textTheme, textScale, showLinkZone,
  ]);

  // ── step completeness (advisory) ──
  const stepCompletion = useMemo(() => {
    const input: StepCompletion = {
      mode, annoText, slotsDate, vacStart, vacEnd, selectedReviewId: activeReviewId, flashWinDate, flashWinTime,
      bgPhotoUrl: bgPhotoUrlRaw,
    };
    return Object.fromEntries(STEPS.map(s => [s.id, isStepComplete(s.id, input)])) as Record<StepId, boolean>;
  }, [mode, annoText, slotsDate, vacStart, vacEnd, activeReviewId, flashWinDate, flashWinTime, bgPhotoUrlRaw]);

  // ── state snapshot ──
  const state = useMemo<StoryEditorState>(() => ({
    palIdx, mode, showAvatar, showLinkZone, annoText, slotsDate,
    selectedSvcId: activeSvcId,
    vacStart, vacEnd, dealIdx,
    selectedReviewId: activeReviewId,
    flashWinSvcId: activeFlashWinSvcId,
    flashWinDate, flashWinTime,
    flashWinDiscount, styleId, textSize, customBgPhoto, selectedBgPhotoId,
  }), [
    palIdx, mode, showAvatar, showLinkZone, annoText, slotsDate, activeSvcId,
    vacStart, vacEnd, dealIdx, activeReviewId, activeFlashWinSvcId, flashWinDate, flashWinTime,
    flashWinDiscount, styleId, textSize, customBgPhoto, selectedBgPhotoId,
  ]);

  // ── setters (wrapped to reset blur timer where the original did) ──
  const set = useMemo<StorySetters>(() => {
    const tap = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); onControlChange(); };
    return {
      setPalIdx: tap(setPalIdx),
      setMode: tap(setMode),
      setShowAvatar,           // toggle — no blur reset (parity with original)
      setShowLinkZone,         // toggle — no blur reset
      setStyleId: tap(setStyleId),
      setTextSize: tap(setTextSize),
      setAnnoText: tap(setAnnoText),
      setSlotsDate: tap(setSlotsDate),
      setSelectedSvcId: tap(setSelectedSvcId),
      setVacStart: tap(setVacStart),
      setVacEnd: tap(setVacEnd),
      setDealIdx: tap(setDealIdx),
      setSelectedReviewId: tap(setSelectedReviewId),
      setFlashWinSvcId: (v) => { setFlashWinSvcId(v); setFlashWinTime(null); onControlChange(); },
      setFlashWinDate: (v) => { setFlashWinDate(v); setFlashWinTime(null); onControlChange(); },
      setFlashWinTime: tap(setFlashWinTime),
      setFlashWinDiscount: tap(setFlashWinDiscount),
      setCustomBgPhoto: tap(setCustomBgPhoto),
      setSelectedBgPhotoId: tap(setSelectedBgPhotoId),
      pickPortfolio: (id) => { setSelectedBgPhotoId(id); setCustomBgPhoto(null); onControlChange(); },
      pickCustom: (dataUrl) => { setCustomBgPhoto(dataUrl); setSelectedBgPhotoId(null); onControlChange(); },
      clearBackground: () => { setSelectedBgPhotoId(null); setCustomBgPhoto(null); },
    };
  }, [onControlChange]);

  return {
    currentStep, currentIndex, goNext, goBack, goToStep, isFirst, isLast, stepCompletion,
    canvasSharedProps,
    isPremiumLocked, isBlurLocked, blurActive, upgradeCopy, showUpgradeModal, setShowUpgradeModal,
    state, set, onControlChange,
    services, flashDeals, starReviews, selectedReview,
    slots, slotsLoading, flashWinSlots, flashWinSlotsLoading,
    portfolioItems, isPhotoLoading, isStarterPlan, isTMA, todayStr,
  };
}
