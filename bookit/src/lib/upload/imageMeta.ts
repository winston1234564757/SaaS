'use client';

/**
 * Intrinsic size + tiny blur placeholder for a chat attachment, read in the browser
 * before upload.
 *
 * next/image needs the dimensions up front to reserve space; the storage row is the only
 * place to keep them, since Supabase Storage does not report image size on read. Anything
 * that is not a raster image (or fails to decode) returns null, and the caller falls back
 * to a plain <img>.
 */

import type { ChatAttachment } from './chatAttachment';

/** Width of the blur placeholder, in px. Height follows the source aspect ratio. */
const BLUR_WIDTH = 16;

/** Below this, a blur placeholder is pointless — the image itself is already tiny. */
const MIN_BLUR_SOURCE = 48;

export interface ImageMeta {
  width: number;
  height: number;
  /** data: URI for next/image `placeholder="blur"`, or null when it could not be produced. */
  blurDataURL: string | null;
}

type Decoded =
  | { kind: 'bitmap'; source: ImageBitmap; width: number; height: number }
  | { kind: 'element'; source: HTMLImageElement; width: number; height: number; objectUrl: string };

async function decode(file: Blob): Promise<Decoded | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return { kind: 'bitmap', source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      // Fall through — some codecs (e.g. certain progressive JPEGs) only decode via <img>.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode failed'));
      el.src = objectUrl;
    });
    return {
      kind: 'element',
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      objectUrl,
    };
  } catch {
    URL.revokeObjectURL(objectUrl);
    return null;
  }
}

function release(decoded: Decoded) {
  if (decoded.kind === 'bitmap') decoded.source.close();
  else URL.revokeObjectURL(decoded.objectUrl);
}

function makeBlur(source: CanvasImageSource, width: number, height: number): string | null {
  if (width < MIN_BLUR_SOURCE || height < MIN_BLUR_SOURCE) return null;

  const blurHeight = Math.max(1, Math.round((BLUR_WIDTH * height) / width));
  const canvas = document.createElement('canvas');
  canvas.width = BLUR_WIDTH;
  canvas.height = blurHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  try {
    ctx.drawImage(source, 0, 0, BLUR_WIDTH, blurHeight);
    // JPEG, not WebP: canvas WebP encoding is not universal, and at 16px the saving is noise.
    return canvas.toDataURL('image/jpeg', 0.4);
  } catch {
    return null;
  }
}

export async function readImageMeta(file: Blob): Promise<ImageMeta | null> {
  if (typeof window === 'undefined') return null;
  if (!file.type.startsWith('image/')) return null;
  // SVG has no intrinsic raster size, and next/image will not optimise it anyway.
  if (file.type === 'image/svg+xml') return null;

  const decoded = await decode(file);
  if (!decoded) return null;

  try {
    const { width, height } = decoded;
    if (!width || !height) return null;
    return { width, height, blurDataURL: makeBlur(decoded.source, width, height) };
  } finally {
    release(decoded);
  }
}

export type { ChatAttachment };

/** Upload result + measured meta, ready to hand to a chat action. */
export async function buildChatAttachment(url: string, file: Blob): Promise<ChatAttachment> {
  const meta = await readImageMeta(file).catch(() => null);
  return {
    url,
    width: meta?.width ?? null,
    height: meta?.height ?? null,
    blurDataURL: meta?.blurDataURL ?? null,
  };
}
