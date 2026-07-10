import type { NextConfig } from 'next';

// Derive the configured Supabase origin from env so CSP reflects the ACTUAL backend
// (prod cloud vs local `supabase start`). Prod keeps the *.supabase.co wildcards below;
// a local http://127.0.0.1:54321 build additionally whitelists its http + ws origin so the
// browser client (REST + realtime) is not blocked by connect-src in a production build (e2e).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseOrigin = (() => {
  try { return supabaseUrl ? new URL(supabaseUrl).origin : ''; } catch { return ''; }
})();
const isLocalSupabase = /^(http:\/\/)?(127\.0\.0\.1|localhost)/.test(supabaseUrl);
const localSupabaseCsp = isLocalSupabase && supabaseOrigin
  ? ` ${supabaseOrigin} ${supabaseOrigin.replace(/^http/, 'ws')}`
  : '';

// next/image refuses any host absent from remotePatterns. The prod cloud is covered by the
// *.supabase.co entry below; a local `supabase start` serves storage over plain http on
// 127.0.0.1:54321, so e2e/own-eyes runs need it whitelisted too — same condition as the CSP above.
const localSupabaseHost = (() => {
  if (!isLocalSupabase || !supabaseUrl) return null;
  try {
    const { hostname, port } = new URL(supabaseUrl);
    return { hostname, port };
  } catch {
    return null;
  }
})();

// V-15: HTTP Security Headers (TMA-Compatible)
const securityHeaders = [
  { key: 'X-Frame-Options',        value: 'SAMEORIGIN' }, // Allow framing for Telegram Mini Apps
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=(self)' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://telegram.org https://oauth.telegram.org",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      `img-src 'self' data: blob: https://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com https://api.qrserver.com${localSupabaseCsp}`,
      `connect-src 'self' data: blob: https://*.supabase.co wss://*.supabase.co https://api.monobank.ua https://maps.googleapis.com${localSupabaseCsp}`,
      "frame-ancestors 'self' https://t.me https://web.telegram.org https://*.telegram.org", 
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: { ignoreBuildErrors: process.env.SKIP_TS_CHECK === 'true' },
  images: {
    // Next refuses to fetch an image that resolves to a private IP (SSRF guard), which is
    // exactly what a local `supabase start` is. Whitelisting the host is not enough — the
    // guard runs after the pattern match. Scoped to local Supabase, so prod stays protected.
    dangerouslyAllowLocalIP: isLocalSupabase,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
      ...(localSupabaseHost
        ? [{
            protocol: 'http' as const,
            hostname: localSupabaseHost.hostname,
            port: localSupabaseHost.port,
            pathname: '/storage/v1/object/public/**',
          }]
        : []),
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: '/dashboard/flash',
        destination: '/dashboard/revenue?drawer=flash_deals',
        permanent: false,
      },
      {
        source: '/dashboard/pricing',
        destination: '/dashboard/revenue?drawer=dynamic_pricing',
        permanent: false,
      },
      {
        source: '/dashboard/loyalty',
        destination: '/dashboard/growth?drawer=loyalty',
        permanent: false,
      },
      {
        source: '/dashboard/referral',
        destination: '/dashboard/growth?drawer=referral',
        permanent: false,
      },
      {
        source: '/dashboard/partners',
        destination: '/dashboard/growth?drawer=partners',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
