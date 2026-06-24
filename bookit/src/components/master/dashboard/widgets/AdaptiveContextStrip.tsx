'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Zap, Megaphone, Share2, Sparkles, TrendingUp, Link2, Clock,
} from 'lucide-react';
import { FitText } from '@/components/shared/FitText';
import { useBusyness } from '@/lib/supabase/hooks/useBusyness';
import { useDashboardStats } from '@/lib/supabase/hooks/useDashboardStats';
import { useMasterContext } from '@/lib/supabase/context';
import { useToast } from '@/lib/toast/context';
import { pluralUk } from '@/lib/utils/pluralUk';

type StripState = 'empty' | 'quiet' | 'moderate' | 'busy';

interface StripCard {
  id: string;
  Icon: React.ElementType;
  title: string;
  subtitle: string;
  cta: string;
  onCta: () => void;
  urgent?: boolean;
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

/* ─── Main card — dominant recommendation ─────────────────────── */
function MainCard({ card }: { card: StripCard }) {
  const tint = card.urgent ? 16 : 10;
  return (
    <motion.div
      custom={0}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bento-card p-5 flex flex-col gap-4 lg:flex-[1.4]"
      style={{ background: `color-mix(in srgb, var(--accent) ${tint}%, var(--surface))` }}
    >
      <div className="flex items-start gap-3.5">
        <span
          className="flex items-center justify-center size-11 rounded-2xl shrink-0"
          style={{
            background: card.urgent
              ? 'var(--accent)'
              : 'color-mix(in srgb, var(--accent) 18%, transparent)',
            color: card.urgent ? 'var(--accent-on)' : 'var(--accent)',
          }}
        >
          <card.Icon size={20} strokeWidth={1.8} />
        </span>
        <div className="flex-1 min-w-0 pt-0.5">
          <FitText
            text={card.title}
            minSize={15}
            maxSize={20}
            maxLines={2}
            className="font-semibold leading-tight"
            style={{ color: 'var(--text-primary)' }}
          />
          <p className="text-[12px] mt-1 leading-snug" style={{ color: 'var(--text-secondary)' }}>
            {card.subtitle}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={card.onCta}
        className="w-full text-[13px] font-semibold py-3 rounded-2xl transition-transform duration-150 active:scale-[0.97]"
        style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
      >
        {card.cta}
      </button>
    </motion.div>
  );
}

/* ─── Secondary card — compact ────────────────────────────────── */
function SecondaryCard({ card, index, hideOnDesktop }: { card: StripCard; index: number; hideOnDesktop?: boolean }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`bento-card p-4 flex flex-col gap-3 ${hideOnDesktop ? 'lg:hidden' : ''}`}
    >
      <div className="flex items-start gap-3.5">
        <span
          className="flex items-center justify-center size-10 rounded-xl shrink-0"
          style={{
            background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
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
        type="button"
        onClick={card.onCta}
        className="self-start text-[11px] font-semibold px-3 py-2 rounded-full transition-transform duration-150 active:scale-[0.95]"
        style={{
          background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
          color: 'var(--accent)',
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
  const { todayPending } = useDashboardStats();

  const today        = busyness?.today ?? null;
  const rate         = today?.rate;
  const booked       = today?.booked ?? 0;
  const total        = today?.total ?? 0;
  const free         = Math.max(0, total - booked);
  const pending      = todayPending ?? 0;
  const isWorkingDay = today !== null;

  const state: StripState = getState(rate, isWorkingDay);

  const slug       = masterProfile?.slug ?? '';
  const profileUrl = slug ? `https://bookit.com.ua/${slug}` : '';

  function copyLink() {
    if (!profileUrl) return;
    navigator.clipboard.writeText(profileUrl).then(() => {
      showToast({ type: 'success', title: 'Скопійовано', message: 'Посилання на профіль у буфері' });
    });
  }

  const freeHours = `${free} ${pluralUk(free, 'вільна година', 'вільні години', 'вільних годин')}`;

  // Time-sensitive recommendation: pending confirmations always lead.
  const pendingCard: StripCard = {
    id: 'pending',
    Icon: Clock,
    title: `${pending} ${pluralUk(pending, 'запис очікує', 'записи очікують', 'записів очікують')}`,
    subtitle: 'Підтвердь, щоб клієнти не хвилювались',
    cta: 'Підтвердити',
    onCta: () => router.push('/dashboard/bookings'),
    urgent: true,
  };

  const STATE_CARDS: Record<StripState, [StripCard, StripCard]> = {
    empty: [
      {
        id: 'share',
        Icon: Share2,
        title: 'Ще немає записів',
        subtitle: 'Поділись посиланням — перший клієнт вже поруч',
        cta: 'Скопіювати',
        onCta: copyLink,
      },
      {
        id: 'remind',
        Icon: Megaphone,
        title: 'Нагадай клієнтам',
        subtitle: 'Розішли повідомлення тим, хто давно не приходив',
        cta: 'Розіслати',
        onCta: () => router.push('/dashboard/marketing'),
      },
    ],
    quiet: [
      {
        id: 'remind',
        Icon: Megaphone,
        title: 'Тихий день',
        subtitle: 'Нагадай клієнтам — вони можуть просто забути',
        cta: 'Розіслати',
        onCta: () => router.push('/dashboard/marketing'),
      },
      {
        id: 'flash',
        Icon: Zap,
        title: 'Запусти флеш-акцію',
        subtitle: `${freeHours} — ідеально для знижки`,
        cta: 'Створити',
        onCta: () => router.push('/dashboard/revenue?drawer=flash_deals'),
      },
    ],
    moderate: [
      {
        id: 'fill',
        Icon: Link2,
        title: `${booked} з ${total} годин зайнято`,
        subtitle: `Ще ${freeHours} — поділись, щоб заповнити`,
        cta: 'Скопіювати',
        onCta: copyLink,
      },
      {
        id: 'stories',
        Icon: Sparkles,
        title: 'Вільні дні цього тижня',
        subtitle: 'Зроби сторіс — клієнти побачать і запишуться',
        cta: 'Сторіс',
        onCta: () => router.push('/dashboard/marketing?mode=free_slots'),
      },
    ],
    busy: [
      {
        id: 'view',
        Icon: TrendingUp,
        title: 'Насичений день!',
        subtitle: `${booked} з ${total} годин заплановано — відмінно`,
        cta: 'Подивитись',
        onCta: () => router.push('/dashboard/bookings'),
        urgent: true,
      },
      {
        id: 'flash',
        Icon: Zap,
        title: 'Є вільне місце?',
        subtitle: 'Флеш-акція заповнить останній слот за хвилини',
        cta: 'Запустити',
        onCta: () => router.push('/dashboard/revenue?drawer=flash_deals'),
      },
    ],
  };

  // Relevance: pending leads when present, then the busyness-state set.
  const cards: StripCard[] = pending > 0
    ? [pendingCard, ...STATE_CARDS[state]]
    : [...STATE_CARDS[state]];

  const main = cards[0];
  const secondary = cards.slice(1, 3);

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={main.id}
        className="flex flex-col lg:flex-row gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <MainCard card={main} />
        {secondary.length > 0 && (
          <div className="flex flex-col gap-3 lg:flex-1">
            {secondary.map((card, i) => (
              <SecondaryCard
                key={card.id}
                card={card}
                index={i + 1}
                hideOnDesktop={i > 0}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
