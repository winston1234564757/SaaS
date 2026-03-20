'use client';

import { BookingWizard, type WizardService, type WizardProduct } from '@/components/shared/BookingWizard';
import type { WorkingHoursConfig } from '@/types/database';

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
  initialStep?: string;
  masterName: string;
  masterId: string;
  bookingsThisMonth?: number;
  subscriptionTier?: string;
  pricingRules?: Record<string, unknown>;
  workingHours?: WorkingHoursConfig | null;
}

export function BookingFlow({
  isOpen, onClose, services, products = [],
  initialService, initialServices,
  masterName, masterId,
  bookingsThisMonth, subscriptionTier,
  pricingRules, workingHours,
}: BookingFlowProps) {
  const initial: WizardService[] | undefined =
    initialServices?.length ? (initialServices as WizardService[]) :
    initialService            ? [initialService as WizardService] :
    undefined;

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
      mode="client"
      bookingsThisMonth={bookingsThisMonth}
      subscriptionTier={subscriptionTier}
      pricingRules={pricingRules}
    />
  );
}
