import type { Metadata } from 'next';
import Link from 'next/link';
import { BlobBackground } from '@/components/shared/BlobBackground';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingAgitation } from '@/components/landing/LandingAgitation';
import { LandingMagic } from '@/components/landing/LandingMagic';
import { LandingBentoFeatures } from '@/components/landing/LandingBentoFeatures';
import { LandingEconomy } from '@/components/landing/LandingEconomy';
import { LandingPricing } from '@/components/landing/LandingPricing';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { LandingFooterCTA } from '@/components/landing/LandingFooterCTA';

export const metadata: Metadata = {
  title: 'Bookit — Система, яка сама генерує дохід для б\'юті-майстра',
  description:
    'Смарт-слоти, флеш-акції, програма лояльності та Telegram-сповіщення для б\'юті-майстрів. Безкоштовно для старту.',
};

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh">
      <BlobBackground />

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 pt-4">
        <nav className="max-w-5xl mx-auto flex items-center justify-between px-5 py-3 bento-card">
          <span className="heading-serif text-xl text-[#2C1A14]">
            Bookit<span className="text-[#789A99]">.</span>
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/explore"
              className="text-sm font-medium text-[#6B5750] hover:text-[#2C1A14] transition-colors px-3 py-1.5 hidden sm:block"
            >
              Майстри
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-[#6B5750] hover:text-[#2C1A14] transition-colors px-3 py-1.5"
            >
              Увійти
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-[#C9956A] text-white px-4 py-2 rounded-xl hover:bg-[#B07A52] transition-colors shadow-[0_4px_12px_rgba(201,149,106,0.35)] cursor-pointer"
            >
              Спробувати
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        <LandingHero />
        <LandingAgitation />
        <LandingMagic />
        <LandingBentoFeatures />
        <LandingEconomy />
        <LandingPricing />
        <LandingFAQ />
        <LandingFooterCTA />
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-[#A8928D]">
        <p>© 2026 Bookit — зроблено в Україні 🇺🇦</p>
      </footer>
    </div>
  );
}
