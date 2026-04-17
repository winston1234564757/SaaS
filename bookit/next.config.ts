import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
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
