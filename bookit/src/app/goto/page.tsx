import { Suspense } from 'react';
import GotoClient from './GotoClient';

export const metadata = { robots: 'noindex' };

export default function GotoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" />}>
      <GotoClient />
    </Suspense>
  );
}
