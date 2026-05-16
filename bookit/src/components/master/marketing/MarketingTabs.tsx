'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { BookImage, Send } from 'lucide-react';
import { StoryGenerator } from './StoryGenerator';
import { BroadcastsTab } from './BroadcastsTab';

interface Product { id: string; name: string; price: number }

interface Props {
  initialTab: 'stories' | 'broadcasts';
  initialMode?: string;
  isStarter: boolean;
  isPro: boolean;
  broadcastsUsed: number;
  products: Product[];
}

const TABS = [
  { id: 'stories' as const,    label: 'Сторіс',    icon: BookImage },
  { id: 'broadcasts' as const, label: 'Розсилки',  icon: Send },
];

export function MarketingTabs({ initialTab, initialMode, isStarter, isPro, broadcastsUsed, products }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as 'stories' | 'broadcasts') || initialTab;

  function switchTab(id: 'stories' | 'broadcasts') {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', id);
    router.replace(`/dashboard/marketing?${params.toString()}`, { scroll: false });
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 px-4 pt-4 pb-2">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-medium transition-all"
              style={
                active
                  ? { background: '#2C1A14', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.5)', color: '#6B5750', border: '1px solid #E8D5CC' }
              }
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === 'stories' ? (
        <StoryGenerator initialMode={initialMode} />
      ) : (
        <BroadcastsTab
          broadcastsUsed={broadcastsUsed}
          isStarter={isStarter}
          isPro={isPro}
          products={products}
        />
      )}
    </div>
  );
}
