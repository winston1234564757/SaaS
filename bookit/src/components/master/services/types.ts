import { formatDurationFull } from '@/lib/utils/dates';
import type { ProductIconName } from '@/lib/product-icons';
import type { ServiceIconName } from '@/lib/service-icons';
import { z } from 'zod';

export interface Service {
  id: string;
  name: string;
  icon_name: ServiceIconName;
  category: string;
  price: number;
  duration: number; // minutes
  popular: boolean;
  active: boolean;
  description?: string;
  imageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  icon_name: ProductIconName;
  price: number;
  stock: number | null; // null = unlimited
  active: boolean;
  description?: string;
  imageUrl?: string;
}

export const DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120] as const;

export const CATEGORIES = [
  'Манікюр', 'Педикюр', 'Дизайн', 'Вії', 'Брови',
  'Волосся', 'Обличчя', 'Масаж', 'Інше',
] as const;

export const SERVICE_ICON_PRESETS = [
  'sparkles',
  'scissors',
  'brush',
  'gem',
  'leaf',
  'droplets',
  'wand',
  'toolbox',
  'crown',
  'eye',
  'star',
  'zap',
  'palette',
  'dumbbell',
  'circleHelp',
] as const;

export function formatDuration(min: number) {
  return formatDurationFull(min);
}

export function formatPrice(price: number) {
  return price.toLocaleString('uk-UA') + ' грн';
}

export const INITIAL_SERVICES: Service[] = [
  { id: 's1', name: 'Класичний манікюр', icon_name: 'gem', category: 'Манікюр', price: 500, duration: 60, popular: true, active: true },
  { id: 's2', name: 'Покриття гелем', icon_name: 'star', category: 'Манікюр', price: 700, duration: 90, popular: false, active: true },
  { id: 's3', name: 'Манікюр + покриття', icon_name: 'crown', category: 'Манікюр', price: 1100, duration: 120, popular: true, active: true },
  { id: 's4', name: 'Педикюр класичний', icon_name: 'leaf', category: 'Педикюр', price: 650, duration: 75, popular: false, active: true },
  { id: 's5', name: 'Педикюр + покриття', icon_name: 'sparkles', category: 'Педикюр', price: 950, duration: 105, popular: false, active: false },
  { id: 's6', name: 'Дизайн (1 нігтик)', icon_name: 'palette', category: 'Дизайн', price: 50, duration: 15, popular: false, active: true },
  { id: 's7', name: 'Дизайн (всі нігтики)', icon_name: 'brush', category: 'Дизайн', price: 200, duration: 30, popular: false, active: true },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Гель-лак OPI', icon_name: 'package', price: 180, stock: null, active: true },
  { id: 'p2', name: 'База Esthetic', icon_name: 'sparkles', price: 120, stock: 5, active: true },
  { id: 'p3', name: 'Засіб для кутикули', icon_name: 'leaf', price: 80, stock: null, active: true },
  { id: 'p4', name: 'Топ без липкого шару', icon_name: 'star', price: 140, stock: 2, active: false },
];

export const serviceSchema = z.object({
  name: z.string().min(1, 'Вкажіть назву послуги'),
  icon_name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive('Вкажіть ціну'),
  duration: z.number().int().positive('Вкажіть тривалість').min(5),
  popular: z.boolean(),
  active: z.boolean(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Вкажіть назву товару'),
  icon_name: z.string().min(1),
  price: z.number().positive('Вкажіть ціну'),
  stock: z.number().int().min(0).nullable(),
  active: z.boolean(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});
