'use client';

import { BookingWizard, type WizardService, type WizardProduct } from '@/components/shared/BookingWizard';
import type { WorkingHoursConfig } from '@/types/database';
import type { FlashDeal } from '@/components/public/PublicMasterPage';
import type { WizardStep } from '@/components/shared/wizard/types';

interface Service {
  id: string; name: string; price: number; duration: number;
  popular: boolean; emoji: string; category: string;
}
interface Product {
  id: string; name: string; price: number;
  description: string | null; emoji: string; inStock: boolean;
}

interface BookingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  products?: Product[];
  initialService: Service | null;
  initialServices?: Service[];
  masterName: string;
  masterId: string;
  bookingsThisMonth?: number;
  subscriptionTier?: string;
  pricingRules?: Record<string, unknown>;
  workingHours?: WorkingHoursConfig | null;
  flashDeal?: FlashDeal | null;
  c2cRefCode?: string | null;
  c2cDiscountPct?: number | null;
  masterC2cEnabled?: boolean;
  masterC2cDiscountPct?: number | null;
}

export function BookingFlow({
  isOpen, onClose, services, products = [],
  initialService, initialServices,
  masterName, masterId,
  bookingsThisMonth, subscriptionTier,
  pricingRules, workingHours, flashDeal,
  c2cRefCode, c2cDiscountPct,
  masterC2cEnabled, masterC2cDiscountPct,
}: BookingFlowProps) {
  // Flash deal fast-track: find the service and skip straight to details
  const flashService = flashDeal
    ? (services.find(s => s.id === flashDeal.serviceId) ?? services.find(s => s.name === flashDeal.serviceName))
    : null;

  const initial: WizardService[] | undefined =
    flashDeal && flashService ? [flashService as WizardService] :
    initialServices?.length   ? (initialServices as WizardService[]) :
    initialService             ? [initialService as WizardService] :
    undefined;

  const initialStep: WizardStep | undefined =
    flashDeal && flashService ? 'details' : undefined;

  return (
    <BookingWizard
      isOpen={isOpen}
      onClose={onClose}
      masterId={masterId}
      masterName={masterName}
      workingHours={workingHours}
      services={services as WizardService[]}
      products={products as WizardProduct[]}
      initialServices={initial}
      initialStep={initialStep}
      mode="client"
      bookingsThisMonth={bookingsThisMonth}
      subscriptionTier={subscriptionTier}
      pricingRules={pricingRules}
      flashDeal={flashDeal}
      c2cRefCode={c2cRefCode}
      c2cDiscountPct={c2cDiscountPct}
      masterC2cEnabled={masterC2cEnabled}
      masterC2cDiscountPct={masterC2cDiscountPct}
    />
  );
}
