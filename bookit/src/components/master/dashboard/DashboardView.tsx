'use client';

import { Settings, Users, Sparkles, CalendarDays, Scissors, ShoppingBag, BarChart2, Rocket, Wallet } from 'lucide-react';
import { useMasterContext } from '@/lib/supabase/context';
import { useTour } from '@/lib/hooks/useTour';
import { BlossomDashboard } from './BlossomDashboard';
import { StudioDashboard } from './StudioDashboard';
import { FrostDashboard } from './FrostDashboard';
import { DashboardDrawers } from './DashboardDrawers';
import { TourBanner, type TourStep, type TourNavLink } from '@/components/master/onboarding/TourBanner';

const DESTINATION_TOURS: Array<{ tourKey: string; link: TourNavLink }> = [
  { tourKey: 'settings_v1',  link: { icon: Settings,    label: 'Налаштування', href: '/dashboard/settings'  } },
  { tourKey: 'clients_v1',   link: { icon: Users,        label: 'Клієнти',      href: '/dashboard/clients'   } },
  { tourKey: 'marketing_v1', link: { icon: Sparkles,     label: 'Маркетинг',    href: '/dashboard/marketing' } },
  { tourKey: 'bookings_v1',  link: { icon: CalendarDays, label: 'Записи',       href: '/dashboard/bookings'  } },
  { tourKey: 'services_v1',  link: { icon: Scissors,     label: 'Послуги',      href: '/dashboard/services'  } },
  { tourKey: 'products_v1',  link: { icon: ShoppingBag,  label: 'Магазин',      href: '/dashboard/products'  } },
  { tourKey: 'analytics_v1', link: { icon: BarChart2,    label: 'Аналітика',    href: '/dashboard/analytics' } },
  { tourKey: 'growth_v1',    link: { icon: Rocket,       label: 'Ріст',         href: '/dashboard/growth'    } },
  { tourKey: 'revenue_v1',   link: { icon: Wallet,       label: 'Дохід',        href: '/dashboard/revenue'   } },
]; // humanized

const BASE_STEPS: TourStep[] = [
  {
    title: 'Твій кабінет',
    text: 'Це головна — тут одразу видно записи, статистику i підказки що зараз важливо.',
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
    text: 'Flash Sale, Сторіс, Клієнти i Аналітика — найчастіші дії в одному місці.',
    tourKey: 'dash-3',
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

  const masterId  = masterProfile?.id ?? '';
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const initialSeen = !!(seenTours?.['dashboard_v3']);

  const nextLinks = DESTINATION_TOURS
    .filter(d => !seenTours?.[d.tourKey])
    .slice(0, 3)
    .map(d => d.link);

  const steps: TourStep[] = nextLinks.length > 0
    ? [...BASE_STEPS, { title: 'Що далі?', text: 'Вибери розділ щоб дізнатись більше.', isNavigator: true, links: nextLinks }]
    : BASE_STEPS;

  const { currentStep, nextStep, closeTour } = useTour('dashboard_v3', steps.length, {
    initialSeen,
    masterId,
  });

  return (
    <>
      <Layout />
      <DashboardDrawers />
      <TourBanner
        steps={steps}
        currentStep={currentStep}
        onNext={nextStep}
        onClose={closeTour}
      />
    </>
  );
}
