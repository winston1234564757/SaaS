import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BillingPage } from '@/components/master/billing/BillingPage';

export const metadata: Metadata = { title: 'Тариф — Bookit' };

export default function BillingRoute() {
  return (
    <Suspense fallback={null}>
      <BillingPage />
    </Suspense>
  );
}
