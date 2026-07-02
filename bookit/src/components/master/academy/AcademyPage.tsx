'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  CalendarDays, Users, BarChart2, Zap, Scissors, Settings,
  UserPlus, TrendingUp, Bell, Heart,
  GraduationCap, ChevronDown, ArrowRight, Play,
  BookOpen, CreditCard, Shield, MessageSquare,
} from 'lucide-react';
import { resetTourSeen } from '@/app/(master)/dashboard/actions';

// ── Emil Kowalski spring configs ─────────────────────────────────────────────
const SPRING_TAB     = { type: 'spring' as const, duration: 0.3,  bounce: 0    };
const SPRING_CONTENT = { type: 'spring' as const, duration: 0.22, bounce: 0    };
const SPRING_SECTION = { type: 'spring' as const, duration: 0.35, bounce: 0.05 };
const SPRING_DRAWER  = { type: 'spring' as const, duration: 0.28, bounce: 0    };
const SPRING_CHEVRON = { type: 'spring' as const, duration: 0.2,  bounce: 0    };

// ── Types ─────────────────────────────────────────────────────────────────────
interface Step { text: string }
interface Article {
  id: string;
  title: string;
  description: string;
  steps: Step[];
  cta: { label: string; href: string };
}
interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  articles: Article[];
}

