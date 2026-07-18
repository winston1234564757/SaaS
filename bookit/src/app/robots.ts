import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookit.com.ua';

  // Private zones + single-use / token-shaped routes that must never be indexed.
  // /r/, /invite/, /studio/join leak token-shaped URLs into the index if crawlable.
  const disallow = [
    '/dashboard/',
    '/my/',
    '/api/',
    '/onboarding',
    '/login',
    '/goto',
    '/r/',
    '/invite/',
    '/studio/join',
  ];

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      // AI answer engines are explicitly welcomed for GEO visibility in AI search,
      // but kept out of private + token routes just like generic crawlers.
      {
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-SearchBot',
          'PerplexityBot',
          'Google-Extended',
        ],
        allow: '/',
        disallow,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}