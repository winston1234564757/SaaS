'use client';

import { motion } from 'framer-motion';
import { useToast } from '@/lib/toast/context';
import {
  User, Scissors, Globe, Send, Users,
  CheckCircle2, ArrowRight, GraduationCap,
} from 'lucide-react';
import Link from 'next/link';

interface AcademyPageProps {
  profileFilled: boolean;
  servicesAdded: boolean;
  profilePublished: boolean;
  telegramConnected: boolean;
  slug: string;
  referralCode: string;
}

interface SetupCard {
  icon: React.ElementType;
  title: string;
  description: string;
  done: boolean;
  action: 'link' | 'copy';
  href?: string;
  copyValue?: string;
  copyLabel?: string;
}

const rise = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 320, damping: 26, delay: i * 0.07 },
  }),
};

function SetupCardItem({ card, index, onCopy }: { card: SetupCard; index: number; onCopy: (val: string, label: string) => void }) {
  return (
    <motion.div
      custom={index}
      variants={rise}
      initial="hidden"
      animate="visible"
      className="bento-card p-4 flex items-center gap-4 group"
    >
      <span
        className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
        style={{
          background: card.done
            ? 'color-mix(in srgb, var(--success) 14%, transparent)'
            : 'color-mix(in srgb, var(--accent) 10%, transparent)',
          color: card.done ? 'var(--success)' : 'var(--accent)',
        }}
      >
        {card.done ? <CheckCircle2 size={18} strokeWidth={1.8} /> : <card.icon size={18} strokeWidth={1.8} />}
      </span>

      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-semibold"
          style={{
            color: card.done ? 'var(--text-tertiary)' : 'var(--text-primary)',
            textDecoration: card.done ? 'line-through' : 'none',
          }}
        >
          {card.title}
        </p>
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-tertiary)' }}>
          {card.description}
        </p>
      </div>

      {!card.done && (
        card.action === 'link' && card.href ? (
          <Link
            href={card.href}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-[0.95] cursor-pointer shrink-0"
            style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
            aria-label={`Перейти: ${card.title}`}
          >
            <ArrowRight size={15} />
          </Link>
        ) : (
          <button
            onClick={() => card.copyValue && onCopy(card.copyValue, card.copyLabel ?? card.title)}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-[0.95] cursor-pointer shrink-0"
            style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
            aria-label={`Скопіювати: ${card.title}`}
          >
            <ArrowRight size={15} />
          </button>
        )
      )}
    </motion.div>
  );
}

export function AcademyPage({
  profileFilled,
  servicesAdded,
  profilePublished,
  telegramConnected,
  slug,
  referralCode,
}: AcademyPageProps) {
  const { showToast } = useToast();

  const profileUrl  = slug ? `https://bookit.com.ua/${slug}` : '';
  const referralUrl = referralCode ? `https://bookit.com.ua/invite/${referralCode}` : '';

  function handleCopy(value: string, label: string) {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      showToast({ type: 'success', title: 'Скопійовано', message: label });
    });
  }

  const setupCards: SetupCard[] = [
    {
      icon: User,
      title: 'Налаштуй профіль',
      description: 'Ім\'я, фото, категорія послуг — клієнти бачать це першим',
      done: profileFilled,
      action: 'link',
      href: '/dashboard/settings',
    },
    {
      icon: Scissors,
      title: 'Додай перші послуги',
      description: 'Без послуг клієнти не зможуть записатись',
      done: servicesAdded,
      action: 'link',
      href: '/dashboard/services',
    },
    {
      icon: Globe,
      title: 'Опублікуй профіль',
      description: 'Зроби свою сторінку доступною для записів',
      done: profilePublished,
      action: 'link',
      href: '/dashboard/settings',
    },
    {
      icon: Send,
      title: 'Підключи Telegram',
      description: 'Отримуй сповіщення про нові записи миттєво',
      done: telegramConnected,
      action: 'link',
      href: '/dashboard/settings#technical',
    },
    {
      icon: Users,
      title: 'Поділись посиланням',
      description: 'Запроси першого клієнта — скопіюй посилання на профіль',
      done: false,
      action: 'copy',
      copyValue: profileUrl,
      copyLabel: 'Посилання на профіль',
    },
  ];

  const doneCount = setupCards.filter(c => c.done).length;
  const pct = Math.round((doneCount / setupCards.length) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-8">
      {/* Header */}
      <motion.div custom={0} variants={rise} initial="hidden" animate="visible">
        <div className="flex items-center gap-3 mb-1">
          <span style={{ color: 'var(--accent)' }}>
            <GraduationCap size={24} strokeWidth={1.6} />
          </span>
          <h1 className="heading-serif text-[24px]" style={{ color: 'var(--text-primary)' }}>
            BookIT Академія
          </h1>
        </div>
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          Все що потрібно знати про кожну функцію — тут.
        </p>
      </motion.div>

      {/* Getting Started section */}
      <motion.section custom={1} variants={rise} initial="hidden" animate="visible">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: 'var(--text-tertiary)' }}>
            Початок роботи
          </p>
          <span className="text-[11px] font-semibold" style={{ color: doneCount === setupCards.length ? 'var(--success)' : 'var(--text-secondary)' }}>
            {doneCount} / {setupCards.length} виконано
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="h-1 rounded-full mb-4 overflow-hidden"
          style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--accent)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring' as const, stiffness: 120, damping: 20, delay: 0.4 }}
          />
        </div>

        <div className="space-y-2">
          {setupCards.map((card, i) => (
            <SetupCardItem
              key={card.title}
              card={card}
              index={i + 2}
              onCopy={handleCopy}
            />
          ))}
        </div>
      </motion.section>

      {/* Coming soon */}
      <motion.div
        custom={8}
        variants={rise}
        initial="hidden"
        animate="visible"
        className="text-center py-4"
      >
        <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          Більше розділів з&apos;являться з наступними оновленнями
        </p>
      </motion.div>
    </div>
  );
}
