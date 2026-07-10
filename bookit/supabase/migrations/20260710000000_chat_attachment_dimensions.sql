-- Migration 20260710000000: chat attachment intrinsic dimensions + blur placeholder
--
-- Why: ChatMessageList rendered attachments as a raw <img> because the image size was
-- unknown, so next/image could not reserve space (layout shift on every image message).
-- Supabase Storage does not report image dimensions on read, so the browser measures the
-- file before upload and we persist the result here.
--
-- Additive and fully nullable — existing rows keep attachment_width/height NULL and the UI
-- falls back to the raw <img> path for them. No backfill is possible without downloading
-- every stored file.
--
-- Rollback:
--   ALTER TABLE public.support_messages DROP COLUMN IF EXISTS attachment_width,
--                                       DROP COLUMN IF EXISTS attachment_height,
--                                       DROP COLUMN IF EXISTS attachment_blur;
--   ALTER TABLE public.direct_messages  DROP COLUMN IF EXISTS attachment_width,
--                                       DROP COLUMN IF EXISTS attachment_height,
--                                       DROP COLUMN IF EXISTS attachment_blur;

ALTER TABLE public.support_messages
  ADD COLUMN IF NOT EXISTS attachment_width  INT,
  ADD COLUMN IF NOT EXISTS attachment_height INT,
  ADD COLUMN IF NOT EXISTS attachment_blur   TEXT;

ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS attachment_width  INT,
  ADD COLUMN IF NOT EXISTS attachment_height INT,
  ADD COLUMN IF NOT EXISTS attachment_blur   TEXT;

-- Dimensions are either both present and positive, or both absent. A half-measured row
-- would send next/image a NaN aspect ratio.
--
-- NOTE: the obvious spelling
--   CHECK ((w IS NULL AND h IS NULL) OR (w > 0 AND h > 0))
-- is WRONG. For w=100, h=NULL it evaluates to `false OR NULL` = NULL, and a CHECK that
-- returns NULL passes. The half-measured row it exists to reject would be accepted.
-- Comparing the two IS NULL predicates keeps the expression strictly boolean.
ALTER TABLE public.support_messages DROP CONSTRAINT IF EXISTS support_messages_attachment_dims_ck;
ALTER TABLE public.support_messages
  ADD CONSTRAINT support_messages_attachment_dims_ck CHECK (
    (attachment_width IS NULL) = (attachment_height IS NULL)
    AND (attachment_width IS NULL OR (attachment_width > 0 AND attachment_height > 0))
  );

ALTER TABLE public.direct_messages DROP CONSTRAINT IF EXISTS direct_messages_attachment_dims_ck;
ALTER TABLE public.direct_messages
  ADD CONSTRAINT direct_messages_attachment_dims_ck CHECK (
    (attachment_width IS NULL) = (attachment_height IS NULL)
    AND (attachment_width IS NULL OR (attachment_width > 0 AND attachment_height > 0))
  );

COMMENT ON COLUMN public.support_messages.attachment_width  IS 'Intrinsic px width of attachment_url, measured client-side before upload. NULL for legacy rows and non-images.';
COMMENT ON COLUMN public.support_messages.attachment_height IS 'Intrinsic px height of attachment_url. NULL for legacy rows and non-images.';
COMMENT ON COLUMN public.support_messages.attachment_blur   IS 'Tiny data: URI used as next/image blur placeholder. NULL when not generated.';
COMMENT ON COLUMN public.direct_messages.attachment_width   IS 'Intrinsic px width of attachment_url, measured client-side before upload. NULL for legacy rows and non-images.';
COMMENT ON COLUMN public.direct_messages.attachment_height  IS 'Intrinsic px height of attachment_url. NULL for legacy rows and non-images.';
COMMENT ON COLUMN public.direct_messages.attachment_blur    IS 'Tiny data: URI used as next/image blur placeholder. NULL when not generated.';
