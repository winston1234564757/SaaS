'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { useToast } from '@/lib/toast/context';
import {
  revalidateAfterOnboarding,
  saveOnboardingProfile,
  saveOnboardingSchedule,
  saveOnboardingServices,
  saveOnboardingProgress,
  saveOnboardingBusinessName,
} from '@/app/(master)/dashboard/onboarding/actions';
import { e164ToInputPhone, toFullPhone } from '@/lib/utils/phone';
import { generateSecureToken } from '@/lib/utils/token';
import { CATEGORY_TEMPLATES } from '@/lib/constants/onboardingTemplates';
import type { OnboardingData } from '@/types/onboarding';
import type { BreakWindow } from '@/types/database';
import {
  type Step, type DayKey, type DaySchedule,
  STEP_ORDER, DEFAULT_SCHEDULE, TEMPLATE_SCHEDULE,
} from './steps/types';
import { StepBasic } from './steps/StepBasic';
import { StepSchedulePrompt } from './steps/StepSchedulePrompt';
import { StepScheduleForm } from './steps/StepScheduleForm';
import { StepServicesPrompt } from './steps/StepServicesPrompt';
import { StepServicesForm } from './steps/StepServicesForm';
import { StepProfitPredictor } from './steps/StepProfitPredictor';
import { StepProfilePreview } from './steps/StepProfilePreview';
import { StepSuccess } from './steps/StepSuccess';

interface OnboardingWizardProps {
  initialStep: Step;
  initialData: OnboardingData;
}

function getProgressStep(s: Step): number {
  if (s === 'BASIC') return 1;
  if (s === 'SCHEDULE_PROMPT' || s === 'SCHEDULE_FORM') return 2;
  return 3;
}

