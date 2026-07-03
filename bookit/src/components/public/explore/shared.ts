import type { ElementType } from 'react';
import {
  Sparkles, Scissors, Eye, Smile, Hand, Flower2, Droplets,
  Zap, Circle, PenTool, MoreHorizontal,
} from 'lucide-react';
import { serviceCategories } from '@/lib/constants/categories';

export const SPRING = { type: 'spring', stiffness: 280, damping: 24 } as const;
export const PAGE_SIZE = 12;

export type SortMode = 'popular' | 'rating' | 'newest' | 'smart';
export type ViewMode = 'grid' | 'list';

export interface ExploreMaster {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  rating: number;
  ratingCount: number;
  avatarUrl: string | null;
  categories: string[];
  isPro: boolean;
  createdAt: string;
  minPrice: number | null;
  availableToday: boolean;
  availableTomorrow: boolean;
  topServices: { name: string; price: number }[];
  portfolioPhotos: string[];
  latitude: number | null;
  longitude: number | null;
}

export type ProcessedMaster = ExploreMaster & { distance: number | null };

export const CAT_ICONS: Record<string, ElementType> = {
  nails:       Sparkles,
  hair:        Scissors,
  brows:       Eye,
  makeup:      Smile,
  massage:     Hand,
  barber:      Scissors,
  cosmetology: Flower2,
  spa:         Droplets,
  waxing:      Zap,
  piercing:    Circle,
  tattoo:      PenTool,
  other:       MoreHorizontal,
};

export const CATEGORY_ALIASES: Record<string, string[]> = {
  brows: ['Брови/Вії', 'Брови'],
};

export const CORMORANT =
  'var(--font-cormorant, "Cormorant Garamond", Georgia, serif)';

export function getCategoryLabel(cats: string[]): string {
  if (!cats.length) return '';
  const first = cats[0]!;
  const def = serviceCategories.find(c => c.id === first || c.label === first);
  return def?.label ?? first;
}

export function primaryPhoto(m: ExploreMaster): string | null {
  return m.avatarUrl ?? m.portfolioPhotos[0] ?? null;
}

/** Deterministic hue constrained to the Frost indigo→violet band (220–286). */
export function monogramHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return 220 + (h % 66);
}

export function initialOf(name: string): string {
  const ch = name.trim()[0];
  return ch ? ch.toUpperCase() : '·';
}
