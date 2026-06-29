import type { PortfolioItemFull } from '@/types/database';

export type Mode =
  | 'announcement'
  | 'free_slots'
  | 'vacation'
  | 'promo'
  | 'review_spotlight'
  | 'flash_window'
  | 'portfolio_item';

export type StepId = 'type' | 'content' | 'look' | 'style' | 'export';

export interface StepCompletion {
  mode: Mode;
  annoText: string;
  slotsDate: string | null;
  vacStart: string | null;
  vacEnd: string | null;
  selectedReviewId: string | null;
  flashWinDate: string | null;
  flashWinTime: string | null;
  bgPhotoUrl: string | null;
}

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
  bgGradientCss?: string | null;
  portfolioTitle: string | null;
  portfolioDesc: string | null;
  platePos: 'top' | 'center' | 'bottom';
  textAlign: 'left' | 'center' | 'right';
  transparency: number;
  showSticker?: boolean;
  ctaText?: string;
  isExporting?: boolean;
}

export interface StoryEditorState {
  palIdx: number;
  mode: Mode;
  showAvatar: boolean;
  showSticker: boolean;
  ctaText: string;
  annoText: string;
  slotsDate: string | null;
  selectedSvcId: string | null;
  vacStart: string | null;
  vacEnd: string | null;
  dealIdx: number;
  selectedReviewId: string | null;
  flashWinSvcId: string | null;
  flashWinDate: string | null;
  flashWinTime: string | null;
  flashWinDiscount: number;
  platePos: 'top' | 'center' | 'bottom';
  textAlign: 'left' | 'center' | 'right';
  transparency: number;
  customBgPhoto: string | null;
  selectedBgPhotoId: string | null;
  selectedGradientId: string | null;
  selectedStockId: string | null;
}

export interface StorySetters {
  setPalIdx(v: number): void;
  setMode(v: Mode): void;
  setShowAvatar(updater: boolean | ((p: boolean) => boolean)): void;
  setShowSticker(updater: boolean | ((p: boolean) => boolean)): void;
  setCtaText(v: string): void;
  setAnnoText(v: string): void;
  setSlotsDate(v: string | null): void;
  setSelectedSvcId(v: string | null): void;
  setVacStart(v: string | null): void;
  setVacEnd(v: string | null): void;
  setDealIdx(v: number): void;
  setSelectedReviewId(v: string | null): void;
  setFlashWinSvcId(v: string | null): void;
  setFlashWinDate(v: string | null): void;
  setFlashWinTime(v: string | null): void;
  setFlashWinDiscount(v: number): void;
  setPlatePos(v: 'top' | 'center' | 'bottom'): void;
  setTextAlign(v: 'left' | 'center' | 'right'): void;
  setTransparency(v: number): void;
  setCustomBgPhoto(v: string | null): void;
  setSelectedBgPhotoId(v: string | null): void;
  /** Вибір фону взаємовиключний — кожен із цих сеттерів чистить інші джерела фону */
  pickGradient(id: string | null): void;
  pickStock(id: string | null): void;
  pickPortfolio(id: string | null): void;
  pickCustom(dataUrl: string | null): void;
  clearBackground(): void;
}

export interface StoryGeneratorProps {
  isOpen?: boolean;
  onClose?: boolean | (() => void);
  items?: PortfolioItemFull[];
  masterName?: string;
  masterSlug?: string;
  initialMode?: string;
  initialPortfolioId?: string;
}
