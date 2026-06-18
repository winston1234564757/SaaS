'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookImage, Send, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { StoryGenerator } from './StoryGenerator';
import { BroadcastsTab } from './BroadcastsTab';
import { useMasterContext } from '@/lib/supabase/context';
import { useTour } from '@/lib/hooks/useTour';
import { TourBanner, type TourStep } from '@/components/master/onboarding/TourBanner';

interface Product { id: string; name: string; price: number }

interface Props {
  initialTab: 'stories' | 'broadcasts';
  initialMode?: string;
  initialPortfolioId?: string;
  isStarter: boolean;
  isPro: boolean;
  broadcastsUsed: number;
  products: Product[];
}

const TABS = [
  { id: 'stories' as const,    label: 'Сторіс',   icon: BookImage },
  { id: 'broadcasts' as const, label: 'Розсилки', icon: Send },
];

// humanized
const MARKETING_STEPS: TourStep[] = [
  {
    title: 'Маркетинг',
    text: 'Два інструменти: Сторіс для залучення нових клієнтів i Розсилки для утримання тих, хто вже записується.',
    tourKey: 'mrk-sidebar',
  },
  {
    title: 'Instagram Сторіс',
    text: 'Обери вільний слот — система сама створить красиву сторіс. Клієнти побачать тебе в стрічці.',
    tourKey: 'mrk-content',
  },
  {
    title: 'Розсилки',
    text: 'Відправ повідомлення всій базі або сегменту. Flash-акції, нагадування, новини — без жодного зайвого кроку.',
  },
  {
    title: 'Маркетинг готовий',
    text: 'Постій Сторіс щотижня + Розсилка щомісяця = клієнти повертаються самі.',
  },
];

export function MarketingTabs({ initialTab, initialMode, initialPortfolioId, isStarter, isPro, broadcastsUsed, products }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as 'stories' | 'broadcasts') || initialTab;

  const { masterProfile } = useMasterContext();
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;
  const { currentStep, nextStep, closeTour } = useTour('marketing_v1', MARKETING_STEPS.length, {
    initialSeen: !!(seenTours?.['marketing_v1']),
    masterId: masterProfile?.id ?? '',
  });

  function switchTab(id: 'stories' | 'broadcasts') {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', id);
    router.replace(`/dashboard/marketing?${params.toString()}`, { scroll: false });
  }

  // Force stories tab when tour starts so mrk-content spotlight is visible
  useEffect(() => {
    if (currentStep === 0 && tab !== 'stories') {
      switchTab('stories');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  return (
    <>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[220px_1fr] lg:gap-6 lg:items-start">

        {/* Left sidebar: header + tab nav */}
        <div className="bento-card p-5 flex flex-col gap-4" data-tour-key="mrk-sidebar">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Megaphone size={20} />
            </div>
            <div>
              <h1 className="heading-serif text-xl text-foreground">Маркетинг</h1>
              <p className="text-sm text-muted-foreground/60">Сторіс та розсилки для клієнтів</p>
            </div>
          </div>

          {/* Tabs: horizontal on mobile, vertical on desktop */}
          <div className="flex gap-1 lg:flex-col">
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => switchTab(t.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-medium transition-colors duration-150 cursor-pointer active:scale-[0.95]',
                    'lg:flex-none lg:w-full lg:justify-start lg:px-4'
                  )}
                  style={
                    active
                      ? { background: 'var(--accent)', color: 'var(--accent-on)' }
                      : { background: 'rgba(255,255,255,0.55)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                  }
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: tab content */}
        <div data-tour-step="act-5" data-tour-key="mrk-content">
          {tab === 'stories' ? (
            <StoryGenerator initialMode={initialMode} initialPortfolioId={initialPortfolioId} />
          ) : (
            <BroadcastsTab
              broadcastsUsed={broadcastsUsed}
              isStarter={isStarter}
              isPro={isPro}
              products={products}
            />
          )}
        </div>
      </div>

      <TourBanner
        steps={MARKETING_STEPS}
        currentStep={currentStep}
        onNext={nextStep}
        onClose={closeTour}
      />
    </>
  );
}
