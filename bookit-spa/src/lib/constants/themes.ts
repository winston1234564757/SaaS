export const colors = {
  // Brand
  accent: '#789A99',
  accentLight: '#EAF2F1',
  accentDark: '#5C7E7D',

  // Background
  background: '#FFE8DC',
  backgroundDeep: '#FFDDD0',

  // Surface
  surface: 'rgba(255, 255, 255, 0.68)',
  surfaceHover: 'rgba(255, 255, 255, 0.82)',
  border: 'rgba(255, 255, 255, 0.55)',

  // Text
  textPrimary: '#2C1A14',
  textSecondary: '#6B5750',
  textTertiary: '#A8928D',

  // Status
  success: '#5C9E7A',
  warning: '#D4935A',
  error: '#C05B5B',
  info: '#789A99',

  // Blobs
  blobPeach: 'rgba(255, 200, 180, 0.5)',
  blobSage: 'rgba(120, 154, 153, 0.25)',
  blobCream: 'rgba(255, 240, 230, 0.6)',
};

export const moodThemes = {
  default: {
    name: 'Peach & Sage',
    accent: '#789A99',
    background: '#FFE8DC',
    cardBg: 'rgba(255, 255, 255, 0.68)',
    textPrimary: '#2C1A14',
    gradient: ['#FFE8DC', '#FFDDD0'],
    isExclusive: false,
  },
  nudeMinimal: {
    name: 'Nude & Minimal',
    accent: '#C9A96E',
    background: '#FAF7F2',
    cardBg: 'rgba(255, 252, 247, 0.72)',
    textPrimary: '#3D3024',
    gradient: ['#F5EDE0', '#FFF8EF'],
    isExclusive: false,
  },
  boldGlam: {
    name: 'Bold Glam',
    accent: '#E91E8C',
    background: '#FFF5FA',
    cardBg: 'rgba(255, 245, 250, 0.72)',
    textPrimary: '#2D1A24',
    gradient: ['#FFE0F0', '#FFF0F7'],
    isExclusive: false,
  },
  organicEarthy: {
    name: 'Organic & Earthy',
    accent: '#7C9A5E',
    background: '#F7F9F4',
    cardBg: 'rgba(247, 249, 244, 0.72)',
    textPrimary: '#2D3A1F',
    gradient: ['#E8F0DE', '#F2F7EC'],
    isExclusive: false,
  },
  darkLuxe: {
    name: 'Dark Luxe',
    accent: '#D4AF37',
    background: '#1A1A2E',
    cardBg: 'rgba(30, 30, 50, 0.72)',
    textPrimary: '#F0E6D2',
    gradient: ['#232340', '#1A1A2E'],
    isExclusive: false,
  },
  roseGold: {
    name: 'Rose Gold',
    accent: '#B76E79',
    background: '#FFF5F5',
    cardBg: 'rgba(255, 245, 245, 0.72)',
    textPrimary: '#3D2024',
    gradient: ['#FFE8E8', '#FFF0F0'],
    isExclusive: true,
  },
} as const;

export type MoodThemeKey = keyof typeof moodThemes;

export const bookingStatusConfig = {
  pending: {
    color: '#D4935A',
    bgColor: 'rgba(212, 147, 90, 0.12)',
    icon: 'Clock',
    label: 'Очікує',
    pulse: false,
  },
  confirmed: {
    color: '#5C9E7A',
    bgColor: 'rgba(92, 158, 122, 0.12)',
    icon: 'CheckCircle',
    label: 'Підтверджено',
    pulse: true,
  },
  completed: {
    color: '#A8928D',
    bgColor: 'rgba(168, 146, 141, 0.12)',
    icon: 'CheckCheck',
    label: 'Завершено',
    pulse: false,
  },
  cancelled: {
    color: '#C05B5B',
    bgColor: 'rgba(192, 91, 91, 0.12)',
    icon: 'XCircle',
    label: 'Скасовано',
    pulse: false,
    strikethrough: true,
  },
  no_show: {
    color: '#8B7AB5',
    bgColor: 'rgba(139, 122, 181, 0.12)',
    icon: 'UserX',
    label: 'Не прийшов',
    pulse: false,
  },
} as const;

export const animations = {
  cardEnter: {
    initial: { opacity: 0, y: 20, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
  bottomSheet: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  dynamicIsland: {
    collapsed: { width: '200px', height: '56px', borderRadius: '28px' },
    expanded: { width: 'calc(100% - 32px)', height: 'auto', borderRadius: '24px' },
    transition: { type: 'spring', stiffness: 200, damping: 20 },
  },
  tapScale: {
    whileTap: { scale: 0.97 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },
  stagger: {
    animate: { transition: { staggerChildren: 0.06 } },
  },
};
