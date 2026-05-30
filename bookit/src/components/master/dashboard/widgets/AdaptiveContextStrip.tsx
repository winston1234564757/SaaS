'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Zap, Megaphone, Share2, CalendarDays, TrendingUp, Link2,
} from 'lucide-react';
import { useBusyness } from '@/lib/supabase/hooks/useBusyness';
import { useMasterContext } from '@/lib/supabase/context';
import { useToast } from '@/lib/toast/context';

type StripState = 'empty' | 'quiet' | 'moderate' | 'busy';

interface StripCard {
  Icon: React.ElementType;
  title: string;
  subtitle: string;
  cta: string;
  onCta: () => void;
}

function getState(rate: number | undefined, isWorkingDay: boolean): StripState {
  if (!isWorkingDay || rate === undefined || rate === 0) return 'empty';
  if (rate < 40) return 'quiet';
  if (rate < 80) return 'moderate';
  return 'busy';
}

const cardVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 340, damping: 28, delay: i * 0.07 },
  }),
};

interface CardProps {
  card: StripCard;
  index: number;
  accent?: boolean;
}

function StripCard({ card, index, accent = false }: CardProps) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bento-card p-4 flex flex-col gap-3 group"
      style={accent ? { background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))' } : undefined}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
          style={{
            background: accent
              ? 'color-mix(in srgb, var(--accent) 16%, transparent)'
              : 'color-mix(in srgb, var(--accent-on, var(--accent)) 8%, transparent)',
            color: 'var(--accent)',
          }}
        >
          <card.Icon size={17} strokeWidth={1.8} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {card.title}
          </p>
          <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
            {card.subtitle}
          </p>
        </div>
      </div>
      <button
        onClick={card.onCta}
        className="self-start text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-[0.95] cursor-pointer"
        style={{
          background: accent
            ? 'var(--accent)'
            : 'color-mix(in srgb, var(--accent) 12%, transparent)',
          color: accent ? 'var(--accent-on)' : 'var(--accent)',
        }}
      >
        {card.cta}
      </button>
    </motion.div>
  );
}

export function AdaptiveContextStrip() {
  const router = useRouter();
  const { masterProfile } = useMasterContext();
  const { showToast } = useToast();
  const { data: busyness } = useBusyness();

  const today = busyness?.today ?? null;
  const rate = today?.rate;
  const booked = today?.booked ?? 0;
  const total = today?.total ?? 0;
  const free = Math.max(0, total - booked);
  const isWorkingDay = today !== null;

  const state: StripState = getState(rate, isWorkingDay);

  const slug = masterProfile?.slug ?? '';
  const profileUrl = slug ? `https://bookit.com.ua/${slug}` : '';

  function copyLink() {
    if (!profileUrl) return;
    navigator.clipboard.writeText(profileUrl).then(() => {
      showToast({ type: 'success', title: 'Скопійовано', message: 'Посилання на профіль у буфері' });
    });
  }

  const CARDS: Record<StripState, [StripCard, StripCard]> = {
    empty: [
      {
        Icon: Share2,
        title: 'Ще немає записів',
        subtitle: 'Поділись посиланням — перший клієнт вже поруч',
        cta: 'Скопіювати',
        onCta: copyLink,
      },
      {
        Icon: Megaphone,
        title: 'Нагадай клієнтам',
        subtitle: 'Розішли повідомлення тим, хто давно не приходив',
        cta: 'Розіслати',
        onCta: () => router.push('/dashboard/marketing'),
      },
    ],
    quiet: [
      {
        Icon: Megaphone,
        title: 'Тихий день',
        subtitle: 'Нагадай клієнтам — вони можуть просто забути',
        cta: 'Розіслати',
        onCta: () => router.push('/dashboard/marketing'),
      },
      {
        Icon: Zap,
        title: 'Запусти флеш-акцію',
        subtitle: `${free} вільних годин — ідеально для знижки`,
        cta: 'Створити',
        onCta: () => router.push('/dashboard/flash'),
      },
    ],
    moderate: [
      {
        Icon: Link2,
        title: `${booked} з ${total} годин зайнято`,
        subtitle: `Ще ${free} вільних — поділись, щоб заповнити`,
        cta: 'Скопіювати',
        onCta: copyLink,
      },
      {
        Icon: CalendarDays,
        title: 'Найближчі вільні дні',
        subtitle: 'Клієнти хочуть знати, коли ти вільна',
        cta: 'Переглянути',
        onCta: () => router.push('/dashboard/bookings'),
      },
    ],
    busy: [
      {
        Icon: TrendingUp,
        title: 'Насичений день!',
        subtitle: `${booked} з ${total} годин заплановано — відмінно`,
        cta: 'Подивитись',
        onCta: () => router.push('/dashboard/bookings'),
      },
      {
        Icon: Zap,
        title: 'Є вільне місце?',
        subtitle: 'Флеш-акція заповнить останній слот за хвилини',
        cta: 'Запустити',
        onCta: () => router.push('/dashboard/flash'),
      },
    ],
  };

  const [card1, card2] = CARDS[state];

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={state}
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <StripCard card={card1} index={0} accent={state === 'busy'} />
        <StripCard card={card2} index={1} />
      </motion.div>
    </AnimatePresence>
  );
}
