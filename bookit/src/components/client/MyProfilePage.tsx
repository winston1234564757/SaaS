'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Loader2, CalendarDays, Mail, ArrowLeft, LogOut } from 'lucide-react';
import { updateClientProfile } from '@/app/my/profile/actions';
import { createClient } from '@/lib/supabase/client';
import { PushSubscribeCard } from '@/components/shared/PushSubscribeCard';

interface Props {
  profile: {
    fullName: string;
    phone: string;
    email: string;
    memberSince: string;
  };
}

const inputCls = 'w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all';

export function MyProfilePage({ profile }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone);

  const memberSinceFormatted = profile.memberSince
    ? new Date(profile.memberSince).toLocaleDateString('uk-UA', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  function handleSave() {
    startTransition(async () => {
      await updateClientProfile(fullName, phone);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/my/bookings"
          className="w-9 h-9 rounded-2xl bg-white/70 border border-white/80 flex items-center justify-center text-[#6B5750] hover:bg-white transition-colors flex-shrink-0"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="bento-card p-4 flex-1">
          <h1 className="heading-serif text-xl text-[#2C1A14] leading-none">Мій профіль</h1>
        </div>
      </div>

      {/* Avatar + meta */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="bento-card p-5 flex items-center gap-4"
      >
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: 'rgba(255, 210, 194, 0.55)' }}
        >
          {fullName ? fullName.charAt(0).toUpperCase() : '👤'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-[#2C1A14] truncate">
            {fullName || 'Ваше ім\'я'}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <Mail size={11} className="text-[#A8928D]" />
            <span className="text-xs text-[#A8928D] truncate">{profile.email}</span>
          </div>
          {memberSinceFormatted && (
            <div className="flex items-center gap-1 mt-0.5">
              <CalendarDays size={11} className="text-[#A8928D]" />
              <span className="text-xs text-[#A8928D]">З {memberSinceFormatted}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, type: 'spring', stiffness: 300, damping: 24 }}
        className="bento-card p-5"
      >
        <p className="text-sm font-semibold text-[#2C1A14] mb-4">Особисті дані</p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">{"Ім'я та прізвище"}</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ваше повне ім'я"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Телефон</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+38 (050) 000-00-00"
              type="tel"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#6B5750] mb-1.5 block">Email</label>
            <input
              value={profile.email}
              disabled
              className={`${inputCls} opacity-50 cursor-not-allowed`}
            />
            <p className="text-[11px] text-[#A8928D] mt-1">Email змінити неможливо</p>
          </div>
        </div>
      </motion.div>

      {/* Push notifications */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, type: 'spring', stiffness: 300, damping: 24 }}
      >
        <PushSubscribeCard />
      </motion.div>

      {/* Save */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, type: 'spring', stiffness: 300, damping: 24 }}
        onClick={handleSave}
        disabled={isPending || !fullName.trim()}
        className={`w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          saved
            ? 'bg-[#5C9E7A] text-white'
            : 'bg-[#789A99] text-white hover:bg-[#6B8C8B] active:scale-[0.98]'
        } disabled:opacity-60`}
      >
        {isPending ? (
          <><Loader2 size={16} className="animate-spin" /> Збереження...</>
        ) : saved ? (
          <><Check size={16} /> Збережено</>
        ) : (
          'Зберегти зміни'
        )}
      </motion.button>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bento-card p-4"
      >
        <p className="text-xs font-semibold text-[#6B5750] mb-2.5">Мої записи</p>
        <Link
          href="/my/bookings"
          className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/60 transition-colors"
        >
          <span className="text-sm text-[#2C1A14]">Переглянути всі записи</span>
          <span className="text-[#789A99] text-sm">→</span>
        </Link>
      </motion.div>

      {/* Вийти з акаунту */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        onClick={async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          document.cookie = 'user_role=; path=/; max-age=0';
          window.location.href = '/login';
        }}
        className="w-full py-3.5 rounded-2xl text-sm font-medium text-[#C05B5B] bg-[#C05B5B]/8 hover:bg-[#C05B5B]/15 border border-[#C05B5B]/20 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={15} />
        Вийти з акаунту
      </motion.button>
    </div>
  );
}