// ── Content — Функції ─────────────────────────────────────────────────────────
const FUNCTION_SECTIONS: Section[] = [
  {
    id: 'bookings',
    title: 'Записи та розклад',
    icon: CalendarDays,
    articles: [
      {
        id: 'schedule-read',
        title: 'Як читати розклад',
        description: 'Три режими перегляду і кольорові маркери статусів',
        steps: [
          { text: 'Відкрий "Записи" і переключись між режимами: Сьогодні / Завтра / Тиждень' },
          { text: 'Натисни на запис — побачиш деталі: клієнта, послугу, час' },
          { text: 'Через меню (···) перенеси або скасуй запис без видалення' },
          { text: 'Сірий статус = очікує підтвердження, зелений = підтверджено' },
        ],
        cta: { label: 'Відкрити розклад', href: '/dashboard/bookings' },
      },
      {
        id: 'schedule-add',
        title: 'Додати запис вручну',
        description: 'Знайди клієнта, обери послугу і час — запис з\'явиться в розкладі',
        steps: [
          { text: 'Натисни "+" або торкнись вільного слота в календарі' },
          { text: 'Знайди клієнта за ім\'ям або номером телефону' },
          { text: 'Обери послугу і доступний час' },
          { text: 'Підтвердь — клієнт отримає сповіщення автоматично' },
        ],
        cta: { label: 'Відкрити розклад', href: '/dashboard/bookings' },
      },
    ],
  },
  {
    id: 'clients',
    title: 'Клієнти',
    icon: Users,
    articles: [
      {
        id: 'clients-base',
        title: 'База клієнтів',
        description: 'Усі хто до тебе записувався — в одному місці',
        steps: [
          { text: 'Відкрий "Клієнти" — список усіх людей що до тебе приходили' },
          { text: 'Сортуй за кількістю візитів, алфавітом або датою останнього запису' },
          { text: 'Натисни на картку — побачиш повну історію записів клієнта' },
          { text: 'Номер телефону — натисни для швидкого дзвінка' },
        ],
        cta: { label: 'Перейти до клієнтів', href: '/dashboard/clients' },
      },
      {
        id: 'clients-filters',
        title: 'Сегменти та фільтри',
        description: 'Сортуй список для точних завдань',
        steps: [
          { text: 'Сортуй "За візитами" — знайди найлояльніших клієнтів' },
          { text: 'Сортуй "За чеком" — хто приносить найбільше виручки' },
          { text: 'Сортуй "Нещодавні" — хто записувався останнім' },
          { text: 'Перемикай вигляд: список або картки — як зручніше' },
        ],
        cta: { label: 'Перейти до клієнтів', href: '/dashboard/clients' },
      },
      {
        id: 'clients-notes',
        title: 'Нотатки по клієнту',
        description: 'Додай нотатку — вона видна при кожному записі цього клієнта',
        steps: [
          { text: 'Відкрий картку клієнта → натисни "Нотатка"' },
          { text: 'Пиши що завгодно: алергії, вподобання, дата народження' },
          { text: 'Нотатка відображається в деталях запису — нічого не забудеш' },
        ],
        cta: { label: 'Перейти до клієнтів', href: '/dashboard/clients' },
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Аналітика та звіти',
    icon: BarChart2,
    articles: [
      {
        id: 'analytics-dashboard',
        title: 'Дашборд — що де шукати',
        description: 'Виручка, записи і завантаженість з першого погляду',
        steps: [
          { text: 'EarningsPulse вгорі — виручка сьогодні і порівняно зі вчора' },
          { text: 'AdaptiveStrip підказує що важливо прямо зараз (вільний час, нові записи)' },
          { text: 'WeeklyChart — динаміка записів за 7 днів' },
          { text: 'InsightsRow — топ клієнт тижня та середній чек' },
        ],
        cta: { label: 'Відкрити дашборд', href: '/dashboard' },
      },
      {
        id: 'analytics-revenue',
        title: 'Фінансовий звіт',
        description: 'Деталізована звітність по виручці з фільтрами',
        steps: [
          { text: 'Відкрий "Фінанси" — тут повна картина по виручці' },
          { text: 'Переключай діапазон: тиждень / місяць / рік' },
          { text: 'Порівнюй з попереднім аналогічним періодом' },
          { text: 'Flash Sale і динамічні ціни доступні звідси ж' },
        ],
        cta: { label: 'Відкрити Фінанси', href: '/dashboard/revenue' },
      },
      {
        id: 'analytics-top',
        title: 'Топ послуги та retention',
        description: 'Які послуги найпопулярніші і скільки клієнтів повертається',
        steps: [
          { text: 'Відкрий "Аналітика" — розбивка по послугах за місяць' },
          { text: 'Retention rate — відсоток клієнтів що повернулись вдруге' },
          { text: 'Якщо retention < 40% — час запустити кампанію повернення' },
          { text: 'Топ послуги — орієнтир для Flash Sale' },
        ],
        cta: { label: 'Відкрити аналітику', href: '/dashboard/analytics' },
      },
    ],
  },
  {
    id: 'marketing',
    title: 'Флеш-акції та маркетинг',
    icon: Zap,
    articles: [
      {
        id: 'flash-sale',
        title: 'Запустити Flash Sale',
        description: 'Знижка на конкретну послугу — клієнти отримають push миттєво',
        steps: [
          { text: 'Відкрий "Фінанси" → натисни "Flash Sale"' },
          { text: 'Обери послугу і встанови знижку (10–50%)' },
          { text: 'Вибери час дії: 2, 4 або 8 годин' },
          { text: 'Активуй — усі клієнти отримають push-сповіщення одразу' },
        ],
        cta: { label: 'Запустити акцію', href: '/dashboard/revenue?drawer=flash_deals' },
      },
      {
        id: 'broadcast',
        title: 'Масова розсилка',
        description: 'Вибери сегмент і надішли повідомлення групі клієнтів',
        steps: [
          { text: 'Відкрий "Маркетинг" → натисни "Новий broadcast"' },
          { text: 'Вибери сегмент: усі клієнти, нові, постійні або ті що давно не приходили' },
          { text: 'Напиши текст або використай готовий шаблон' },
          { text: 'Надішли і відстежуй відкриття та переходи' },
        ],
        cta: { label: 'Відкрити маркетинг', href: '/dashboard/marketing' },
      },
      {
        id: 'stories',
        title: 'Генерація сторіс',
        description: 'Авто-картинки для Instagram/TikTok з вільними слотами',
        steps: [
          { text: 'Відкрий "Маркетинг" → вкладка "Сторіс"' },
          { text: 'Система показує вільні слоти наступних 3 днів' },
          { text: 'Натисни "Генерувати" — BookIT підготує картинку' },
          { text: 'Завантаж і поділись — клієнти бачать вільний час напряму' },
        ],
        cta: { label: 'Відкрити маркетинг', href: '/dashboard/marketing' },
      },
    ],
  },
  {
    id: 'services',
    title: 'Послуги та ціни',
    icon: Scissors,
    articles: [
      {
        id: 'services-add',
        title: 'Додати послугу',
        description: 'Назва, ціна, тривалість — і послуга з\'явиться в записі',
        steps: [
          { text: 'Відкрий "Послуги" → натисни "+"' },
          { text: 'Вкажи назву, ціну і тривалість (наприклад, 60 хв)' },
          { text: 'Активуй послугу — вона одразу доступна для запису' },
          { text: 'Деактивуй без видалення — зникне зі сторінки але збережеться в статистиці' },
        ],
        cta: { label: 'Додати послугу', href: '/dashboard/services/new' },
      },
      {
        id: 'dynamic-pricing',
        title: 'Динамічні ціни',
        description: 'Ціна підвищується в пік і знижується в тихий час автоматично',
        steps: [
          { text: 'Відкрий "Фінанси" → натисни "Динамічне ціноутворення"' },
          { text: 'Встанови правила: +20% в пікові години, -15% вранці' },
          { text: 'Клієнти бачать реальну ціну при записі — без сюрпризів' },
          { text: 'Безпечний діапазон: мінімум -30%, максимум +50%' },
        ],
        cta: { label: 'Відкрити Фінанси', href: '/dashboard/revenue?drawer=dynamic_pricing' },
      },
    ],
  },
  {
    id: 'settings',
    title: 'Профіль та налаштування',
    icon: Settings,
    articles: [
      {
        id: 'profile-fill',
        title: 'Заповнити профіль',
        description: 'Ім\'я, фото, категорія — клієнти бачать це першим',
        steps: [
          { text: 'Відкрий "Налаштування" → заповни Ім\'я та Опис' },
          { text: 'Завантаж фото — профілі з фото отримують вдвічі більше записів' },
          { text: 'Вибери категорію послуг (Нігті / Брови / Волосся...)' },
          { text: 'Опублікуй — твоя сторінка стане видимою для пошуку' },
        ],
        cta: { label: 'Налаштувати', href: '/dashboard/settings' },
      },
      {
        id: 'telegram-connect',
        title: 'Підключити Telegram',
        description: 'Отримуй сповіщення про нові записи миттєво',
        steps: [
          { text: 'Відкрий "Налаштування" → розділ "Інтеграції"' },
          { text: 'Натисни "Підключити Telegram" — відкриється наш бот' },
          { text: 'Натисни /start в боті — підключення займе 10 секунд' },
          { text: 'Після підключення: нові записи, скасування та нагадування — в Telegram' },
        ],
        cta: { label: 'Налаштувати Telegram', href: '/dashboard/settings#technical' },
      },
      {
        id: 'portfolio',
        title: 'Портфоліо',
        description: 'Фотографії робіт — перше що бачить клієнт перед записом',
        steps: [
          { text: 'Відкрий "Портфоліо" → натисни "+" для нового альбому' },
          { text: 'Завантаж фото робіт у відповідний альбом' },
          { text: 'Опублікуй альбом — він з\'явиться на твоїй публічній сторінці' },
          { text: 'Клієнти переглядають портфоліо перед тим як записатись' },
        ],
        cta: { label: 'Відкрити портфоліо', href: '/dashboard/portfolio' },
      },
    ],
  },
];

// ── Content — Цілі ────────────────────────────────────────────────────────────
const GOAL_SECTIONS: Section[] = [
  {
    id: 'first-clients',
    title: 'Залучити перших клієнтів',
    icon: UserPlus,
    articles: [
      {
        id: 'publish-profile',
        title: 'Опублікувати профіль',
        description: 'Зроби сторінку видимою і поділись посиланням',
        steps: [
          { text: 'Заповни профіль: ім\'я, фото, категорія послуг' },
          { text: 'Відкрий "Налаштування" → увімкни "Профіль опубліковано"' },
          { text: 'Скопіюй посилання bookit.com.ua/[slug] і постав в Instagram Bio' },
          { text: 'Клієнти одразу можуть записуватись без дзвінків' },
        ],
        cta: { label: 'Налаштувати', href: '/dashboard/settings' },
      },
      {
        id: 'referral',
        title: 'Реферальна програма',
        description: 'Запроси колег — отримай бонус за кожного нового майстра',
        steps: [
          { text: 'Відкрий "Growth" → вкладка "Реферали"' },
          { text: 'Скопіюй своє реферальне посилання' },
          { text: 'Поділись з колегами — за кожного хто зареєструється бонус тобі' },
          { text: 'Статус рефералів і бонуси — в тому ж розділі' },
        ],
        cta: { label: 'Growth Hub', href: '/dashboard/growth?drawer=referral' },
      },
    ],
  },
  {
    id: 'revenue-goal',
    title: 'Підвищити виручку',
    icon: TrendingUp,
    articles: [
      {
        id: 'top-services-insight',
        title: 'Що приносить найбільше',
        description: 'Дивись що продається і коригуй ціни',
        steps: [
          { text: 'Відкрий "Аналітика" — топ послуги за місяць' },
          { text: 'Якщо одна послуга займає 70%+ — підняти ціну безпечно' },
          { text: 'Якщо послуга не продається — деактивуй або змін назву' },
          { text: 'Retention < 40% — час на broadcast кампанію повернення' },
        ],
        cta: { label: 'Відкрити аналітику', href: '/dashboard/analytics' },
      },
      {
        id: 'flash-free-hours',
        title: 'Flash Sale на вільні години',
        description: 'Активуй акцію в години без записів',
        steps: [
          { text: 'Переглянь розклад — знайди вільні вікна' },
          { text: 'Відкрий "Фінанси" → Flash Sale → знижка 20–30%' },
          { text: 'Клієнти отримають push — частина заповнить вільний час' },
          { text: 'Через 2 години акція закінчується автоматично' },
        ],
        cta: { label: 'Запустити акцію', href: '/dashboard/revenue?drawer=flash_deals' },
      },
      {
        id: 'dynamic-pricing-goal',
        title: 'Динамічні ціни',
        description: 'Більше заробляй в пікові години автоматично',
        steps: [
          { text: 'Відкрий "Фінанси" → Динамічне ціноутворення' },
          { text: 'Встанови: +20% в пятницю-суботу, ранкові години -10%' },
          { text: 'Система сама підіймає і опускає ціну по правилах' },
          { text: 'Клієнти бачать фінальну ціну ще до підтвердження' },
        ],
        cta: { label: 'Відкрити Фінанси', href: '/dashboard/revenue?drawer=dynamic_pricing' },
      },
    ],
  },
  {
    id: 'automation',
    title: 'Нагадування та розсилки',
    icon: Bell,
    articles: [
      {
        id: 'telegram-reminders',
        title: 'Сповіщення через Telegram',
        description: 'Клієнти отримують нагадування за 24 год автоматично',
        steps: [
          { text: 'Підключи Telegram в налаштуваннях — потрібно зробити один раз' },
          { text: 'За 24 год до запису клієнт отримує нагадування автоматично' },
          { text: 'Після запису — запит на відгук' },
          { text: 'Ти отримуєш сповіщення про нові записи та скасування миттєво' },
        ],
        cta: { label: 'Налаштувати Telegram', href: '/dashboard/settings#technical' },
      },
      {
        id: 'broadcasts-goal',
        title: 'Розсилки клієнтам',
        description: 'Вибери сегмент і надішли повідомлення групі',
        steps: [
          { text: 'Відкрий "Маркетинг" → "Новий broadcast"' },
          { text: 'Сегмент "Давно не були" — клієнти без запису 30+ днів' },
          { text: 'Напиши: "Привіт! Є вікна цього тижня — записатись?" + посилання' },
          { text: 'Відправляй і відстежуй результат в тому ж розділі' },
        ],
        cta: { label: 'Відкрити маркетинг', href: '/dashboard/marketing' },
      },
    ],
  },
  {
    id: 'retention',
    title: 'Утримати постійних клієнтів',
    icon: Heart,
    articles: [
      {
        id: 'at-risk-clients',
        title: 'Клієнти під загрозою',
        description: 'Переглянь хто не приходив давно і поверни їх',
        steps: [
          { text: 'Відкрий "Клієнти" — шукай тих без запису 60+ днів' },
          { text: 'Сортуй "За датою останнього візиту" — вони внизу списку' },
          { text: 'Запусти broadcast на цей сегмент або напиши особисто' },
          { text: 'Retention-дашборд у "Аналітика" — відстежуй результат' },
        ],
        cta: { label: 'Перейти до клієнтів', href: '/dashboard/clients' },
      },
      {
        id: 'loyalty',
        title: 'Програма лояльності',
        description: 'Нарахуй бали за візит — клієнти повертаються за знижкою',
        steps: [
          { text: 'Відкрий "Growth" → вкладка "Лояльність"' },
          { text: 'Налаштуй: 1 візит = N балів, N балів = знижка X%' },
          { text: 'Клієнти бачать свій баланс у своєму профілі BookIT' },
          { text: 'Використання балів підтверджується при записі автоматично' },
        ],
        cta: { label: 'Growth Hub', href: '/dashboard/growth?drawer=loyalty' },
      },
      {
        id: 'reviews',
        title: 'Збирати відгуки',
        description: 'Нагадуй клієнтам залишити відгук після запису',
        steps: [
          { text: 'Відкрий "Відгуки" — тут усі отримані відгуки' },
          { text: 'Після завершеного запису клієнт отримує запит на відгук автоматично' },
          { text: 'Відгуки відображаються на твоїй публічній сторінці' },
          { text: 'Більше відгуків = вище в пошуку = більше нових записів' },
        ],
        cta: { label: 'Переглянути відгуки', href: '/dashboard/reviews' },
      },
    ],
  },
];

// ── ArticleItem ───────────────────────────────────────────────────────────────
function ArticleItem({ article }: { article: Article }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button type="button"
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
            {article.title}
          </p>
          <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-tertiary)' }}>
            {article.description}
          </p>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={SPRING_CHEVRON}
          className="shrink-0 mt-0.5"
          style={{ color: 'var(--text-tertiary)', display: 'flex' }}
        >
          <ChevronDown size={15} strokeWidth={1.6} />
        </motion.span>
      </button>

      {/* Accordion body — Emil pattern: overflow:hidden wrapper, AnimatePresence child */}
      <div style={{ overflow: 'hidden' }}>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="body"
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={SPRING_DRAWER}
              style={{ overflow: 'hidden' }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12, delay: isOpen ? 0.05 : 0 }}
                className="px-4 pb-4 pt-0.5"
              >
                <ol className="space-y-2.5 mb-3.5">
                  {article.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className="text-[10px] font-bold tabular-nums shrink-0 mt-px"
                        style={{ color: 'var(--accent)', opacity: 0.65, fontVariantNumeric: 'tabular-nums' }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {step.text}
                      </span>
                    </li>
                  ))}
                </ol>

                <Link
                  href={article.cta.href}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[12px] font-semibold active:scale-[0.97] active:transition-none transition-opacity"
                  style={{
                    background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
                    color: 'var(--accent)',
                  }}
                >
                  {article.cta.label}
                  <span style={{ display: 'flex' }}>
                    <ArrowRight size={13} strokeWidth={1.8} />
                  </span>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── SectionGroup ──────────────────────────────────────────────────────────────
