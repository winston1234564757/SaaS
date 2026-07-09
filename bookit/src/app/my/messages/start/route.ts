import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateConversation } from '@/lib/actions/messages';

/**
 * GET /my/messages/start?to=<userId>
 *
 * Reliable entry point for opening (or creating) a DM with another user.
 * A Route Handler always emits a real 307 — unlike a page-level redirect()
 * inside an async Server Component, which streams after the layout shell has
 * flushed and is silently dropped on hard navigation (BUG-1, 2026-07-10).
 */
export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get('to');
  const base = request.nextUrl.origin;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', base));
  }

  if (!to) {
    return NextResponse.redirect(new URL('/my/messages', base));
  }

  const conv = await getOrCreateConversation(to);
  return NextResponse.redirect(
    new URL(conv ? `/my/messages/${conv.id}` : '/my/messages', base),
  );
}
