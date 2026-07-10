-- Migration 20260710000001: DM chat attachments could never be uploaded
--
-- BUG (pre-existing, since 20260615000002_direct_messages.sql):
-- `support_attachments` is the bucket for BOTH support tickets and direct messages.
-- Its policies (20260529000000_admin_init.sql) assume every object path starts with a
-- support ticket id:
--     auth.uid() IN (SELECT user_id FROM support_tickets
--                    WHERE id = (regexp_split_to_array(name, '/'))[1]::uuid)
-- DirectChatPage uploads to `dm/<conversation_id>/<ts>.<ext>`, so the first segment is the
-- literal 'dm'. `'dm'::uuid` raises 22P02 (invalid input syntax for type uuid), so the
-- INSERT is rejected outright — every DM attachment upload has been failing. The client
-- swallowed the storage error and still wrote the message row, so the chat rendered a
-- broken image pointing at an object that was never stored.
--
-- Fix, in two parts:
--   1. Make the support policies uuid-safe: only attempt the cast when the first path
--      segment actually looks like a uuid, so a non-ticket path can no longer raise.
--   2. Add policies for `dm/<conversation_id>/...`, scoped to the two participants.
--
-- The bucket is public (`public = true`), so unauthenticated reads through
-- /storage/v1/object/public/... keep working; the SELECT policies below only govern the
-- authenticated API surface.
--
-- Rollback: drop the four `* DM attachments` policies and restore the original three
-- support policies from 20260529000000_admin_init.sql.

-- Matches the canonical 8-4-4-4-12 uuid text form.
CREATE OR REPLACE FUNCTION public.is_uuid_text(value TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT value ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
$$;

-- ── 1. Support-ticket attachments: same intent, but cast-safe ────────────────────
DROP POLICY IF EXISTS "Select support attachments" ON storage.objects;
CREATE POLICY "Select support attachments" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'support_attachments'
    AND public.is_uuid_text((storage.foldername(name))[1])
    AND (
      public.is_admin() OR
      auth.uid() IN (
        SELECT user_id FROM public.support_tickets
        WHERE id = ((storage.foldername(name))[1])::uuid
      )
    )
  );

DROP POLICY IF EXISTS "Insert support attachments" ON storage.objects;
CREATE POLICY "Insert support attachments" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'support_attachments'
    AND public.is_uuid_text((storage.foldername(name))[1])
    AND (
      public.is_admin() OR
      auth.uid() IN (
        SELECT user_id FROM public.support_tickets
        WHERE id = ((storage.foldername(name))[1])::uuid
      )
    )
  );

DROP POLICY IF EXISTS "Delete support attachments" ON storage.objects;
CREATE POLICY "Delete support attachments" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'support_attachments'
    AND public.is_uuid_text((storage.foldername(name))[1])
    AND (
      public.is_admin() OR
      auth.uid() IN (
        SELECT user_id FROM public.support_tickets
        WHERE id = ((storage.foldername(name))[1])::uuid
      )
    )
  );

-- ── 2. Direct-message attachments: dm/<conversation_id>/<file> ──────────────────
CREATE OR REPLACE FUNCTION public.is_dm_participant(path TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (storage.foldername(path))[1] = 'dm'
     AND public.is_uuid_text((storage.foldername(path))[2])
     AND EXISTS (
       SELECT 1 FROM public.conversations c
       WHERE c.id = ((storage.foldername(path))[2])::uuid
         AND (c.client_id = auth.uid() OR c.master_id = auth.uid())
     );
$$;

DROP POLICY IF EXISTS "Insert DM attachments" ON storage.objects;
CREATE POLICY "Insert DM attachments" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'support_attachments'
    AND (public.is_admin() OR public.is_dm_participant(name))
  );

DROP POLICY IF EXISTS "Select DM attachments" ON storage.objects;
CREATE POLICY "Select DM attachments" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'support_attachments'
    AND (public.is_admin() OR public.is_dm_participant(name))
  );

DROP POLICY IF EXISTS "Delete DM attachments" ON storage.objects;
CREATE POLICY "Delete DM attachments" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'support_attachments'
    AND (public.is_admin() OR public.is_dm_participant(name))
  );