export function OnboardingWizard({ initialStep, initialData }: OnboardingWizardProps) {
  const { profile, masterProfile, refresh } = useMasterContext();
  const { showToast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const isPro = (masterProfile?.subscription_tier ?? 'starter') !== 'starter';

  const [step, setStep] = useState<Step>(initialStep);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState(initialData.slug ?? '');
  const [copied, setCopied] = useState(false);

  // BASIC
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(initialData.avatarUrl ?? '');
  const [avatarCdnUrl, setAvatarCdnUrl] = useState(initialData.avatarUrl ?? '');
  const [fullName, setFullName] = useState(initialData.fullName ?? profile?.full_name ?? '');
  const [phone, setPhone] = useState(initialData.phone ?? e164ToInputPhone(profile?.phone));
  const hasPhone = !!profile?.phone;
  const [specialization] = useState(initialData.specialization ?? '💅');

  // SCHEDULE_FORM
  const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(
    initialData.schedule ?? DEFAULT_SCHEDULE
  );
  const [bufferTime, setBufferTime] = useState(initialData.bufferTime ?? 0);
  const [breaks, setBreaks] = useState<BreakWindow[]>(initialData.breaks ?? []);

  // SERVICES_FORM
  const [serviceCategoryId, setServiceCategoryId] = useState(initialData.serviceCategoryId || '');
  const [serviceBasePrice, setServiceBasePrice] = useState(initialData.serviceBasePrice || '');
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<Record<string, boolean>>(
    initialData.selectedServiceTypes || { express: true, standard: true, premium: true }
  );

  // PROFIT_PREDICTOR
  const [emptySlots, setEmptySlots] = useState(initialData.emptySlots ?? 4);
  const [flashDealsEnabled, setFlashDealsEnabled] = useState(initialData.flashDealsEnabled ?? true);

  // PROFILE_PREVIEW
  const [businessName, setBusinessName] = useState(initialData.businessName ?? '');

  function goTo(next: Step) {
    const currentIdx = STEP_ORDER.indexOf(step);
    const nextIdx = STEP_ORDER.indexOf(next);
    setDirection(nextIdx >= currentIdx ? 1 : -1);
    setStep(next);
  }

  function buildSnapshot(): OnboardingData {
    return {
      fullName: (fullName || '').trim() || fullName,
      specialization,
      phone,
      avatarUrl: avatarCdnUrl || undefined,
      slug: savedSlug || undefined,
      schedule,
      bufferTime,
      breaks,
      serviceCategoryId,
      serviceBasePrice,
      selectedServiceTypes,
      emptySlots,
      flashDealsEnabled,
      businessName,
    };
  }

  function persistProgress(nextStep: Step) {
    saveOnboardingProgress(nextStep, buildSnapshot()).catch(err =>
      console.error('[onboarding] progress save failed:', err)
    );
  }

  async function handleSaveProfile() {
    if (!fullName.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const uid = profile?.id ?? user.id;

      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() ?? 'jpg';
        const path = `avatars/${uid}/${uid}.${ext}`;
        let uploadTimeoutId: ReturnType<typeof setTimeout> | undefined;
        try {
          const { data: up, error: upError } = await Promise.race([
            supabase.storage.from('images').upload(path, avatarFile, { upsert: true }),
            new Promise<never>((_, reject) => {
              uploadTimeoutId = setTimeout(() => reject(new Error('Timeout завантаження аватара')), 10_000);
            }),
          ]);
          clearTimeout(uploadTimeoutId);
          if (up) {
            const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
            avatarUrl = urlData.publicUrl;
            setAvatarCdnUrl(urlData.publicUrl);
          } else if (upError) {
            console.error('[onboarding] avatar upload error:', upError.message);
            showToast({ type: 'error', title: 'Аватар не завантажено', message: 'Спробуйте пізніше в налаштуваннях' });
          }
        } catch (uploadErr) {
          clearTimeout(uploadTimeoutId);
          console.error('[onboarding] avatar upload failed:', uploadErr);
          showToast({ type: 'error', title: 'Аватар не завантажено', message: 'Спробуйте пізніше в налаштуваннях' });
        }
      }

      const nameSlug = fullName.trim()
        .toLowerCase()
        .replace(/[іїєьъ]/g, '')
        .replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24);
      const finalSlug = nameSlug || `master-${uid.slice(0, 8)}`;
      const referralCode = generateSecureToken(8);

      const { error } = await saveOnboardingProfile({
        fullName: fullName.trim(),
        phone: phone.trim() ? toFullPhone(phone) : null,
        avatarUrl,
        avatarEmoji: specialization,
        slug: finalSlug,
        referralCode,
      });

      if (error) { showToast({ type: 'error', title: 'Помилка збереження', message: error }); return; }

      setSavedSlug(finalSlug);
      saveOnboardingProgress('SCHEDULE_PROMPT', { ...buildSnapshot(), slug: finalSlug }).catch(err =>
        console.error('[onboarding] progress save failed:', err)
      );
      goTo('SCHEDULE_PROMPT');
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Помилка', message: err instanceof Error ? err.message : 'Щось пішло не так' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSchedule() {
    setSaving(true);
    try {
      const { error } = await saveOnboardingSchedule({ schedule, bufferTime, breaks });
      if (error) { showToast({ type: 'error', title: 'Помилка збереження', message: error }); return; }
      persistProgress('SERVICES_PROMPT');
      goTo('SERVICES_PROMPT');
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Помилка', message: err instanceof Error ? err.message : 'Щось пішло не так' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveService() {
    if (!serviceCategoryId || !serviceBasePrice) {
      persistProgress('PROFIT_PREDICTOR');
      goTo('PROFIT_PREDICTOR');
      return;
    }
    setSaving(true);
    try {
      const template = CATEGORY_TEMPLATES[serviceCategoryId];
      const basePriceNum = parseFloat(serviceBasePrice);
      const servicesToSave: Array<{ name: string; emoji: string; price: number; durationMinutes: number }> = [];
      if (template && !isNaN(basePriceNum)) {
        (['express', 'standard', 'premium'] as const)
          .filter(t => selectedServiceTypes?.[t])
          .forEach(t => servicesToSave.push({
            name: template[t].name,
            emoji: template.emoji,
            price: Math.round(basePriceNum * template[t].priceMult),
            durationMinutes: template[t].time,
          }));
      }
      const { error } = await saveOnboardingServices(servicesToSave);
      if (error) { showToast({ type: 'error', title: 'Помилка збереження', message: error }); return; }
      persistProgress('PROFIT_PREDICTOR');
      goTo('PROFIT_PREDICTOR');
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Помилка', message: err instanceof Error ? err.message : 'Щось пішло не так' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfitPredictor() {
    setSaving(true);
    try {
      await saveOnboardingProgress('PROFILE_PREVIEW', buildSnapshot());
      goTo('PROFILE_PREVIEW');
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Помилка', message: err instanceof Error ? err.message : 'Щось пішло не так' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfilePreview() {
    setSaving(true);
    try {
      const { error } = await saveOnboardingBusinessName(businessName);
      if (error) { showToast({ type: 'error', title: 'Помилка збереження', message: error }); return; }
      await saveOnboardingProgress('SUCCESS', buildSnapshot());
      goTo('SUCCESS');
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Помилка', message: err instanceof Error ? err.message : 'Щось пішло не так' });
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete() {
    if (saving) return;
    setSaving(true);
    try {
      await saveOnboardingProgress('SUCCESS', buildSnapshot());
      await revalidateAfterOnboarding();
      await refresh();
      if (typeof window !== 'undefined') localStorage.setItem('bookit_hints_pending', 'true');
      router.push('/dashboard');
    } finally {
      setSaving(false);
    }
  }

  function handleCopyLink() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bookit.com.ua';
    navigator.clipboard.writeText(`${origin}/${savedSlug}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 44, scale: 0.97 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -44, scale: 0.97 }),
  };
  const transition = { type: 'spring' as const, stiffness: 320, damping: 28 };
  const progressStep = getProgressStep(step);
  const showProgress = step !== 'SUCCESS';

  // Derive basePrice for predictor: use serviceBasePrice if set, else 500
  const predictorBasePrice = parseFloat(serviceBasePrice) || 500;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-start px-4 py-8">
      <div className="w-full max-w-sm">

        <p className="text-center mb-7">
          <span className="font-serif text-2xl font-semibold text-[#2C1A14]">
            Bookit<span className="text-[#789A99]">.</span>
          </span>
        </p>

        {showProgress && (
          <div className="flex items-center gap-1.5 mb-6">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className="flex-1 h-1.5 rounded-full transition-all duration-500"
                style={{ background: progressStep >= n ? '#789A99' : '#E8D5CF' }}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          {step === 'BASIC' && (
            <StepBasic
              key="BASIC"
              direction={direction} slideVariants={slideVariants} transition={transition}
              avatarPreview={avatarPreview}
              fullName={fullName} phone={phone} hasPhone={hasPhone} saving={saving}
              onAvatarChange={e => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); } }}
              onFullNameChange={setFullName}
              onPhoneChange={setPhone}
              onSave={handleSaveProfile}
            />
          )}
          {step === 'SCHEDULE_PROMPT' && (
            <StepSchedulePrompt
              key="SCHEDULE_PROMPT"
              direction={direction} slideVariants={slideVariants} transition={transition}
              onSetupSchedule={() => { persistProgress('SCHEDULE_FORM'); goTo('SCHEDULE_FORM'); }}
              onSkip={() => { persistProgress('SERVICES_PROMPT'); goTo('SERVICES_PROMPT'); }}
            />
          )}
          {step === 'SCHEDULE_FORM' && (
            <StepScheduleForm
              key="SCHEDULE_FORM"
              direction={direction} slideVariants={slideVariants} transition={transition}
              schedule={schedule} bufferTime={bufferTime} breaks={breaks} saving={saving}
              onToggleDay={day => setSchedule(s => ({ ...s, [day]: { ...s[day], is_working: !s[day].is_working } }))}
              onScheduleTimeChange={(day, field, val) => setSchedule(s => ({ ...s, [day]: { ...s[day], [field]: val } }))}
              onBufferChange={setBufferTime}
              onAddBreak={() => setBreaks(prev => [...prev, { start: '13:00', end: '14:00' }])}
              onRemoveBreak={i => setBreaks(prev => prev.filter((_, idx) => idx !== i))}
              onBreakFieldChange={(i, field, val) => setBreaks(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: val } : b))}
              onApplyTemplate={() => setSchedule(TEMPLATE_SCHEDULE)}
              onBack={() => { persistProgress('SCHEDULE_PROMPT'); goTo('SCHEDULE_PROMPT'); }}
              onSave={handleSaveSchedule}
            />
          )}
          {step === 'SERVICES_PROMPT' && (
            <StepServicesPrompt
              key="SERVICES_PROMPT"
              direction={direction} slideVariants={slideVariants} transition={transition}
              onAddService={() => { persistProgress('SERVICES_FORM'); goTo('SERVICES_FORM'); }}
              onSkip={() => { persistProgress('PROFIT_PREDICTOR'); goTo('PROFIT_PREDICTOR'); }}
            />
          )}
          {step === 'SERVICES_FORM' && (
            <StepServicesForm
              key="SERVICES_FORM"
              direction={direction} slideVariants={slideVariants} transition={transition}
              serviceCategoryId={serviceCategoryId}
              serviceBasePrice={serviceBasePrice}
              selectedServiceTypes={selectedServiceTypes}
              saving={saving}
              onServiceCategoryIdChange={setServiceCategoryId}
              onServiceBasePriceChange={setServiceBasePrice}
              onSelectedServiceTypesChange={setSelectedServiceTypes}
              onSave={handleSaveService}
              onBack={() => { persistProgress('SERVICES_PROMPT'); goTo('SERVICES_PROMPT'); }}
            />
          )}
          {step === 'PROFIT_PREDICTOR' && (
            <StepProfitPredictor
              key="PROFIT_PREDICTOR"
              direction={direction} slideVariants={slideVariants} transition={transition}
              basePrice={predictorBasePrice}
              emptySlots={emptySlots}
              flashDealsEnabled={flashDealsEnabled}
              isPro={isPro}
              saving={saving}
              onEmptySlotsChange={setEmptySlots}
              onFlashDealsEnabledChange={setFlashDealsEnabled}
              onSave={handleSaveProfitPredictor}
              onBack={() => { persistProgress('SERVICES_FORM'); goTo('SERVICES_FORM'); }}
            />
          )}
          {step === 'PROFILE_PREVIEW' && (
            <StepProfilePreview
              key="PROFILE_PREVIEW"
              direction={direction} slideVariants={slideVariants} transition={transition}
              fullName={fullName}
              avatarPreview={avatarPreview}
              businessName={businessName}
              slug={savedSlug}
              serviceCategoryId={serviceCategoryId}
              serviceBasePrice={serviceBasePrice}
              selectedServiceTypes={selectedServiceTypes}
              flashDealsEnabled={flashDealsEnabled}
              isPro={isPro}
              saving={saving}
              onBusinessNameChange={setBusinessName}
              onSave={handleSaveProfilePreview}
              onBack={() => { persistProgress('PROFIT_PREDICTOR'); goTo('PROFIT_PREDICTOR'); }}
            />
          )}
          {step === 'SUCCESS' && (
            <StepSuccess
              key="SUCCESS"
              direction={direction} slideVariants={slideVariants} transition={transition}
              savedSlug={savedSlug} copied={copied}
              onCopyLink={handleCopyLink}
              onComplete={handleComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
