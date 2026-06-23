import type { Metadata, Viewport } from 'next';
import { Geist, Great_Vibes, Cormorant_Garamond } from 'next/font/google';
import  QueryProvider  from '@/lib/providers/QueryProvider';
import { ToastProvider } from '@/lib/toast/context';
import { MyBottomNav } from '@/components/client/MyBottomNav';
import { ServiceWorkerRegistration } from '@/components/shared/ServiceWorkerRegistration';
import { RefCapture } from '@/components/shared/RefCapture';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { createClient } from '@/lib/supabase/server';
import { TelegramProvider } from '@/components/providers/TelegramProvider';
import Script from 'next/script';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const greatVibes = Great_Vibes({
  subsets: ['latin', 'cyrillic'],
  weight: ['400'],
  variable: '--font-great-vibes',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: {
    default: 'Bookit — Онлайн запис до майстрів краси',
    template: '%s | Bookit',
  },
  description: "Твоя booking-сторінка за 2 хвилини. Запис, продаж товарів та CRM для б'юті-майстрів.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookit.com.ua'),
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    siteName: 'Bookit',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Bookit — онлайн запис до майстрів краси' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-180.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Bookit',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  // Android Chrome: keyboard shrinks layout viewport (dvh reacts). iOS ignores
  // this — iOS keyboard handled by AuthViewportShell via visualViewport.
  interactiveWidget: 'resizes-content',
};

import { headers, cookies } from 'next/headers';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const initialIsAuth = headersList.get('x-is-auth') === 'true';
  const pathname = headersList.get('x-pathname') ?? '';
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get('client_theme')?.value;
  // Frost-only strategy: 'default' (Blossom) is wip; missing cookie = new client → Frost
  const rawTheme = (!cookieTheme || cookieTheme === 'default') ? 'frost' : cookieTheme;
  // Force Frost on onboarding routes so the inline beforeInteractive script
  // immediately sets body.backgroundColor = '#EFF2FF' — no JS hydration gap.
  const isOnboardingPath = pathname.startsWith('/dashboard/onboarding') || pathname.startsWith('/onboarding');
  const theme = isOnboardingPath ? 'frost' : rawTheme;

  return (
    <html lang="uk" className={`${geist.variable} ${greatVibes.variable} ${cormorant.variable}`} data-theme={theme || undefined}>
      <head>
        {/* Single authoritative Telegram SDK — beforeInteractive ensures window.Telegram
            is set before React hydrates, so TelegramProvider never needs to poll for it. */}
        <Script
          src="/lib/telegram-web-app.js"
          strategy="beforeInteractive"
          id="telegram-sdk"
        />
        <meta name="theme-color" content={theme === 'studio' ? '#0E1D21' : theme === 'frost' ? '#EFF2FF' : '#DDD5C6'} />
        <Script id="theme-color-dynamic" strategy="beforeInteractive">
          {`
            (function(){
              var t=document.documentElement.getAttribute('data-theme');
              var c={studio:'#0E1D21',frost:'#EFF2FF'};
              var bg=c[t]||'#DDD5C6';
              var m=document.querySelector('meta[name="theme-color"]');
              if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m)}
              m.content=bg;
              document.documentElement.style.backgroundColor=bg;
              document.body&&(document.body.style.backgroundColor=bg);
            })();
          `}
        </Script>
      </head>
      <body className="antialiased">
        {/* Ambient background blobs — CSS animated, no JS */}
        <div aria-hidden="true" className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          <div className="ambient-blob ambient-blob-1" />
          <div className="ambient-blob ambient-blob-2" />
          <div className="ambient-blob ambient-blob-3" />
        </div>

        {/* Static CSS-only Curtain for Background Resume */}
        <div className="app-suspended-curtain">
          <div className="curtain-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#789A99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path><path d="M19 3v4"></path><path d="M21 5h-4"></path></svg>
          </div>
          <p className="curtain-text"></p>
        </div>

        <ServiceWorkerRegistration />
        <RefCapture />
        <NuqsAdapter>
          <QueryProvider>
            <ToastProvider>
              <TelegramProvider>
                <div className="flex flex-col min-h-screen">
                  <main className="flex-1">
                    {children}
                  </main>
                  <MyBottomNav initialIsAuth={initialIsAuth} />
                </div>
              </TelegramProvider>
            </ToastProvider>
          </QueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
