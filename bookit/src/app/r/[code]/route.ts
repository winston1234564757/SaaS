import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const admin = createAdminClient();

  type LinkRow = { id: string; target_url: string; recipient_id: string | null; clicks: number };
  let link: LinkRow | null = null;
  try {
    const res = await admin
      .from('broadcast_links')
      .select('id, target_url, recipient_id, clicks')
      .eq('code', code)
      .maybeSingle();
    if (res.data) link = res.data as LinkRow;
  } catch {
    // table not yet migrated — redirect to home
  }

  if (!link) {
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL!));
  }

  // Increment clicks + set recipient clicked_at atomically
  await Promise.all([
    admin.from('broadcast_links').update({ clicks: link.clicks + 1 }).eq('id', link.id),
    link.recipient_id
      ? admin
          .from('broadcast_recipients')
          .update({ clicked_at: new Date().toISOString() })
          .eq('id', link.recipient_id)
          .is('clicked_at', null)
      : Promise.resolve(),
  ]);

  return NextResponse.redirect(new URL(link.target_url));
}
