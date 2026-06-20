import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookit.com.ua';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/my/',
          '/api/',
          '/onboarding',
          '/login',
          '/goto',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
