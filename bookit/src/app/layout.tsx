import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import  QueryProvider  from '@/lib/providers/QueryProvider';
import { ToastProvider } from '@/lib/toast/context';
import { MyBottomNav } from '@/components/client/MyBottomNav';
import { ServiceWorkerRegistration } from '@/components/shared/ServiceWorkerRegistration';
import { RefCapture } from '@/components/shared/RefCapture';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { createClient } from '@/lib/supabase/server';
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
  metadataBase: new URL('https://bookit.com.ua'),
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
  themeColor: '#789A99',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const initialIsAuth = !!session?.user;

  return (
    <html lang="uk" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased">
        <div className="grain-overlay" aria-hidden="true" />
        <ServiceWorkerRegistration />
        <RefCapture />
        <NuqsAdapter>
          <QueryProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </QueryProvider>
        </NuqsAdapter>
        <MyBottomNav initialIsAuth={initialIsAuth} />
      </body>
    </html>
  );
}
