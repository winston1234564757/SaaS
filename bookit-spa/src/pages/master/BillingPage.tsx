import { Suspense } from 'react';
import { BillingPage as BillingPageView } from '@/components/master/billing/BillingPage';

export function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingPageView />
    </Suspense>
  );
}
