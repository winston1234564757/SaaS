import Link from 'next/link';
import { User, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { SmartBackButton } from '@/components/shared/SmartBackButton';

export async function PublicMobileHeader() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  return (
    <header className="flex md:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-white/30 bg-[#FFE8DC]/85 backdrop-blur-md">
      <div className="w-full px-4 flex items-center justify-between">

        {/* Left: back button (client component) */}
        <div className="w-9 flex items-center">
          <SmartBackButton />
        </div>

        {/* Center: logo */}
        <Link href="/" className="heading-serif text-lg text-[#2C1A14]">
          Bookit<span className="text-[#789A99]">.</span>
        </Link>

        {/* Right: auth icon */}
        <div className="w-9 flex items-center justify-end">
          {user ? (
            <Link
              href="/my/profile"
              aria-label="Профіль"
              className="w-9 h-9 rounded-xl bg-[#789A99]/15 flex items-center justify-center text-[#789A99]"
            >
              <User size={17} strokeWidth={2} />
            </Link>
          ) : (
            <Link
              href="/login"
              aria-label="Увійти"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6B5750] hover:bg-black/5 transition-colors"
            >
              <LogIn size={17} strokeWidth={2} />
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
