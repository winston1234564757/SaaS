import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  role: z.enum(['master', 'client']),
});

// V-17: Sets bookit_reg_role as an httpOnly cookie (cannot be read by JS).
// Called by PhoneOtpForm right before triggering Google OAuth.
export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_role' }, { status: 400 });
  }

  const { role } = parsed.data;
  const isProduction = process.env.NODE_ENV === 'production';

  const res = NextResponse.json({ ok: true });

  if (role === 'master') {
    res.cookies.set('bookit_reg_role', 'master', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: 300, // 5 minutes — enough for OAuth round-trip
      path: '/',
    });
  } else {
    res.cookies.set('bookit_reg_role', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: 0,
      path: '/',
    });
  }

  return res;
}
