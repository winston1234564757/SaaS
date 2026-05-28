import type { LucideIcon } from 'lucide-react';
import {
  Box,
  Boxes,
  Brush,
  Droplets,
  FlaskConical,
  Gem,
  Leaf,
  Package2,
  Scissors,
  ShoppingBag,
  Sparkles,
  Sprout,
  Star,
  Toolbox,
  Wand2,
  BottleWine,
  CircleHelp,
} from 'lucide-react';

export const PRODUCT_ICON_OPTIONS = [
  { name: 'package', label: 'Пакет', icon: Package2 },
  { name: 'shopping-bag', label: 'Сумка', icon: ShoppingBag },
  { name: 'box', label: 'Коробка', icon: Box },
  { name: 'boxes', label: 'Набір', icon: Boxes },
  { name: 'sparkles', label: 'Сяйво', icon: Sparkles },
  { name: 'star', label: 'Зірка', icon: Star },
  { name: 'gem', label: 'Камінь', icon: Gem },
  { name: 'scissors', label: 'Ножиці', icon: Scissors },
  { name: 'leaf', label: 'Листок', icon: Leaf },
  { name: 'sprout', label: 'Паросток', icon: Sprout },
  { name: 'droplets', label: 'Краплі', icon: Droplets },
  { name: 'flask', label: 'Флакон', icon: FlaskConical },
  { name: 'brush', label: 'Пензель', icon: Brush },
  { name: 'wand', label: 'Чарівна паличка', icon: Wand2 },
  { name: 'bottle', label: 'Флакон засобу', icon: BottleWine },
  { name: 'toolbox', label: 'Інструменти', icon: Toolbox },
  { name: 'help', label: 'Інше', icon: CircleHelp },
] as const;

export type ProductIconName = (typeof PRODUCT_ICON_OPTIONS)[number]['name'];

const PRODUCT_ICON_MAP: Record<ProductIconName, LucideIcon> = {
  package: Package2,
  'shopping-bag': ShoppingBag,
  box: Box,
  boxes: Boxes,
  sparkles: Sparkles,
  star: Star,
  gem: Gem,
  scissors: Scissors,
  leaf: Leaf,
  sprout: Sprout,
  droplets: Droplets,
  flask: FlaskConical,
  brush: Brush,
  wand: Wand2,
  bottle: BottleWine,
  toolbox: Toolbox,
  help: CircleHelp,
};

export function ProductIcon({
  name,
  className,
  size = 20,
  strokeWidth = 2,
}: {
  name?: ProductIconName | null;
  className?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const Icon = name ? PRODUCT_ICON_MAP[name] : PRODUCT_ICON_MAP.package;
  return <Icon className={className} size={size} strokeWidth={strokeWidth} />;
}
