import type { CSSProperties, ComponentType } from 'react';
import { Megaphone, Clock, Calendar, Zap, Star, Flame } from 'lucide-react';
import type { Mode, Palette, UpgradeCopy, GridCfg } from './storyTypes';

export const PALETTES: Palette[] = [
  { id: 'nude', label: 'Nude', bg: '#F7F2EE', text: '#2E2925', muted: '#B09A8A', pill: '#EDE5DC', pillText: '#2E2925', sticker: '#FFFFFF', stickerText: '#2E2925', brand: '#C9B5A5', dot: '#8A6E5A' },
  { id: 'sage', label: 'Sage', bg: '#EDF1EC', text: '#243228', muted: '#7A9E88', pill: '#D8E8DA', pillText: '#243228', sticker: '#FFFFFF', stickerText: '#243228', brand: '#9FBDA8', dot: '#3E7A56' },
  { id: 'mono', label: 'Mono', bg: '#FAFAFA', text: '#0D0D0D', muted: '#999999', pill: '#F0F0F0', pillText: '#0D0D0D', sticker: '#0D0D0D', stickerText: '#FFFFFF', brand: '#CCCCCC', dot: '#0D0D0D' },
  { id: 'blush', label: 'Blush', bg: '#FDF6F5', text: '#3D2829', muted: '#C4888E', pill: '#F7E5E5', pillText: '#3D2829', sticker: '#FFFFFF', stickerText: '#3D2829', brand: '#D4AAAC', dot: '#B06070' },
  { id: 'sky', label: 'Sky', bg: '#F0F4F8', text: '#1E3448', muted: '#6898C0', pill: '#DDE9F5', pillText: '#1E3448', sticker: '#FFFFFF', stickerText: '#1E3448', brand: '#8AB8D8', dot: '#2E6898' },
  { id: 'dark', label: 'Dark', bg: '#141414', text: '#EEEEEE', muted: '#666666', pill: '#242424', pillText: '#EEEEEE', sticker: '#EEEEEE', stickerText: '#141414', brand: '#444444', dot: '#888888' },
  { id: 'terracotta', label: 'Terracotta', bg: '#FBF1EC', text: '#3A2A22', muted: '#C08763', pill: '#F3E2D7', pillText: '#3A2A22', sticker: '#FFFFFF', stickerText: '#3A2A22', brand: '#D9A782', dot: '#B5663B' },
  { id: 'lavender',   label: 'Lavender',   bg: '#F4F1FA', text: '#2E2740', muted: '#9B8AC0', pill: '#E7E0F5', pillText: '#2E2740', sticker: '#FFFFFF', stickerText: '#2E2740', brand: '#B9A8DC', dot: '#6E54B0' },
  { id: 'forest',     label: 'Forest',     bg: '#EEF3EF', text: '#1E2D24', muted: '#6F8F79', pill: '#DCE8DF', pillText: '#1E2D24', sticker: '#1E2D24', stickerText: '#FFFFFF', brand: '#9CBCA6', dot: '#2C5E3F' },
  { id: 'champagne',  label: 'Champagne',  bg: '#FBF7EE', text: '#34301F', muted: '#B9A05E', pill: '#F1E9D4', pillText: '#34301F', sticker: '#FFFFFF', stickerText: '#34301F', brand: '#D9C68C', dot: '#A88934' },
];

export const PREMIUM_MODES = new Set<Mode>(['free_slots', 'vacation', 'promo', 'review_spotlight', 'flash_window', 'portfolio_item']);

export const VALID_MODES = new Set<Mode>(['announcement', 'free_slots', 'vacation', 'promo', 'review_spotlight', 'flash_window', 'portfolio_item']);

export const MODES: { id: Mode; label: string; Icon: ComponentType<{ size?: number; strokeWidth?: number }>; premium: boolean }[] = [
  { id: 'announcement', label: 'Анонс', Icon: Megaphone, premium: false },
  { id: 'free_slots', label: 'Вікна', Icon: Clock, premium: true },
  { id: 'vacation', label: 'Відпустка', Icon: Calendar, premium: true },
  { id: 'promo', label: 'Акція', Icon: Zap, premium: true },
  { id: 'review_spotlight', label: 'Відгук', Icon: Star, premium: true },
  { id: 'flash_window', label: 'Гаряче вікно', Icon: Flame, premium: true },
  { id: 'portfolio_item', label: 'Робота', Icon: Star, premium: true },
];

