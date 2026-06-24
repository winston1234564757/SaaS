'use client';

import dynamic from 'next/dynamic';

// AnalyticsPage uses framer-motion and toLocaleString — both produce
// different output on server vs client. Loading it client-only (ssr: false)
// completely eliminates all hydration mismatches.
// isPro is resolved server-side in page.tsx and passed as a prop,
// so there is no flash of locked content for Pro users.
const AnalyticsPage = dynamic(
  () => import('./AnalyticsPage').then(m => m.AnalyticsPage),
  {
    ssr: false,
    // Without a fallback the heavy ssr:false chunk renders null while loading,
    // which makes the navigation feel like nothing happened. Mirror the route
    // loading.tsx skeleton so the transition always has a visible response.
    loading: () => (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="bento-card p-5">
          <div className="h-5 w-36 rounded-xl bg-secondary/80" />
          <div className="h-3 w-24 rounded-xl bg-secondary/80 mt-2" />
        </div>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bento-card p-4 flex items-center gap-3">
            <div className="size-11 rounded-xl bg-secondary/80 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded-lg bg-secondary/80" />
              <div className="h-2.5 w-20 rounded-lg bg-secondary/80" />
            </div>
            <div className="h-3 w-16 rounded-lg bg-secondary/80" />
          </div>
        ))}
      </div>
    ),
  }
);

interface Props {
  isPro: boolean;
}

export function AnalyticsClientLoader({ isPro }: Props) {
  return <AnalyticsPage isPro={isPro} />;
}
