import Link from 'next/link';
import { Search, Gift, User, LogIn, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export async function PublicNavbar() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex justify-center px-6 pt-4">
        <nav className="pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-xl bg-secondary/25 backdrop-blur-3xl border border-border shadow-lg shadow-secondary/20">

          {/* Logo */}
          <Link
            href="/"
            className="heading-serif text-[17px] text-foreground px-3 py-1.5 rounded-lg hover:bg-secondary/50 active:scale-[0.95] transition-all select-none cursor-pointer"
          >
            Bookit<span className="text-primary">.</span>
          </Link>

          {/* Divider */}
          <div className="w-px h-5 bg-border/60 mx-1" />

          {/* Nav links */}
          <Link
            href="/explore"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 active:scale-[0.95] transition-all cursor-pointer"
          >
            <Search size={13} strokeWidth={2} />
            Каталог
          </Link>

          {user && (
            <>
              <Link
                href="/my/masters"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 active:scale-[0.95] transition-all cursor-pointer"
              >
                <Users size={13} strokeWidth={2} />
                Майстри
              </Link>
              <Link
                href="/my/loyalty"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 active:scale-[0.95] transition-all cursor-pointer"
              >
                <Gift size={13} strokeWidth={2} />
                Бонуси
              </Link>
            </>
          )}

          {/* Divider */}
          <div className="w-px h-5 bg-border/60 mx-1" />

          {/* Auth section */}
          {user ? (
            <>
              <Link
                href="/my/bookings"
                className="px-3.5 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 active:scale-[0.95] transition-all cursor-pointer"
              >
                Мої записи
              </Link>
              <Link
                href="/my/profile"
                className="w-8 h-8 ml-1 rounded-lg bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 active:scale-[0.95] transition-all cursor-pointer"
                aria-label="Профіль"
              >
                <User size={15} strokeWidth={2} />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 active:scale-[0.95] transition-all cursor-pointer"
              >
                <LogIn size={13} strokeWidth={2} />
                Увійти
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg bg-primary text-[13px] font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.95] transition-all shadow-sm cursor-pointer"
              >
                Стати майстром
              </Link>
            </>
          )}

        </nav>
      </div>
    </header>
  );
}
