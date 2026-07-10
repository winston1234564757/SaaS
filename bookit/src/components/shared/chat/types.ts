/** Shared shape rendered by the chat primitives (DM, Support, Admin). */
export interface ChatMessage {
  id: string;
  sender_id: string;
  message: string | null;
  attachment_url: string | null;
  /** Intrinsic size of the attachment. NULL on legacy rows and non-images — migration 20260710000000. */
  attachment_width?: number | null;
  attachment_height?: number | null;
  /** data: URI blur placeholder for next/image. */
  attachment_blur?: string | null;
  created_at: string;
  /** Present only where read receipts exist (DM). */
  read_at?: string | null;
}