export const MODE_UPGRADE_COPY: Partial<Record<Mode, UpgradeCopy>> = {
  free_slots: {
    modalTitle: 'Покажіть, коли ви вільні',
    modalDesc: 'Генератор автоматично знаходить ваші відкриті слоти і збирає красиву сторіс за секунди — жодного ручного розкладу в Direct.',
    overlayTitle: 'Вільні вікна — тільки PRO',
    overlayHint: 'Автоматичні слоти у сторіс',
    teaserTitle: 'Ваш розклад — у сторіс автоматично',
    teaserDesc: 'Клієнти бачать ваші вільні вікна без жодного повідомлення від вас.',
  },
  vacation: {
    modalTitle: 'Попередьте клієнтів красиво',
    modalDesc: 'Стильна сторіс про відпустку — і ніхто не запишеться на закриті дні. Клієнти бачать дати і самі переносять запис.',
    overlayTitle: 'Відпустка — тільки PRO',
    overlayHint: 'Дати відпустки у сторіс',
    teaserTitle: 'Жодного «а ви працюєте?» у Direct',
    teaserDesc: 'Одна сторіс з датами — і клієнти самі переносять запис.',
  },
  promo: {
    modalTitle: 'Ваші акції продають самі',
    modalDesc: 'Flash Deal у сторіс = слоти закриваються в 2 рази швидше. PRO підключає акції прямо з розкладу за 2 кліки.',
    overlayTitle: 'Flash Deal — тільки PRO',
    overlayHint: 'Акційні слоти у сторіс',
    teaserTitle: 'Флеш-акція, що окупається з першого запису',
    teaserDesc: 'Ваш активний Flash Deal — одразу у сторіс зі знижкою.',
  },
  review_spotlight: {
    modalTitle: 'Відгуки, що продають без слів',
    modalDesc: 'Реальний 5★ відгук у сторіс — це соціальний доказ, сильніший за будь-яку рекламу. PRO підбирає найкращий і верстає за секунду.',
    overlayTitle: 'Review Spotlight — тільки PRO',
    overlayHint: '5★ відгук у сторіс',
    teaserTitle: 'Ваші клієнти рекламують вас самі',
    teaserDesc: 'Один відгук у сторіс = довіра, яку не купиш за гроші.',
  },
  flash_window: {
    modalTitle: 'Закривайте слоти того ж дня',
    modalDesc: 'Вільний слот зі знижкою у сторіс — і запис заповнюється ще до вечора. Це PRO-маркетинг, який окупається з першого клієнта.',
    overlayTitle: 'Гаряче вікно — тільки PRO',
    overlayHint: 'Слот + знижка у сторіс',
    teaserTitle: 'Порожній слот → заповнений за годину',
    teaserDesc: 'Вкажіть знижку, оберіть час — сторіс готова за 10 секунд.',
  },
  portfolio_item: {
    modalTitle: 'Ваші роботи — ваша візитка',
    modalDesc: 'Створюйте професійні анонси ваших найкращих робіт прямо з портфоліо. PRO-шаблон робить фото ще привабливішими для клієнтів.',
    overlayTitle: 'Робота з портфоліо — тільки PRO',
    overlayHint: 'Преміум-шаблон для ваших робіт',
    teaserTitle: 'Фото, що приносять нові записи',
    teaserDesc: 'Оберіть роботу — і сторіс готова. Ваші клієнти оцінять професійний підхід.',
  },
};

export const UA_MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
export const DOW_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export const SANS = "var(--font-geist-sans, 'DM Sans'), system-ui, sans-serif";
export const SERIF = "var(--font-cormorant, 'Cormorant Garamond'), Georgia, serif";

export const INPUT_STYLE: CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 12,
  background: 'var(--surface)', border: '1px solid var(--border)',
  fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
};

export function formatUA(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} ${UA_MONTHS[d.getMonth()]}`;
}

export function getGridConfig(count: number): GridCfg {
  if (count <= 3) return { cols: 1, gap: 10, pillH: 58, fontSize: 20, fontWeight: 700, radius: 14 };
  if (count <= 8) return { cols: 2, gap: 8, pillH: 44, fontSize: 15, fontWeight: 600, radius: 12 };
  return { cols: 3, gap: 6, pillH: 36, fontSize: 12, fontWeight: 600, radius: 10 };
}
