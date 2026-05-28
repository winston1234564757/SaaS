'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, AlertCircle, CheckCircle } from 'lucide-react';
import { joinStudio } from '@/app/(master)/dashboard/studio/actions';
import Link from 'next/link';

interface Props {
  studio: { id: string; name: string } | null;
  token: string;
}

export function StudioJoinPage({ studio, token }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!joined) return;
    const t = setTimeout(() => router.push('/dashboard/studio'), 2000);
    return () => clearTimeout(t);
  }, [joined, router]);

  const handleJoin = () => {
    setError(null);
    startTransition(async () => {
      const result = await joinStudio(token);
      if (result.error) {
        setError(result.error);
      } else {
        setJoined(true);
      }
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #FFD2C2 0%, #F0EAE8 50%, #D4E8E7 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="bento-card p-8 w-full max-w-sm flex flex-col items-center gap-5 text-center"
      >
        {joined ? (
          <>
            <div className="w-16 h-16 rounded-3xl bg-success/12 flex items-center justify-center">
              <CheckCircle size={30} className="text-success" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground mb-1">Ви у команді! 🎉</p>
              <p className="text-sm text-muted-foreground/60">Переходимо до кабінету студії...</p>
            </div>
          </>
        ) : !studio ? (
          <>
            <div className="w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle size={28} className="text-destructive" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground mb-1">Посилання недійсне</p>
              <p className="text-sm text-muted-foreground/60">Студія не знайдена або посилання застаріло</p>
            </div>
            <Link href="/dashboard" className="text-sm text-primary font-medium hover:underline">
              До кабінету →
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-3xl bg-success/12 flex items-center justify-center">
              <Building2 size={28} className="text-success" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide mb-1">Запрошення до студії</p>
              <p className="text-xl font-bold text-foreground mb-1">{studio.name}</p>
              <p className="text-sm text-muted-foreground">
                Після приєднання ви отримаєте доступ до всіх Pro функцій у складі команди
              </p>
            </div>

            {error && (
              <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <AlertCircle size={14} className="text-destructive shrink-0" />
                <p className="text-xs text-destructive text-left">{error}</p>
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={isPending}
              className="w-full py-3.5 rounded-2xl bg-success text-white text-sm font-semibold disabled:opacity-60 transition-all active:scale-95 transition-all"
              style={{ boxShadow: '0 4px 16px rgba(92,158,122,0.35)' }}
            >
              {isPending ? 'Приєднуємось...' : 'Приєднатися до студії →'}
            </button>

            <Link href="/dashboard" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              Скасувати
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
