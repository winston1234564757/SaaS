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
        <nav className="pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-2xl bg-white/25 backdrop-blur-3xl border border-white/50 shadow-[0_8px_40px_rgba(44,26,20,0.12),0_1px_0_rgba(255,255,255,0.8)_inset]">

          {/* Logo */}
          <Link
            href="/"
            className="heading-serif text-[17px] text-[#2C1A14] px-3 py-1.5 rounded-xl hover:bg-white/50 transition-all select-none"
          >
            Bookit<span className="text-[#789A99]">.</span>
          </Link>

          {/* Divider */}
          <div className="w-px h-5 bg-[#D4B9B0]/60 mx-1" />

          {/* Nav links */}
          <Link
            href="/explore"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium text-[#6B5750] hover:text-[#2C1A14] hover:bg-white/50 transition-all"
          >
            <Search size={13} strokeWidth={2} />
            Каталог
          </Link>

          {user && (
            <>
              <Link
                href="/my/masters"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium text-[#6B5750] hover:text-[#2C1A14] hover:bg-white/50 transition-all"
              >
                <Users size={13} strokeWidth={2} />
                Майстри
              </Link>
              <Link
                href="/my/loyalty"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium text-[#6B5750] hover:text-[#2C1A14] hover:bg-white/50 transition-all"
              >
                <Gift size={13} strokeWidth={2} />
                Бонуси
              </Link>
            </>
          )}

          {/* Divider */}
          <div className="w-px h-5 bg-[#D4B9B0]/60 mx-1" />

          {/* Auth section */}
          {user ? (
            <>
              <Link
                href="/my/bookings"
                className="px-3.5 py-2 rounded-xl text-[13px] font-medium text-[#6B5750] hover:text-[#2C1A14] hover:bg-white/50 transition-all"
              >
                Мої записи
              </Link>
              <Link
                href="/my/profile"
                className="w-8 h-8 ml-1 rounded-xl bg-[#789A99]/20 flex items-center justify-center text-[#789A99] hover:bg-[#789A99]/35 transition-colors"
                aria-label="Профіль"
              >
                <User size={15} strokeWidth={2} />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium text-[#6B5750] hover:text-[#2C1A14] hover:bg-white/50 transition-all"
              >
                <LogIn size={13} strokeWidth={2} />
                Увійти
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl bg-[#789A99] text-[13px] font-semibold text-white hover:bg-[#6B8C8B] active:scale-95 transition-all shadow-sm"
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
