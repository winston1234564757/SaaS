import Link from 'next/link';
import { BlobBackground } from '@/components/shared/BlobBackground';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <BlobBackground />

      <header className="sticky top-0 z-40 border-b border-white/30 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="heading-serif text-xl text-foreground">
            Bookit<span className="text-primary">.</span>
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium text-primary hover:text-primary/90 transition-colors"
          >
            Реєстрація
          </Link>
        </div>
      </header>

      <main className="flex-1 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      <footer className="border-t border-white/30 bg-background/60 py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/60">
          <p>© {new Date().getFullYear()} BookIT — ФОП Кошель Віктор Миколайович</p>
          <nav className="flex gap-4 flex-wrap justify-center">
            <Link href="/legal/public-offer" className="hover:text-muted-foreground transition-colors">Публічна оферта</Link>
            <Link href="/legal/terms-of-service" className="hover:text-muted-foreground transition-colors">Умови</Link>
            <Link href="/legal/privacy-policy" className="hover:text-muted-foreground transition-colors">Конфіденційність</Link>
            <Link href="/legal/refund-policy" className="hover:text-muted-foreground transition-colors">Повернення</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
