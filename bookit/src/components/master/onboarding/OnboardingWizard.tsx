'use client';

import { useState, useEffect } from 'react';
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
} from '@/app/(master)/dashboard/onboarding/actions';
import { e164ToInputPhone, toFullPhone } from '@/lib/utils/phone';
import { generateSecureToken } from '@/lib/utils/token';
import type { OnboardingData } from '@/types/onboarding';
import type { BreakWindow } from '@/types/database';
import {
  type Step, type DayKey, type DaySchedule,
  STEP_ORDER, DEFAULT_SCHEDULE,
} from './steps/types';
import { OnboardingProgress } from './OnboardingProgress';
import { StepProfile } from './steps/StepProfile';
import { StepServices, type SavedService } from './steps/StepServices';
import { StepSchedule } from './steps/StepSchedule';
import { StepPreview } from './steps/StepPreview';
import { StepSuccess } from './steps/StepSuccess';
import { parseError } from '@/lib/utils/errors';

const VALID_STEPS = new Set<Step>(STEP_ORDER);
const LEGACY_STEP_MAP: Record<string, Step> = {
  BASIC: 'PROFILE',
  SCHEDULE_PROMPT: 'SCHEDULE',
  SCHEDULE_FORM: 'SCHEDULE',
  SERVICES_PROMPT: 'SERVICES',
  SERVICES_FORM: 'SERVICES',
  PROFIT_PREDICTOR: 'PREVIEW',
  PROFILE_PREVIEW: 'PREVIEW',
  CHANNELS: 'SUCCESS',
};

function normalizeStep(raw: string): Step {
  if (VALID_STEPS.has(raw as Step)) return raw as Step;
  return LEGACY_STEP_MAP[raw] ?? 'PROFILE';
}

interface OnboardingWizardProps {
  initialStep: string;
  initialData: OnboardingData;
}

