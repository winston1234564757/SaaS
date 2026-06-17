'use client';

import { Settings, Users, Sparkles } from 'lucide-react';
import { useMasterContext } from '@/lib/supabase/context';
import { useTour } from '@/lib/hooks/useTour';
import { BlossomDashboard } from './BlossomDashboard';
import { StudioDashboard } from './StudioDashboard';
import { FrostDashboard } from './FrostDashboard';
import { DashboardDrawers } from './DashboardDrawers';
import { TourBanner, type TourStep } from '@/components/master/onboarding/TourBanner';

const DASHBOARD_STEPS: TourStep[] = [
  {
    title: 'Твій кабінет',
    text: 'Це головна — тут одразу видно записи, статистику і підказки що зараз важливо.',
    tourKey: 'dash-0',
  },
  {
    title: 'Вільні слоти сьогодні',
    text: 'Клієнти вже можуть записатись — ось вікна на сьогодні. Жодного налаштування.',
    tourKey: 'dash-1',
  },
  {
    title: 'Контекстна панель',
    text: 'Ця стрічка змінюється залежно від того що відбувається — показує що важливо прямо зараз.',
    tourKey: 'dash-2',
  },
  {
    title: 'Швидкі дії',
    text: 'Flash Sale, Сторіс, Клієнти і Аналітика — найчастіші дії в одному місці.',
    tourKey: 'dash-3',
  },
  {
    title: 'Що далі?',
    text: 'Вибери розділ щоб дізнатись більше.',
    isNavigator: true,
    links: [
      { icon: Settings, label: 'Налаштування', href: '/dashboard/settings' },
      { icon: Users,    label: 'Клієнти',       href: '/dashboard/clients'  },
      { icon: Sparkles, label: 'Маркетинг',     href: '/dashboard/marketing'},
    ],
  },
];

export function DashboardView() {
  const { masterProfile } = useMasterContext();
  const rawTheme = masterProfile?.mood_theme ?? 'frost';
  const tier = masterProfile?.subscription_tier ?? 'starter';
  const canChangeTheme = tier === 'pro' || tier === 'studio';
  const theme = canChangeTheme ? rawTheme : 'frost';

  let Layout: React.ComponentType = BlossomDashboard;
  if (theme === 'studio') Layout = StudioDashboard;
  if (theme === 'frost')  Layout = FrostDashboard;

  const masterId    = masterProfile?.id ?? '';
  const seenTours   = masterProfile?.seen_tours as Record<string, boolean> | null;
  const initialSeen = !!(seenTours?.['dashboard_v3']);

  const { currentStep, nextStep, closeTour } = useTour('dashboard_v3', DASHBOARD_STEPS.length, {
    initialSeen,
    masterId,
  });

  return (
    <>
      <Layout />
      <DashboardDrawers />
      <TourBanner
        steps={DASHBOARD_STEPS}
        currentStep={currentStep}
        onNext={nextStep}
        onClose={closeTour}
      />
    </>
  );
}
