'use client';

import { useState } from 'react';
import { BookImage, Send, Bolt } from 'lucide-react';
import { StoryGenerator } from './StoryGenerator';
import { BroadcastsTab } from './BroadcastsTab';
import { WaitlistTab } from './WaitlistTab';

interface Product { id: string; name: string; price: number }

interface Props {
  initialTab: 'stories' | 'broadcasts';
  isStarter: boolean;
  isPro: boolean;
  broadcastsUsed: number;
  products: Product[];
  waitlistConfig: {
    discountPct: number | null;
    lookbackDays: number;
    lookaheadDays: number;
  };
}

const TABS = [
  { id: 'stories' as const,    label: 'Сторіс',    icon: BookImage },
  { id: 'broadcasts' as const, label: 'Розсилки',  icon: Send },
  { id: 'waitlist' as const,   label: 'Waitlist',  icon: Bolt },
];

export function MarketingTabs({ initialTab, isStarter, isPro, broadcastsUsed, products, waitlistConfig }: Props) {
  const [tab, setTab] = useState<'stories' | 'broadcasts' | 'waitlist'>(initialTab as any);

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
              onClick={() => setTab(t.id)}
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
        <StoryGenerator />
      ) : tab === 'broadcasts' ? (
        <BroadcastsTab
          broadcastsUsed={broadcastsUsed}
          isStarter={isStarter}
          isPro={isPro}
          products={products}
        />
      ) : (
        <WaitlistTab config={waitlistConfig} />
      )}
    </div>
  );
}
