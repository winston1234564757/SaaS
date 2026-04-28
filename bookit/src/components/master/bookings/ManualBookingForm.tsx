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

  const activeServices = services.filter(s => s.active) as WizardService[];
  const availableProducts: WizardProduct[] = allProducts
    .filter(p => p.is_active && p.stock_qty > 0)
    .map(p => ({
      id:                p.id,
      name:              p.name,
      price:             p.price_kopecks / 100,
      description:       p.description,
      emoji:             '📦',
      inStock:           p.stock_qty > 0,
      stock:             p.stock_qty,
      recommendAlways:   p.recommend_always,
      linkedServiceIds:  (p.product_service_links ?? []).map(l => l.service_id),
    }));

  function handleSuccess() {
    qc.invalidateQueries({ queryKey: ['bookings'] });
    qc.invalidateQueries({ queryKey: ['wizard-schedule'] });
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
