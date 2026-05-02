import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
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

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair',
  display: 'swap',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: {
    default: 'Bookit — Онлайн запис до майстрів краси',
    template: '%s | Bookit',
  },
  description: "Твоя booking-сторінка за 2 хвилини. Запис, продаж товарів та CRM для б'юті-майстрів.",
  metadataBase: new URL('https://bookit-five-psi.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    siteName: 'Bookit',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Bookit',
  },
};

export const viewport: Viewport = {
  themeColor: '#FFE8DC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

import { headers } from 'next/headers';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const initialIsAuth = headersList.get('x-is-auth') === 'true';

  return (
    <html lang="uk" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="afterInteractive"
          id="telegram-sdk-remote"
        />
        <Script
          src="/lib/telegram-web-app.js"
          strategy="beforeInteractive"
          id="telegram-sdk-local"
        />
        <script dangerouslySetInnerHTML={{ __html: `window.TG_STATUS = 'loading';` }} />
        <script dangerouslySetInnerHTML={{ __html: `
          if (window.Telegram) { window.TG_STATUS = 'loaded'; }
          else { 
            var check = setInterval(function() {
              if (window.Telegram) { window.TG_STATUS = 'loaded'; clearInterval(check); }
            }, 100);
            setTimeout(function() { clearInterval(check); if (window.TG_STATUS !== 'loaded') window.TG_STATUS = 'error'; }, 3000);
          }
        `}} />
      </head>
      <body className="antialiased">
        {/* Static CSS-only Curtain for Background Resume */}
        <div className="app-suspended-curtain">
          <div className="curtain-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#789A99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path><path d="M19 3v4"></path><path d="M21 5h-4"></path></svg>
          </div>
          <p className="curtain-text"></p>
        </div>

        <ServiceWorkerRegistration />
        <RefCapture />
        <NuqsAdapter>
          <QueryProvider>
            <ToastProvider>
              <TelegramProvider>
                <div className="flex flex-col min-h-screen pt-[calc(var(--tg-content-safe-area-inset-top,0px)+20px)]">
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
