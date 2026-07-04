'use client';

import React from 'react';
import Link from 'next/link';
import { Share2, CalendarPlus, TrendingUp, Trophy, HeartHandshake, ArrowRight } from 'lucide-react';

interface AnalyticsActivationProps {
  slug: string;
}

const PREVIEW = [
  { icon: TrendingUp, title: 'Виручка і тренди', text: 'Динаміка доходу за період з прогнозом на наступний місяць.' },
  { icon: Trophy, title: 'Топ послуг і клієнтів', text: 'Хто і що приносить найбільше, щоб знати, на чому рости.' },
  { icon: HeartHandshake, title: 'Поведінка й утримання', text: 'Повернення клієнтів, неявки, завантаженість по днях.' },
];

/**
 * Перший екран аналітики до перших записів (M-ANL-01).
 * Замість «нічого немає» — обіцянка цінності + кроки активації.
 * Нуль фейкових чисел чи графіків.
 */
export function AnalyticsActivation({ slug }: AnalyticsActivationProps) {
  return (
    <section className="flex flex-col gap-4">
      {/* Cover — на тон із editorial-обкладинкою готового стану */}
      <div
        className="relative overflow-hidden rounded-[var(--card-radius)] text-[var(--accent-on)] p-6 md:p-8"
        style={{ background: 'var(--hero-card-bg)', boxShadow: 'var(--hero-card-shadow)' }}
      >
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-12 size-64 rounded-full blur-3xl" style={{ background: 'rgba(99,102,241,0.28)' }} />
        <div className="relative z-10 max-w-[40ch]">
          <p className="text-[13px] font-medium text-white/55 mb-2">Аналітика</p>
          <h2 className="heading-serif text-[clamp(1.75rem,5vw,2.5rem)] leading-tight text-white text-balance">
            Твій бізнес у цифрах з'явиться після перших записів
          </h2>
          <p className="text-sm text-white/65 leading-relaxed mt-3">
            Щойно клієнти почнуть записуватись, тут оживе повна картина: скільки заробляєш, що замовляють і хто повертається.
          </p>
        </div>
      </div>

      {/* Прев'ю-цінність */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PREVIEW.map(({ icon: Icon, title, text }) => (
          <div key={title} className="bento-card p-5 flex flex-col gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/15">
              <Icon className="size-4" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-[13px] text-text-sub leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      {/* Кроки активації */}
      <div className="bento-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Зроби перший крок</p>
          <p className="text-[13px] text-text-sub mt-0.5">Поділись сторінкою або додай запис вручну.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => window.open(`/${slug}`, '_blank')}
            disabled={!slug}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--btn-primary-bg)] text-[var(--accent-on)] text-[13px] font-semibold cursor-pointer active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            <Share2 size={14} />
            Моя сторінка
          </button>
          <Link
            href="/dashboard/bookings"
            className="group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-secondary text-foreground text-[13px] font-semibold cursor-pointer active:scale-[0.97] transition-transform border border-border"
          >
            <CalendarPlus size={14} />
            Додати запис
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
