'use client';

import dynamic from 'next/dynamic';

// AnalyticsPage uses framer-motion and toLocaleString — both produce
// different output on server vs client. Loading it client-only (ssr: false)
// completely eliminates all hydration mismatches.
// isPro is resolved server-side in page.tsx and passed as a prop,
// so there is no flash of locked content for Pro users.
const AnalyticsPage = dynamic(
  () => import('./AnalyticsPage').then(m => m.AnalyticsPage),
  { ssr: false }
);

interface Props {
  isPro: boolean;
}

export function AnalyticsClientLoader({ isPro }: Props) {
  return <AnalyticsPage isPro={isPro} />;
}