function SectionGroup({ section, index }: { section: Section; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_SECTION, delay: index * 0.04 }}
    >
      {/* Section label */}
      <div className="flex items-center gap-2 px-1 mb-2">
        <span style={{ color: 'var(--accent)', display: 'flex' }}>
          <section.icon size={13} strokeWidth={1.7} />
        </span>
        <p
          className="text-[10px] font-bold tracking-[0.13em] uppercase"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {section.title}
        </p>
        <span
          className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
            color: 'var(--accent)',
          }}
        >
          {section.articles.length}
        </span>
      </div>

      {/* Articles — bento-card with dividers */}
      <div className="bento-card overflow-hidden">
        {section.articles.map((article, i) => (
          <div
            key={article.id}
            style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}
          >
            <ArticleItem article={article} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Content — Питання (FAQ) ────────────────────────────────────────────────────
interface FaqEntry { q: string; a: string }
interface FaqCategory { id: string; title: string; icon: React.ElementType; items: FaqEntry[] }

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'faq-bookings',
    title: 'Бронювання та розклад',
    icon: BookOpen,
    items: [
      { q: 'Як захиститись від подвійного бронювання одного слоту?', a: 'Система автоматично блокує слот на рівні бази даних одразу після першого підтвердження. Навіть якщо два клієнти одночасно відкрили вашу сторінку — лише один отримає слот. Другий побачить "Слот недоступний" при спробі бронювання.' },
      { q: 'Клієнт записався, але не прийшов. Що відбувається зі слотом і місячним лімітом?', a: 'Якщо ви вручну змінюєте статус на "Не прийшов" — запис залишається в системі і рахується в місячний ліміт (40 для Starter). Якщо клієнт скасував до сеансу — ліміт не збільшується. Порада: переводьте в "Не прийшов" для точної статистики відвідуваності.' },
      { q: 'Як буферний час між записами впливає на вільні слоти?', a: 'Буфер додається після кожного запису. Наприклад: стрижка 60 хв + буфер 15 хв = наступний слот починається через 75 хв. Буфер налаштовується в Налаштуваннях → Розклад. Якщо буфер 0 — клієнти можуть записатись впритул, враховуйте час на прибирання.' },
      { q: 'Клієнт хоче записатись на кілька послуг одразу. Як це працює?', a: 'На вашій публічній сторінці клієнт може вибрати кілька послуг — система автоматично розрахує загальну тривалість і перевірить наявність суцільного вільного вікна. Якщо послуги займають 3 години, слот у 2 години не буде запропонований.' },
      { q: 'Чому є вільний час, але на публічній сторінці слоти не відображаються?', a: 'Можливі причини: 1) День вимкнено в розкладі — перевірте Налаштування → Робочі години. 2) Слот менший за мінімальну тривалість найкоротшої послуги. 3) Активний режим "Відпустка" або виключення на цю дату. 4) Ви досягли місячного ліміту (Starter: 40 записів).' },
      { q: 'Записи "Очікує підтвердження" та "Підтверджено" — у чому різниця для доступності слотів?', a: 'Обидва статуси блокують слот — клієнти не зможуть записатись на той самий час. Різниця лише для вас: "Очікує" означає що клієнт ще не підтвердив. Якщо клієнт не підтвердив протягом 24 годин — рекомендуємо вручну скасувати запис, щоб звільнити слот.' },
      { q: 'Як налаштувати скорочений робочий день на конкретну дату?', a: 'Є два способи: 1) Разові виключення — в Налаштуваннях → Вихідні та відпустки → "Короткий день". Вказуєте дату та робочі години тільки на цей день. 2) Постійні зміни — через Налаштування → Робочі години. Виключення мають вищий пріоритет ніж шаблон розкладу.' },
      { q: 'Чи може клієнт сам скасувати запис?', a: 'Так — через сторінку /my/bookings після авторизації за номером телефону. Якщо ви хочете обмежити скасування (наприклад, менш ніж за 2 години) — наразі це вирішується вручну: перевіряйте запити і приймайте рішення особисто.' },
    ],
  },
  {
    id: 'faq-flash',
    title: 'Flash Deals та акції',
    icon: Zap,
    items: [
      { q: 'Що відбувається якщо Flash Deal закінчився, але ніхто не записався?', a: 'Слот автоматично повертається в загальний розклад як вільний. Ніяких додаткових дій не потрібно. Акція просто "згасає" і статистика показує її як "Завершена без бронювання". Ліміт на місяць при цьому вже витрачено.' },
      { q: 'Чи можна скасувати Flash Deal до закінчення TTL?', a: 'Так — у розділі Flash Deals є кнопка "Завершити акцію". Після скасування слот повертається у розклад. Однак ліміт (2/місяць для Starter) вже витрачено — скасована акція все одно зараховується в місячний рахунок.' },
      { q: 'Flash Deal і Dynamic Pricing одночасно на одному слоті — що переважає?', a: 'Flash Deal має пріоритет — він показується клієнту як пряма знижка (наприклад, "-20%"). Dynamic Pricing (тихий час, пікові години) застосовується поверх базової ціни, але Flash Deal перекриває обидва. Клієнт бачить саме Flash-знижку.' },
      { q: 'Коли оновлюється місячний ліміт Flash Deals для Starter?', a: 'Ліміт скидається в перший день кожного місяця о 00:00 UTC. Якщо ви запустили 2 акції 30-го числа — 1-го числа наступного місяця знову доступні 2 акції. Перейдіть на Pro або Studio щоб прибрати це обмеження.' },
      { q: 'Чому Flash Deal не залучає клієнтів?', a: 'Найчастіші причини: 1) Знижка надто мала — рекомендуємо мінімум 15–20%. 2) TTL надто короткий — клієнти не встигають побачити. 3) Час акції — раннє ранок або пізній вечір коли аудиторія неактивна. 4) Клієнти ще не знають про вашу сторінку — поділіться посиланням у соцмережах перед запуском акції.' },
    ],
  },
  {
    id: 'faq-pricing',
    title: 'Dynamic Pricing',
    icon: TrendingUp,
    items: [
      { q: 'Як правила Dynamic Pricing накладаються одне на одне?', a: 'Система підсумовує всі активні правила для слоту, але обмежує діапазон: максимальна знижка -30%, максимальна надбавка +50%. Наприклад: "Тихий час" (-15%) + "Рання бронь" (-10%) = -25%. Обидва спрацювали, але сума не перевищить -30%.' },
      { q: 'Що таке "Пробний режим Dynamic Pricing" і яке обмеження?', a: 'На тарифі Starter динамічне ціноутворення працює в тріальному режимі — поки загальна сума знижок не досягне 1000 ₴. Після цього правила перестають застосовуватись і система нагадує перейти на Pro. Надбавки (Peak hours) в тріалі не обмежені.' },
      { q: '"Тихий час" — як визначається і чи можна його кастомізувати?', a: '"Тихий час" (Quiet Hours) — це слоти з нижчим попитом: зазвичай будні ранок (до 11:00) та середина дня (13:00–15:00). Правило застосовується автоматично на основі ваших налаштувань. Кастомний діапазон годин буде доступний у наступних оновленнях.' },
      { q: 'Чи відображається клієнту причина знижки або надбавки?', a: 'Клієнт бачить лише фінальну ціну — ніяких пояснень "чому ціна інша". Для вас у Записах та Аналітиці відображається лейбл (наприклад "Тихий час -15%") та сума earned або lost per booking.' },
    ],
  },
  {
    id: 'faq-billing',
    title: 'Тарифи та оплата',
    icon: CreditCard,
    items: [
      { q: 'Що відбувається якщо Pro-підписка закінчилась? Дані зникають?', a: 'Ні — всі дані (клієнти, записи, аналітика) зберігаються. Але доступ до Pro-функцій блокується: CSV-експорт, детальна аналітика, необмежені записи, Dynamic Pricing. Ви автоматично переходите на Starter з лімітом 40 записів/місяць. Як тільки поновите підписку — все відновлюється.' },
      { q: 'Коли вигідніший Studio, а коли Pro?', a: 'Studio: 299₴/майстер/місяць, мінімум 2 майстри = 598₴. Pro: 700₴/місяць за одного. Якщо ви один майстер — Pro вигідніше. Якщо вас двоє або більше + потрібне управління командою — Studio дешевший (598₴ < 1400₴). З кожним новим майстром економія зростає.' },
      { q: 'Що таке реферальна програма і коли нараховуються бонуси?', a: 'Ви отримуєте реферальне посилання в профілі. Коли новий майстер реєструється за ним — ви отримуєте бонус (знижку на підписку). Бонус нараховується після верифікації нового майстра, не одразу при реєстрації. Для клієнтів — окремий промокод для першого бронювання.' },
      { q: 'Чи є комісія з кожного бронювання?', a: 'Ні — Bookit не бере комісію з транзакцій між вами і клієнтами. Оплата між вами і клієнтом відбувається напряму (готівка, переказ тощо). Ми беремо лише фіксовану місячну підписку за тариф.' },
    ],
  },
  {
    id: 'faq-telegram',
    title: 'Telegram та сповіщення',
    icon: Bell,
    items: [
      { q: 'Підключив Telegram-бот, але сповіщення не приходять. Що перевірити?', a: 'Кроки діагностики: 1) Переконайтесь що ви надіслали команду /start нашому боту (не просто відкрили чат). 2) Chat ID повинен автоматично заповнитись — якщо поле порожнє, надішліть /start ще раз. 3) Перевірте що бот не заблокований у вашому Telegram. 4) Telegram-сповіщення доступні тільки на тарифі Pro та Studio.' },
      { q: 'Як перепідключити Telegram якщо змінив акаунт або номер телефону?', a: 'Перейдіть в Налаштування → Telegram → "Відключити". Потім в новому акаунті Telegram знайдіть нашого бота і надішліть /start. Система автоматично оновить Chat ID. Старі сповіщення більше не надходитимуть на старий акаунт.' },
      { q: 'Які події викликають Telegram-сповіщення?', a: 'Сповіщення надходять при: 1) Новий запис від клієнта. 2) Клієнт скасував запис. 3) Новий відгук залишено. Сповіщення не надходять при: вручну створених записах вами, змінах статусу, Flash Deals.' },
    ],
  },
  {
    id: 'faq-security',
    title: 'Безпека та дані',
    icon: Shield,
    items: [
      { q: 'Як видалити акаунт і всі мої дані?', a: 'Напишіть нам в Telegram-підтримку з запитом на видалення з вашого зареєстрованого номера телефону. Ми видалимо: профіль майстра, послуги, записи, дані клієнтів пов\'язаних з вами. Відповідно до GDPR — протягом 30 днів.' },
      { q: 'Скільки часу зберігаються дані клієнтів після скасування підписки?', a: 'Всі дані зберігаються протягом 12 місяців після деактивації акаунту. Після цього вони автоматично видаляються. Якщо ви поновите підписку протягом 12 місяців — клієнтська база, записи та відгуки будуть доступні.' },
    ],
  },
  {
    id: 'faq-profile',
    title: 'Налаштування профілю',
    icon: Settings,
    items: [
      { q: 'Як підключити Telegram-сповіщення?', a: 'В Налаштуваннях → Telegram: скопіюйте команду /start і надішліть нашому боту. Chat ID заповниться автоматично.' },
      { q: 'Налаштування зберігаються але не відображаються на публічній сторінці. Чому?', a: 'Публічна сторінка кешується для швидкості завантаження. Зміни можуть з\'явитись із затримкою до 60 секунд. Якщо через хвилину нічого не змінилось — відкрийте сторінку в режимі "Інкогніто" або очистіть кеш браузера (Ctrl+Shift+R).' },
      { q: 'Як правильно вказати адресу щоб клієнти знаходили мене на карті?', a: 'В Налаштуваннях → Місцезнаходження введіть адресу в пошуковому рядку і виберіть підказку зі списку (не вводьте вручну без вибору підказки). Якщо адресу не знайдено — натисніть на карту для ручного встановлення точки. Клієнти отримають кнопку "Прокласти маршрут" прямо у вашому профілі.' },
      { q: 'Slug (посилання) вже зайнятий іншим майстром. Що робити?', a: 'Додайте до slug унікальний суфікс: наприклад, замість "anna" використайте "anna-kyiv" або "anna-cuts". Slug повинен містити лише латинські літери, цифри та дефіси. Рекомендуємо: ім\'я + місто або ім\'я + спеціалізація.' },
    ],
  },
];

