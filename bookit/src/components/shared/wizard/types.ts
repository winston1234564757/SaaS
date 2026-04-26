// src/components/shared/wizard/types.ts
import type { WorkingHoursConfig } from '@/types/database';

export interface WizardService {
  id: string;
  name: string;
  price: number;
  duration: number;
  popular: boolean;
  emoji: string;
  category: string;
  description?: string | null;
}

export interface WizardProduct {
  id: string;
  name: string;
  price: number;
  description: string | null;
  emoji: string;
  inStock?: boolean;
  stock?: number | null;
}

export interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  masterId: string;
  masterName?: string;
  workingHours?: WorkingHoursConfig | null;
  services: WizardService[];
  products?: WizardProduct[];
  initialServices?: WizardService[];
  mode: 'client' | 'master';
  bookingsThisMonth?: number;
  subscriptionTier?: string;
  /** @deprecated Pricing rules are now fetched server-side in computeBookingPrice. Ignored. */
  pricingRules?: Record<string, unknown>;
  onSuccess?: () => void;
  flashDeal?: {
    id: string;
    discountPct: number;
    serviceName: string;
    serviceId?: string;
    slotDate?: string;
    slotTime?: string;
  } | null;
  initialStep?: WizardStep;
  c2cRefCode?: string | null;
  c2cDiscountPct?: number | null;
}

export type WizardStep = 'services' | 'datetime' | 'products' | 'details' | 'success';

export interface CartItem {
  product: WizardProduct;
  quantity: number;
}
