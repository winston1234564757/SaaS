'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';

function BookingFlowSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" aria-hidden="true">
      <div className="w-full max-w-sm mx-auto bg-white/90 rounded-t-3xl p-6 animate-pulse">
        <div className="w-12 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
        <div className="h-5 w-2/3 rounded-xl bg-gray-200 mb-4" />
        <div className="h-12 w-full rounded-2xl bg-gray-200 mb-3" />
        <div className="h-12 w-full rounded-2xl bg-gray-200 mb-5" />
        <div className="h-14 w-full rounded-2xl bg-gray-200" />
      </div>
    </div>
  );
}

const BookingFlow = dynamic(
  () => import('@/components/public/BookingFlow').then(m => ({ default: m.BookingFlow })),
  { ssr: false, loading: () => <BookingFlowSkeleton /> }
);

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  popular: boolean;
  emoji: string;
  category: string;
}

interface Props {
  masterId: string;
  masterName: string;
  services: Service[];
  initialServiceId: string | null;
  subscriptionTier: 'starter' | 'pro' | 'studio';
  bookingsThisMonth: number;
  pricingRules?: Record<string, unknown> | null;
  workingHours?: Record<string, unknown> | null;
}

export function PortfolioBookingButton({
  masterId,
  masterName,
  services,
  initialServiceId,
  subscriptionTier,
  bookingsThisMonth,
  pricingRules,
  workingHours,
}: Props) {
  const [open, setOpen] = useState(false);
  const initialService = initialServiceId
    ? (services.find(s => s.id === initialServiceId) ?? null)
    : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-semibold text-foreground"
        style={{ background: '#FFE8DC' }}
      >
        Записатись <ChevronRight size={14} />
      </button>

      <BookingFlow
        isOpen={open}
        onClose={() => setOpen(false)}
        services={services}
        products={[]}
        initialService={initialService}
        masterName={masterName}
        masterId={masterId}
        bookingsThisMonth={bookingsThisMonth}
        subscriptionTier={subscriptionTier}
        pricingRules={pricingRules as Record<string, unknown> | undefined}
        workingHours={workingHours as import('@/types/database').WorkingHoursConfig | null}
        flashDeal={null}
        c2cRefCode={null}
        c2cDiscountPct={null}
        masterC2cEnabled={false}
        masterC2cDiscountPct={null}
      />
    </>
  );
}
