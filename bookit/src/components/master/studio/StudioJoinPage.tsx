'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  const handleJoin = () => {
    setError(null);
    startTransition(async () => {
      const result = await joinStudio(token);
      if (result.error) {
        setError(result.error);
      } else {
        setJoined(true);
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        await queryClient.invalidateQueries({ queryKey: ['studio'] });
        setTimeout(() => router.push('/dashboard/studio'), 2000);
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
            <div className="w-16 h-16 rounded-3xl bg-[#5C9E7A]/12 flex items-center justify-center">
              <CheckCircle size={30} className="text-[#5C9E7A]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#2C1A14] mb-1">Ви у команді! 🎉</p>
              <p className="text-sm text-[#A8928D]">Переходимо до кабінету студії...</p>
            </div>
          </>
        ) : !studio ? (
          <>
            <div className="w-16 h-16 rounded-3xl bg-[#C05B5B]/10 flex items-center justify-center">
              <AlertCircle size={28} className="text-[#C05B5B]" />
            </div>
            <div>
              <p className="text-base font-semibold text-[#2C1A14] mb-1">Посилання недійсне</p>
              <p className="text-sm text-[#A8928D]">Студія не знайдена або посилання застаріло</p>
            </div>
            <Link href="/dashboard" className="text-sm text-[#789A99] font-medium hover:underline">
              До кабінету →
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-3xl bg-[#5C9E7A]/12 flex items-center justify-center">
              <Building2 size={28} className="text-[#5C9E7A]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#A8928D] uppercase tracking-wide mb-1">Запрошення до студії</p>
              <p className="text-xl font-bold text-[#2C1A14] mb-1">{studio.name}</p>
              <p className="text-sm text-[#6B5750]">
                Після приєднання ви отримаєте доступ до всіх Pro функцій у складі команди
              </p>
            </div>

            {error && (
              <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-[#C05B5B]/10 border border-[#C05B5B]/20">
                <AlertCircle size={14} className="text-[#C05B5B] shrink-0" />
                <p className="text-xs text-[#C05B5B] text-left">{error}</p>
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={isPending}
              className="w-full py-3.5 rounded-2xl bg-[#5C9E7A] text-white text-sm font-semibold disabled:opacity-60 transition-all"
              style={{ boxShadow: '0 4px 16px rgba(92,158,122,0.35)' }}
            >
              {isPending ? 'Приєднуємось...' : 'Приєднатися до студії →'}
            </button>

            <Link href="/dashboard" className="text-xs text-[#A8928D] hover:text-[#6B5750] transition-colors">
              Скасувати
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
