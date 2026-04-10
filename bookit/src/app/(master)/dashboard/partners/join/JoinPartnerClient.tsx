'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Handshake, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { acceptPartnerInvitation } from '@/lib/actions/partners';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Props {
  inviter: {
    name: string;
    emoji: string;
    slug: string;
  };
  token: string;
}

export function JoinPartnerClient({ inviter, token }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleJoin = async () => {
    setLoading(true);
    setError(null);
    const res = await acceptPartnerInvitation(token);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => router.push('/dashboard/partners'), 2000);
    } else {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bento-card max-w-sm w-full p-8 text-center"
      >
        {!success ? (
          <>
            <div className="w-20 h-20 bg-[#F5E8E3] rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm">
              🤝
            </div>
            
            <h1 className="heading-serif text-2xl text-[#2C1A14] mb-3">Нове партнерство!</h1>
            
            <div className="flex items-center justify-center gap-3 bg-[#789A99]/5 p-3 rounded-2xl mb-6">
               <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm">
                 {inviter.emoji}
               </div>
               <div className="text-left">
                  <p className="text-xs text-[#A8928D] uppercase tracking-wider leading-none mb-1">Запрошення від</p>
                  <p className="text-sm font-bold text-[#2C1A14]">{inviter.name}</p>
               </div>
            </div>

            <p className="text-sm text-[#6B5750] leading-relaxed mb-8">
              Приєднуйтесь до мережі <b>{inviter.name}</b>, щоб взаємно рекомендувати один одного вашим клієнтам та збільшувати продажі.
            </p>

            {error && (
              <p className="text-xs text-[#C05B5B] mb-4 bg-[#C05B5B]/10 p-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[#789A99] text-white font-bold text-sm hover:bg-[#5C7E7D] active:scale-[0.98] transition-all shadow-lg shadow-[#789A99]/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Handshake size={18} />
              )}
              {loading ? 'З’єднуємо...' : 'Підтвердити партнерство'}
            </button>
            
            <Link 
              href="/dashboard"
              className="inline-block mt-4 text-xs text-[#A8928D] hover:text-[#2C1A14] transition-colors"
            >
              Скасувати
            </Link>
          </>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-10"
          >
            <CheckCircle2 size={64} className="text-[#789A99] mx-auto mb-6" strokeWidth={1.5} />
            <h2 className="heading-serif text-2xl text-[#2C1A14] mb-2">Ми партнери!</h2>
            <p className="text-sm text-[#A8928D] mb-8">
              Вашу мережу розширено. Переходимо до дашборду...
            </p>
            <Loader2 className="animate-spin text-[#789A99] mx-auto" size={24} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
