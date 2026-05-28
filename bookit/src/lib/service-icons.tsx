import {
  Brush,
  CircleHelp,
  Crown,
  Droplets,
  Dumbbell,
  Eye,
  Gem,
  Leaf,
  Palette,
  Scissors,
  Sparkles,
  Star,
  Toolbox,
  Wand2,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const SERVICE_ICON_OPTIONS = [
  { name: 'sparkles', label: 'Універсальна' },
  { name: 'scissors', label: 'Стрижка' },
  { name: 'brush', label: 'Макіяж' },
  { name: 'gem', label: 'Манікюр' },
  { name: 'leaf', label: 'Догляд' },
  { name: 'droplets', label: 'SPA' },
  { name: 'wand', label: 'Преміум' },
  { name: 'toolbox', label: 'Інструменти' },
  { name: 'crown', label: 'Підписний' },
  { name: 'eye', label: 'Брови / Вії' },
  { name: 'star', label: 'Популярне' },
  { name: 'zap', label: 'Швидко' },
  { name: 'palette', label: 'Дизайн' },
  { name: 'dumbbell', label: 'Фітнес' },
  { name: 'circleHelp', label: 'Інше' },
] as const;

export type ServiceIconName = typeof SERVICE_ICON_OPTIONS[number]['name'];

const SERVICE_ICON_MAP: Record<ServiceIconName, LucideIcon> = {
  sparkles: Sparkles,
  scissors: Scissors,
  brush: Brush,
  gem: Gem,
  leaf: Leaf,
  droplets: Droplets,
  wand: Wand2,
  toolbox: Toolbox,
  crown: Crown,
  eye: Eye,
  star: Star,
  zap: Zap,
  palette: Palette,
  dumbbell: Dumbbell,
  circleHelp: CircleHelp,
};

interface ServiceIconProps {
  name: ServiceIconName | string | null | undefined;
  size?: number;
  className?: string;
}

export function ServiceIcon({ name, size = 20, className }: ServiceIconProps) {
  const Icon = name && name in SERVICE_ICON_MAP
    ? SERVICE_ICON_MAP[name as ServiceIconName]
    : Sparkles;

  return <Icon size={size} className={cn('shrink-0', className)} />;
}