export function OnboardingWizard({ initialStep, initialData }: OnboardingWizardProps) {
  const { profile, refresh } = useMasterContext();
  const { showToast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const prevTheme = document.documentElement.getAttribute('data-theme');
    const prevBodyBg = document.body.style.backgroundColor;
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    document.documentElement.setAttribute('data-theme', 'frost');
    // Lock scroll + force Frost background so rubber-band overscroll
    // on iOS never reveals the Blossom body background behind the wizard.
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.body.style.backgroundColor = '#EFF2FF';
    document.documentElement.style.backgroundColor = '#EFF2FF';
    return () => {
      if (prevTheme) document.documentElement.setAttribute('data-theme', prevTheme);
      else document.documentElement.removeAttribute('data-theme');
      document.documentElement.style.overflow = '';
      document.documentElement.style.overscrollBehavior = '';
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
      document.body.style.backgroundColor = prevBodyBg;
      document.documentElement.style.backgroundColor = prevHtmlBg;
    };
  }, []);

  const [step, setStep] = useState<Step>(normalizeStep(initialStep));
  const [direction, setDirection] = useState<1 | -1>(1);
  const [saving, setSaving] = useState(false);

  // PROFILE state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(initialData.avatarUrl ?? '');
  const [avatarCdnUrl, setAvatarCdnUrl] = useState(initialData.avatarUrl ?? '');
  const [fullName, setFullName] = useState(initialData.fullName ?? profile?.full_name ?? '');
  const [phone, setPhone] = useState(initialData.phone ?? e164ToInputPhone(profile?.phone));
  const hasPhone = !!profile?.phone;
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData.categories ?? []
  );

  // SERVICES state — per-category
  const [categoryPrices, setCategoryPrices] = useState<Record<string, string>>(
    initialData.categoryPrices ?? {}
  );
  const [categoryServiceTypes, setCategoryServiceTypes] = useState<Record<string, Record<string, boolean>>>(
    initialData.categoryServiceTypes ?? {}
  );

  // SCHEDULE state
  const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(
    initialData.schedule ?? DEFAULT_SCHEDULE
  );
  const [bufferTime] = useState(initialData.bufferTime ?? 0);
  const [breaks] = useState<BreakWindow[]>(initialData.breaks ?? []);

  // Slug (set after profile save)
  const [savedSlug, setSavedSlug] = useState(initialData.slug ?? '');
  const [copied, setCopied] = useState(false);

  // ── Persist step to DB (non-blocking, errors logged) ────────────────────────
  function persistStep(step: Step, snapshot: OnboardingData) {
    saveOnboardingProgress(step, snapshot)
      .then(({ error }) => { if (error) console.error('[onboarding] step persist error:', step, error); })
      .catch(err => console.error('[onboarding] step persist network error:', step, err));
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  function goTo(next: Step) {
    const currentIdx = STEP_ORDER.indexOf(step);
    const nextIdx = STEP_ORDER.indexOf(next);
    setDirection(nextIdx >= currentIdx ? 1 : -1);
    setStep(next);
  }

  function buildSnapshot(): OnboardingData {
    return {
      fullName: fullName.trim() || fullName,
      phone,
      avatarUrl: avatarCdnUrl || undefined,
      slug: savedSlug || undefined,
      categories: selectedCategories,
      categoryPrices,
      categoryServiceTypes,
      schedule,
      bufferTime,
      breaks,
    };
  }

  // ── Step 1: Profile ─────────────────────────────────────────────────────────
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
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        try {
          const { data: up, error: upError } = await Promise.race([
            supabase.storage.from('images').upload(path, avatarFile, { upsert: true }),
            new Promise<never>((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error('Timeout')), 10_000);
            }),
          ]);
          clearTimeout(timeoutId);
          if (up) {
            const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
            avatarUrl = urlData.publicUrl;
            setAvatarCdnUrl(urlData.publicUrl);
          } else if (upError) {
            showToast({ type: 'error', title: 'Аватар не завантажено', message: 'Спробуйте пізніше' });
          }
        } catch {
          clearTimeout(timeoutId);
          showToast({ type: 'error', title: 'Аватар не завантажено', message: 'Спробуйте пізніше' });
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
        avatarEmoji: '',
        slug: finalSlug,
        referralCode,
        categories: selectedCategories,
      });

      if (error) {
        showToast({ type: 'error', title: 'Помилка збереження', message: parseError(error) });
        return;
      }

      setSavedSlug(finalSlug);
      persistStep('SERVICES', { ...buildSnapshot(), slug: finalSlug });
      goTo('SERVICES');
    } catch (err) {
      showToast({ type: 'error', title: 'Помилка', message: parseError(err) });
    } finally {
      setSaving(false);
    }
  }

  // ── Step 2: Services ────────────────────────────────────────────────────────
  async function handleSaveService(services: SavedService[]) {
    setSaving(true);
    try {
      if (services.length > 0) {
        const { error } = await saveOnboardingServices(services);
        if (error) {
          showToast({ type: 'error', title: 'Помилка збереження', message: parseError(error) });
          return;
        }
      }
      persistStep('SCHEDULE', buildSnapshot());
      goTo('SCHEDULE');
    } catch (err) {
      showToast({ type: 'error', title: 'Помилка', message: parseError(err) });
    } finally {
      setSaving(false);
    }
  }

  // ── Step 3: Schedule ────────────────────────────────────────────────────────
  async function handleSaveSchedule() {
    setSaving(true);
    try {
      const { error } = await saveOnboardingSchedule({ schedule, bufferTime, breaks });
      if (error) {
        showToast({ type: 'error', title: 'Помилка збереження', message: parseError(error) });
        return;
      }
      persistStep('PREVIEW', buildSnapshot());
      goTo('PREVIEW');
    } catch (err) {
      showToast({ type: 'error', title: 'Помилка', message: parseError(err) });
    } finally {
      setSaving(false);
    }
  }

  // ── Step 4: Preview ─────────────────────────────────────────────────────────
  async function handleSavePreview() {
    persistStep('SUCCESS', buildSnapshot());
    goTo('SUCCESS');
  }

  // ── Step 5: Success + Complete ──────────────────────────────────────────────
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

  // ── Slide animation ─────────────────────────────────────────────────────────
  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 44, scale: 0.97 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -44, scale: 0.97 }),
  };
  const transition = { type: 'spring' as const, stiffness: 320, damping: 28 };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-start px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <p className="text-center mb-7">
          <span className="font-serif text-2xl font-semibold text-foreground">
            Bookit<span className="text-primary">.</span>
          </span>
        </p>

        {/* Progress */}
        {step !== 'SUCCESS' && (
          <div className="mb-6">
            <OnboardingProgress step={step} />
          </div>
        )}

        <AnimatePresence mode="popLayout" custom={direction}>
          {step === 'PROFILE' && (
            <StepProfile
              key="PROFILE"
              direction={direction} slideVariants={slideVariants} transition={transition}
              avatarPreview={avatarPreview}
              fullName={fullName}
              phone={phone}
              hasPhone={hasPhone}
              saving={saving}
              selectedCategories={selectedCategories}
              onAvatarChange={e => {
                const f = e.target.files?.[0];
                if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
              }}
              onFullNameChange={setFullName}
              onPhoneChange={setPhone}
              onCategoriesChange={setSelectedCategories}
              onSave={handleSaveProfile}
            />
          )}

          {step === 'SERVICES' && (
            <StepServices
              key="SERVICES"
              direction={direction} slideVariants={slideVariants} transition={transition}
              selectedCategories={selectedCategories}
              categoryPrices={categoryPrices}
              categoryServiceTypes={categoryServiceTypes}
              saving={saving}
              onCategoryPricesChange={setCategoryPrices}
              onCategoryServiceTypesChange={setCategoryServiceTypes}
              onSave={handleSaveService}
              onSkip={() => {
                persistStep('SCHEDULE', buildSnapshot());
                goTo('SCHEDULE');
              }}
            />
          )}

          {step === 'SCHEDULE' && (
            <StepSchedule
              key="SCHEDULE"
              direction={direction} slideVariants={slideVariants} transition={transition}
              schedule={schedule}
              saving={saving}
              onScheduleChange={setSchedule}
              onSave={handleSaveSchedule}
            />
          )}

          {step === 'PREVIEW' && (
            <StepPreview
              key="PREVIEW"
              direction={direction} slideVariants={slideVariants} transition={transition}
              fullName={fullName}
              avatarUrl={avatarCdnUrl || avatarPreview || undefined}
              selectedCategories={selectedCategories}
              categoryPrices={categoryPrices}
              categoryServiceTypes={categoryServiceTypes}
              schedule={schedule}
              slug={savedSlug}
              onNext={handleSavePreview}
              onSlugChange={(newSlug) => {
                setSavedSlug(newSlug);
                persistStep('PREVIEW', { ...buildSnapshot(), slug: newSlug });
              }}
            />
          )}

          {step === 'SUCCESS' && (
            <StepSuccess
              key="SUCCESS"
              direction={direction} slideVariants={slideVariants} transition={transition}
              savedSlug={savedSlug}
              copied={copied}
              onCopyLink={handleCopyLink}
              onComplete={handleComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
