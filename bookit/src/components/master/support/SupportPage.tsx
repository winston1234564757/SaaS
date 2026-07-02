'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, GraduationCap, ArrowRight } from 'lucide-react';

export function SupportPage() {
  const router = useRouter();

  const handleGoToChat = () => {
    router.push('/dashboard/support/chat');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Підтримка</h1>
        <p className="text-sm text-text-sub mt-1">Зв&apos;язок з командою BookIT</p>
      </div>

      {/* Chat / Telegram */}
      <div className="bento-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MessageCircle size={22} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Потрібна відповідь від команди?</p>
            <p className="text-xs text-text-sub mt-0.5">Напишіть в онлайн-чаті або через Telegram — відповімо якнайшвидше</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button type="button"
            onClick={handleGoToChat}
            className="flex-1 sm:flex-none px-4.5 py-2 bg-primary text-white text-sm font-bold rounded-2xl hover:opacity-90 active:scale-[0.96] transition-all cursor-pointer text-center"
          >
            Почати чат
          </button>
          <a
            href="https://t.me/bookit_support"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-4.5 py-2 bg-secondary text-foreground border border-border text-sm font-medium rounded-2xl hover:bg-secondary/80 active:scale-[0.96] transition-all text-center"
          >
            Telegram
          </a>
        </div>
      </div>

      {/* Knowledge base → Academy */}
      <Link href="/dashboard/academy" className="block">
        <div className="bento-card p-5 flex items-center justify-between gap-4 group active:scale-[0.99] transition-transform">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-11 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <GraduationCap size={22} className="text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Шукаєте, як щось зробити?</p>
              <p className="text-xs text-text-sub mt-0.5">База знань і відповіді на часті питання — в Академії</p>
            </div>
          </div>
          <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-primary">
            Академія <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    </div>
  );
}
