'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Download, Loader2, Check, X, Megaphone, Lock, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast/context';
import { UpgradePromptModal } from '@/components/shared/UpgradePromptModal';
import { parseError } from '@/lib/utils/errors';

import { StoryCanvas } from './story/StoryCanvas';
import { MODES } from './story/storyConstants';
import { STEP_INDEX } from './story/storySteps';
import { exportCanvasPng } from './story/storyExport';
import { useStoryEditor } from './story/useStoryEditor';
import { StoryPreview } from './story/StoryPreview';
import { StepNav } from './story/StepNav';
import { StepType } from './story/steps/StepType';
import { StepContent } from './story/steps/StepContent';
import { StepLook } from './story/steps/StepLook';
import { StepStyle } from './story/steps/StepStyle';
import { StepExport } from './story/steps/StepExport';
import type { StepId, StoryGeneratorProps } from './story/storyTypes';

const SLIDE = { type: 'spring', stiffness: 360, damping: 30 } as const;
const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 24 : -24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -24 : 24, opacity: 0 }),
};
const fadeVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

export function StoryGenerator(props: StoryGeneratorProps = {}) {
  const { isOpen, onClose } = props;
  const { showToast } = useToast();
  const editor = useStoryEditor(props);
  const {
    state, set, currentStep, currentIndex, goNext, goBack, goToStep, isFirst, isLast, stepCompletion,
    canvasSharedProps, isPremiumLocked, isBlurLocked, blurActive, upgradeCopy, showUpgradeModal, setShowUpgradeModal,
    services, flashDeals, starReviews, selectedReview, slots, slotsLoading, flashWinSlots, flashWinSlotsLoading,
    portfolioItems, isTMA, todayStr,
  } = editor;

  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const desktopPreviewPanelRef = useRef<HTMLDivElement>(null);
  const mobilePreviewPanelRef = useRef<HTMLDivElement>(null);
  const dirRef = useRef(1);

  const [desktopScale, setDesktopScale] = useState(0.8);
  const [mobileScale, setMobileScale] = useState(0.7);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    const el = desktopPreviewPanelRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const pad = 56;
      const s = Math.min((width - pad) / 360, (height - pad) / 640, 1.1);
      setDesktopScale(Math.max(s, 0.5));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = mobilePreviewPanelRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setMobileScale(Math.max(Math.min((w - 24) / 360, 0.82), 0.55));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current || exporting) return;
    if (editor.isPhotoLoading) {
      showToast({ type: 'warning', title: 'Завантаження...', message: 'Чекаємо, поки фото підготується' });
      return;
    }
    setExporting(true);
    const node = canvasRef.current;
    await new Promise(r => setTimeout(r, 1500));
    try {
      const filename = `bookit-story-${state.mode}-${Date.now()}.jpg`;
      const dataUrl = await exportCanvasPng(node, filename, isTMA);
      if (isTMA) {
        showToast({ type: 'info', title: 'Генеруємо', message: 'Майже готово, надсилаємо файл боту' });
        const { data: { session } } = await createClient().auth.getSession();
        const res = await fetch('/api/marketing/send-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
          body: JSON.stringify({ dataUrl, filename, caption: `Ваша сторіс "${MODES.find(m => m.id === state.mode)?.label}" готова!` }),
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
  }, [exporting, editor.isPhotoLoading, isTMA, state.mode, showToast]);

  const handleDownloadOrUpgrade = useCallback(async () => {
    if (isPremiumLocked) { setShowUpgradeModal(true); return; }
    await handleDownload();
  }, [isPremiumLocked, setShowUpgradeModal, handleDownload]);

  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast({ type: 'error', title: 'Фото занадто велике', message: 'Макс. 10MB' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => set.pickCustom(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleNext = useCallback(() => { dirRef.current = 1; goNext(); }, [goNext]);
  const handleBack = useCallback(() => { dirRef.current = -1; goBack(); }, [goBack]);
  const handleJump = useCallback((id: StepId) => { dirRef.current = STEP_INDEX[id] >= currentIndex ? 1 : -1; goToStep(id); }, [goToStep, currentIndex]);

  const downloadBtn = (
    <>
      <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={handleDownloadOrUpgrade} disabled={exporting}
        className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-[background-color,box-shadow] duration-200 disabled:opacity-50 cursor-pointer"
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
    </>
  );

  function renderStep() {
    switch (currentStep) {
      case 'type':
        return <StepType mode={state.mode} onSelect={set.setMode} />;
      case 'content':
        return (
          <StepContent
            state={state} set={set}
            services={services} flashDeals={flashDeals} starReviews={starReviews}
            slots={slots} slotsLoading={slotsLoading}
            flashWinSlots={flashWinSlots} flashWinSlotsLoading={flashWinSlotsLoading}
            todayStr={todayStr} selectedReview={selectedReview}
          />
        );
      case 'look':
        return (
          <StepLook
            palIdx={state.palIdx} onPalette={set.setPalIdx}
            selectedBgPhotoId={state.selectedBgPhotoId} customBgPhoto={state.customBgPhoto}
            portfolioItems={portfolioItems}
            onPickPortfolio={set.pickPortfolio}
            onClearBg={set.clearBackground} onUploadClick={() => fileInputRef.current?.click()}
          />
        );
      case 'style':
        return <StepStyle state={state} set={set} />;
      case 'export':
        return <StepExport isPremiumLocked={isPremiumLocked}>{downloadBtn}</StepExport>;
    }
  }

  const premiumTeaser = (
    <AnimatePresence mode="popLayout">
      {isPremiumLocked && upgradeCopy && (
        <motion.button type="button"
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
          className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 text-left cursor-pointer"
          style={{ background: 'var(--accent-soft)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}
          onClick={() => setShowUpgradeModal(true)}>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground">{upgradeCopy.teaserTitle}</p>
            <p className="text-[11px] text-muted-foreground leading-snug truncate">{upgradeCopy.teaserDesc}</p>
          </div>
          <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>PRO</span>
        </motion.button>
      )}
    </AnimatePresence>
  );

  const stepPanel = (
    <div className="space-y-4">
      <AnimatePresence mode="wait" custom={dirRef.current} initial={false}>
        <motion.div
          key={currentStep}
          custom={dirRef.current}
          variants={reduce ? fadeVariants : slideVariants}
          initial="enter" animate="center" exit="exit"
          transition={SLIDE}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
      {currentStep !== 'export' && premiumTeaser}
      <StepNav
        currentStep={currentStep}
        completion={stepCompletion}
        onBack={handleBack}
        onNext={handleNext}
        onJump={handleJump}
        isFirst={isFirst}
        isLast={isLast}
      />
    </div>
  );

  const previewBlock = (panelRef: React.RefObject<HTMLDivElement | null>, scale: number) => (
    <div ref={panelRef} className="flex justify-center items-center"
      style={{ background: 'color-mix(in srgb, var(--secondary) 18%, transparent)' }}>
      <StoryPreview
        canvasProps={canvasSharedProps}
        scale={scale}
        radius={Math.round(20 * scale)}
        isBlurLocked={isBlurLocked}
        isPremiumLocked={isPremiumLocked}
        blurActive={blurActive}
        upgradeCopy={upgradeCopy}
      />
    </div>
  );

  const contentBody = (
    <div>
      {/* MOBILE — controls on top, preview below */}
      <div className="lg:hidden flex flex-col">
        <div className="px-4 pt-4 pb-2">
          {stepPanel}
        </div>
        <div className="px-4 pt-2 pb-8">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3 text-center">Попередній перегляд</p>
          {previewBlock(mobilePreviewPanelRef, mobileScale)}
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:flex lg:flex-row lg:items-start">
        <div className="flex-1 min-w-0 px-6 py-5">
          {stepPanel}
        </div>
        <div
          ref={desktopPreviewPanelRef}
          className="flex shrink-0 w-[280px] xl:w-[360px] flex-col items-center justify-center self-start sticky top-24 h-[calc(100vh-6rem)] border-l border-border"
          style={{ background: 'color-mix(in srgb, var(--secondary) 25%, transparent)' }}
        >
          <div className="flex flex-col items-center gap-4">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Попередній перегляд</p>
            <StoryPreview
              canvasProps={canvasSharedProps}
              scale={desktopScale}
              radius={Math.round(20 * desktopScale)}
              isBlurLocked={isBlurLocked}
              isPremiumLocked={isPremiumLocked}
              blurActive={blurActive}
              upgradeCopy={upgradeCopy}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const sharedBottom = (
    <>
      <UpgradePromptModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} source="marketing" feature={upgradeCopy?.modalTitle} description={upgradeCopy?.modalDesc} />

      <input type="file" ref={fileInputRef} onChange={handleCustomPhotoUpload} accept="image/*" className="hidden" aria-hidden="true" tabIndex={-1} />

      <AnimatePresence>
        {exporting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-background/60 backdrop-blur-xl">
            <div className="flex flex-col items-center gap-6 text-center px-8">
              <div className="relative">
                <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ rotate: { duration: 8, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
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
                <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
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
              <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-border">
                <h2 className="font-display text-lg font-bold">Генератор Сторіс</h2>
                <button type="button" onClick={() => typeof onClose === 'function' && onClose()} aria-label="Закрити" className="p-2 hover:bg-secondary rounded-full transition-colors cursor-pointer">
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
