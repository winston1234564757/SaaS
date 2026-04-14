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
  // CI / Vercel OOM prevention is handled via NODE_OPTIONS in the GH Actions
  // workflow (--max-old-space-size=4096) rather than in this config, because
  // Next.js 16 Turbopack rejects a `webpack:` key when turbopack is active.
};

export default nextConfig;
