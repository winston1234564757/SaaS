'use client';

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/lib/supabase/hooks/useServices';
import { useProducts } from '@/lib/supabase/hooks/useProducts';
import { useMasterContext } from '@/lib/supabase/context';
import { BookingWizard, type WizardService, type WizardProduct } from '@/components/shared/BookingWizard';
import type { WorkingHoursConfig } from '@/types/database';
import { invalidateBookingQueries } from '@/lib/utils/invalidateBookingQueries';

interface ManualBookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialDate?: string;
  initialTime?: string;
  initialServiceId?: string;
  initialClientId?: string;
  initialClientName?: string;
  initialClientPhone?: string;
}

export function ManualBookingForm({
  isOpen, onClose, onSuccess,
  initialDate, initialTime, initialServiceId,
  initialClientId, initialClientName, initialClientPhone,
}: ManualBookingFormProps) {
  const { masterProfile } = useMasterContext();
  const { services } = useServices();
  const { products: allProducts } = useProducts();
  const qc = useQueryClient();

  const activeServices: WizardService[] = services
    .filter(s => s.active)
    .map(s => ({
      id:          s.id,
      name:        s.name,
      icon_name:   s.icon_name,
      category:    s.category,
      price:       s.price,
      duration:    s.duration,
      popular:     s.popular,
      description: s.description || null,
      image_url:   (s as { imageUrl?: string | null }).imageUrl ?? null,
    }));
  const availableProducts: WizardProduct[] = allProducts
    .filter(p => p.is_active && p.stock_qty > 0)
    .map(p => ({
      id:               p.id,
      name:             p.name,
      price:            p.price_kopecks / 100,
      description:      p.description,
      icon_name:        p.icon_name,
      inStock:          p.stock_qty > 0,
      stock:            p.stock_qty,
      recommendAlways:  p.recommend_always,
      linkedServiceIds: (p.product_service_links ?? []).map(l => l.service_id),
    }));

  const initialServices = useMemo(
    () => initialServiceId ? activeServices.filter(s => s.id === initialServiceId) : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialServiceId],
  );

  function handleSuccess() {
    invalidateBookingQueries(qc);
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
      initialDate={initialDate}
      initialTime={initialTime}
      initialServices={initialServices}
      initialClientId={initialClientId}
      initialClientName={initialClientName}
      initialClientPhone={initialClientPhone}
    />
  );
}
