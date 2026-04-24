import { NextResponse } from 'next/server';

const BILLING_PAGE =
  process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing`
    : 'https://bookit-five-psi.vercel.app/dashboard/billing';

// WayForPay and Monobank POST to returnUrl/redirectUrl after payment.
// A cross-origin POST bypasses session cookies in some browsers and always
// hits middleware as an unauthenticated POST → redirect to /login.
//
// 303 See Other converts the POST to a GET, so the browser follows it with
// the session cookie intact and middleware lets the request through normally.
export async function POST() {
  return NextResponse.redirect(BILLING_PAGE, 303);
}

// Also handle GET (e.g. Monobank sometimes uses GET redirects)
export async function GET() {
  return NextResponse.redirect(BILLING_PAGE, 303);
}
