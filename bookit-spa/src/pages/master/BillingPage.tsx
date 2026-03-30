import { Suspense } from 'react';
// TODO: port BillingPage component from @/components/master/billing/BillingPage
// import { BillingPage as BillingPageView } from '@/components/master/billing/BillingPage';

export function BillingPage() {
  return (
    <Suspense fallback={null}>
      {/* TODO: <BillingPageView /> */}
      <div className="p-6 text-sm text-[#A8928D]">BillingPage — TODO</div>
    </Suspense>
  );
}
