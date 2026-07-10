/**
 * Shape shared by the chat upload sites (client) and the chat actions (server).
 *
 * Lives apart from `imageMeta.ts` because that module is `'use client'`, and a server
 * action must not reach into a client module even for a type.
 */
export interface ChatAttachment {
  url: string;
  /** Intrinsic px size. Null for non-images or when decoding failed. */
  width?: number | null;
  height?: number | null;
  /** data: URI blur placeholder for next/image. */
  blurDataURL?: string | null;
}
