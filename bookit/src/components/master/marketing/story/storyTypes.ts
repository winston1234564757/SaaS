import type { PortfolioItemFull } from '@/types/database';

export type Mode =
  | 'announcement'
  | 'free_slots'
  | 'vacation'
  | 'promo'
  | 'review_spotlight'
  | 'flash_window'
  | 'portfolio_item';

export interface Palette {
  id: string;
  label: string;
  bg: string;
  text: string;
  muted: string;
  pill: string;
  pillText: string;
  sticker: string;
  stickerText: string;
  brand: string;
  dot: string;
}

export interface GridCfg {
  cols: number;
  gap: number;
  pillH: number;
  fontSize: number;
  fontWeight: number;
  radius: number;
}

export interface ServiceSlim {
  id: string;
  name: string;
  duration_minutes: number;
  buffer_minutes: number;
  emoji: string | null;
}

export interface FlashDealRow {
  id: string;
  service_name: string;
  original_price: number;
  discount_pct: number;
  slot_date: string;
  slot_time: string;
}

export interface StarReview {
  id: string;
  comment: string;
  client_name: string;
}

export interface UpgradeCopy {
  modalTitle: string;
  modalDesc: string;
  overlayTitle: string;
  overlayHint: string;
  teaserTitle: string;
  teaserDesc: string;
}

export interface CanvasProps {
  pal: Palette;
  mode: Mode;
  showAvatar: boolean;
  avatarBlob: string | null;
  displayName: string;
  slug: string;
  annoText: string;
  slotsDate: string | null;
  slots: string[];
  slotsLoading: boolean;
  selectedServiceName: string | null;
  vacStart: string | null;
  vacEnd: string | null;
  selectedDeal: FlashDealRow | null;
  reviewText: string | null;
  reviewClientName: string | null;
  flashWinSvcName: string | null;
  flashWinDate: string | null;
  flashWinTime: string | null;
  flashWinDiscount: number;
  bgPhotoUrl: string | null;
  portfolioTitle: string | null;
  portfolioDesc: string | null;
  platePos: 'top' | 'center' | 'bottom';
  textAlign: 'left' | 'center' | 'right';
  transparency: number;
  isExporting?: boolean;
}

export interface StoryGeneratorProps {
  isOpen?: boolean;
  onClose?: boolean | (() => void);
  items?: PortfolioItemFull[];
  masterName?: string;
  masterSlug?: string;
  initialMode?: string;
}
