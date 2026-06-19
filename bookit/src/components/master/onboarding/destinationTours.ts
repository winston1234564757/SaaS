import { Settings, Users, Sparkles, CalendarDays, Scissors, ShoppingBag, BarChart2, Rocket, Wallet } from 'lucide-react';
import type React from 'react';

export interface DestinationTour {
  tourKey: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}

// humanized
export const DESTINATION_TOURS: DestinationTour[] = [
  { tourKey: 'settings_v1',  href: '/dashboard/settings',  icon: Settings,     label: 'Налаштування' },
  { tourKey: 'clients_v1',   href: '/dashboard/clients',   icon: Users,        label: 'Клієнти'      },
  { tourKey: 'marketing_v1', href: '/dashboard/marketing', icon: Sparkles,     label: 'Маркетинг'    },
  { tourKey: 'bookings_v1',  href: '/dashboard/bookings',  icon: CalendarDays, label: 'Записи'       },
  { tourKey: 'services_v1',  href: '/dashboard/services',  icon: Scissors,     label: 'Послуги'      },
  { tourKey: 'products_v1',  href: '/dashboard/products',  icon: ShoppingBag,  label: 'Магазин'      },
  { tourKey: 'analytics_v1', href: '/dashboard/analytics', icon: BarChart2,    label: 'Аналітика'    },
  { tourKey: 'growth_v1',    href: '/dashboard/growth',    icon: Rocket,       label: 'Ріст'         },
  { tourKey: 'revenue_v1',   href: '/dashboard/revenue',   icon: Wallet,       label: 'Дохід'        }, // humanized
];

/** Two-layer check: DB seen_tours (source of truth) + localStorage (same-device, handles context staleness). */
export function isTourSeen(tourKey: string, seenTours: Record<string, boolean> | null): boolean {
  if (seenTours?.[tourKey]) return true;
  if (typeof window !== 'undefined') {
    return localStorage.getItem(`tour_${tourKey}`) === 'done';
  }
  return false;
}
