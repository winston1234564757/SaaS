export interface Service {
  id: string;
  name: string;
  emoji: string;
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
  emoji: string;
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

export const EMOJI_PRESETS = [
  '💅','💎','✨','🌸','🎨','✂️','👑','🌺',
  '🌹','💄','👁️','🎀','💆','💇','🔥','⭐',
  '🌟','💫','🌿','🍃','🧴','🪥','🖌️','🪞',
] as const;

export function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} хв`;
  return m ? `${h} год ${m} хв` : `${h} год`;
}

export function formatPrice(price: number) {
  return price.toLocaleString('uk-UA') + ' ₴';
}

export const INITIAL_SERVICES: Service[] = [
  { id: 's1', name: 'Класичний манікюр',  emoji: '💅', category: 'Манікюр', price: 500,  duration: 60,  popular: true,  active: true  },
  { id: 's2', name: 'Покриття гелем',      emoji: '💎', category: 'Манікюр', price: 700,  duration: 90,  popular: false, active: true  },
  { id: 's3', name: 'Манікюр + покриття',  emoji: '👑', category: 'Манікюр', price: 1100, duration: 120, popular: true,  active: true  },
  { id: 's4', name: 'Педикюр класичний',   emoji: '🌸', category: 'Педикюр', price: 650,  duration: 75,  popular: false, active: true  },
  { id: 's5', name: 'Педикюр + покриття',  emoji: '🌺', category: 'Педикюр', price: 950,  duration: 105, popular: false, active: false },
  { id: 's6', name: 'Дизайн (1 нігтик)',   emoji: '🎨', category: 'Дизайн',  price: 50,   duration: 15,  popular: false, active: true  },
  { id: 's7', name: 'Дизайн (всі нігтики)',emoji: '🖌️', category: 'Дизайн',  price: 200,  duration: 30,  popular: false, active: true  },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Гель-лак OPI',          emoji: '💅', price: 180, stock: null, active: true  },
  { id: 'p2', name: 'База Esthetic',          emoji: '✨', price: 120, stock: 5,    active: true  },
  { id: 'p3', name: 'Засіб для кутикули',     emoji: '🌿', price: 80,  stock: null, active: true  },
  { id: 'p4', name: 'Топ без липкого шару',   emoji: '💎', price: 140, stock: 2,    active: false },
];
