import type { NextConfig } from 'next';

// V-15: HTTP Security Headers
const securityHeaders = [
  { key: 'X-Frame-Options',        value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=(self)' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.monobank.ua https://maps.googleapis.com",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
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
