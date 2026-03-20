'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/lib/supabase/hooks/useServices';
import { useProducts } from '@/lib/supabase/hooks/useProducts';
import { useMasterContext } from '@/lib/supabase/context';
import { BookingWizard, type WizardService, type WizardProduct } from '@/components/shared/BookingWizard';
import type { WorkingHoursConfig } from '@/types/database';

interface ManualBookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ManualBookingForm({ isOpen, onClose, onSuccess }: ManualBookingFormProps) {
  const { masterProfile } = useMasterContext();
  const { services } = useServices();
  const { products: allProducts } = useProducts();
  const qc = useQueryClient();

  const activeServices = (services ?? []).filter(s => s.active) as WizardService[];
  const availableProducts = (allProducts ?? []).filter(
    (p) => p.active && (p.stock === null || p.stock > 0)
  ) as WizardProduct[];

  function handleSuccess() {
    qc.invalidateQueries({ queryKey: ['bookings'] });
    qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    qc.invalidateQueries({ queryKey: ['weekly-overview'] });
    qc.invalidateQueries({ queryKey: ['monthly-booking-count'] });
    if (availableProducts.length > 0) qc.invalidateQueries({ queryKey: ['products'] });
    onSuccess?.();
  }

  return (
    <BookingWizard
      isOpen={isOpen}
      onClose={onClose}
      masterId={masterProfile?.id ?? ''}
      workingHours={(masterProfile?.working_hours as WorkingHoursConfig | null) ?? null}
      pricingRules={(masterProfile?.pricing_rules as Record<string, unknown> | null) ?? undefined}
      services={activeServices}
      products={availableProducts}
      mode="master"
      onSuccess={handleSuccess}
    />
  );
}
