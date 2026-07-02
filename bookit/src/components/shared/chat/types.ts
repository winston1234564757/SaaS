/** Shared shape rendered by the chat primitives (DM, Support, Admin). */
export interface ChatMessage {
  id: string;
  sender_id: string;
  message: string | null;
  attachment_url: string | null;
  created_at: string;
  /** Present only where read receipts exist (DM). */
  read_at?: string | null;
}