function FaqItem({ q, a }: FaqEntry) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button type="button"
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left cursor-pointer"
        aria-expanded={isOpen}
      >
        <p className="flex-1 min-w-0 text-[13px] font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
          {q}
        </p>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={SPRING_CHEVRON}
          className="shrink-0 mt-0.5"
          style={{ color: 'var(--text-tertiary)', display: 'flex' }}
        >
          <ChevronDown size={15} strokeWidth={1.6} />
        </motion.span>
      </button>
      <div style={{ overflow: 'hidden' }}>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="body"
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={SPRING_DRAWER}
              style={{ overflow: 'hidden' }}
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12, delay: isOpen ? 0.05 : 0 }}
                className="px-4 pb-4 pt-0.5 text-[12px] leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {a}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FaqSectionGroup({ category, index }: { category: FaqCategory; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_SECTION, delay: index * 0.04 }}
    >
      <div className="flex items-center gap-2 px-1 mb-2">
        <span style={{ color: 'var(--accent)', display: 'flex' }}>
          <category.icon size={13} strokeWidth={1.7} />
        </span>
        <p className="text-[10px] font-bold tracking-[0.13em] uppercase" style={{ color: 'var(--text-tertiary)' }}>
          {category.title}
        </p>
        <span
          className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}
        >
          {category.items.length}
        </span>
      </div>
      <div className="bento-card overflow-hidden">
        {category.items.map((item, i) => (
          <div key={item.q} style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}>
            <FaqItem q={item.q} a={item.a} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function FaqChatNudge() {
  return (
    <div className="bento-card p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span style={{ color: 'var(--accent)', display: 'flex' }}>
          <MessageSquare size={18} strokeWidth={1.7} />
        </span>
        <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          Не знайшли відповідь у базі знань?
        </p>
      </div>
      <Link href="/dashboard/support/chat" className="shrink-0 text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
        Написати у чат →
      </Link>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function AcademyPage() {
  const [activeTab, setActiveTab] = useState<'functions' | 'goals' | 'faq'>('functions');
  async function handleRestartTour() {
    localStorage.removeItem('tour_dashboard_v3');
    await resetTourSeen('dashboard_v3');
    window.location.href = '/dashboard';
  }

  const sections = activeTab === 'goals' ? GOAL_SECTIONS : FUNCTION_SECTIONS;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span style={{ color: 'var(--accent)', display: 'flex' }}>
            <GraduationCap size={22} strokeWidth={1.5} />
          </span>
          <h1 className="text-[22px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            BookIT Академія
          </h1>
        </div>
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          Як це все працює — читай тут
        </p>
      </div>

      {/* Tab bar */}
      <div
        className="flex rounded-xl p-1 gap-1"
        style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}
      >
        {(['functions', 'goals', 'faq'] as const).map(tab => (
          <button type="button"
            key={tab}
            aria-pressed={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className="relative flex-1 py-2.5 text-[13px] font-semibold rounded-lg cursor-pointer"
            style={{
              color: activeTab === tab ? 'white' : 'var(--text-secondary)',
              transition: 'color 200ms ease',
            }}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="academy-tab-pill"
                className="absolute inset-0 rounded-lg"
                style={{ background: 'var(--accent)' }}
                transition={SPRING_TAB}
              />
            )}
            <span className="relative z-10">
              {tab === 'functions' ? 'Функції' : tab === 'goals' ? 'Цілі' : 'Питання'}
            </span>
          </button>
        ))}
      </div>

      {/* Content — tab switch */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={SPRING_CONTENT}
          className="space-y-6"
        >
          {activeTab === 'faq' ? (
            <>
              {FAQ_CATEGORIES.map((cat, i) => (
                <FaqSectionGroup key={cat.id} category={cat} index={i} />
              ))}
              <FaqChatNudge />
            </>
          ) : (
            sections.map((section, i) => (
              <SectionGroup key={section.id} section={section} index={i} />
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <p className="text-center text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
        Нові розділи — скоро
      </p>

      {/* Restart tour */}
      <button type="button"
        onClick={handleRestartTour}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-semibold active:scale-[0.97] active:transition-none cursor-pointer"
        style={{
          background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
          color: 'var(--accent)',
        }}
      >
        <span style={{ display: 'flex' }}>
          <Play size={13} strokeWidth={1.8} />
        </span>
        Пройти тур знову
      </button>
    </div>
  );
}
