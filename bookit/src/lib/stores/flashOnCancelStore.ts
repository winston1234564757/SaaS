import { create } from 'zustand';

export interface FlashCancelPrompt {
  discountPct: number;
  serviceName: string;
}

interface FlashOnCancelState {
  bookingId: string | null;
  prompt: FlashCancelPrompt | null;
  /** Open the confirm sheet for a freed slot. */
  request: (bookingId: string, prompt: FlashCancelPrompt) => void;
  /** Dismiss the sheet. */
  clear: () => void;
}

/**
 * M-REV-02 (B): a single global confirm sheet, fed from every master cancel path
 * (BookingCard, BookingActionsDropdown, BookingDetailsModal). A per-card sheet
 * unmounts together with the cancelled booking before it can show — the store
 * lives at the page root, so the prompt survives the card leaving the list.
 */
export const useFlashOnCancelStore = create<FlashOnCancelState>((set) => ({
  bookingId: null,
  prompt: null,
  request: (bookingId, prompt) => set({ bookingId, prompt }),
  clear: () => set({ bookingId: null, prompt: null }),
}));
