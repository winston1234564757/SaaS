'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays, Users, BarChart2, Zap, Scissors, Settings,
  UserPlus, TrendingUp, Bell, Heart,
  GraduationCap, ChevronDown, ArrowRight, Play,
} from 'lucide-react';
import { useTourStep } from '@/components/master/dashboard/DashboardTourContext';

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

// ── Main ──────────────────────────────────────────────────────────────────────
export function AcademyPage() {
  const [activeTab, setActiveTab] = useState<'functions' | 'goals'>('functions');
  const { startTour } = useTourStep();
  const router = useRouter();

  function handleRestartTour() {
    startTour();
    router.push('/dashboard');
  }

  const sections = activeTab === 'functions' ? FUNCTION_SECTIONS : GOAL_SECTIONS;

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
        {(['functions', 'goals'] as const).map(tab => (
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
              {tab === 'functions' ? 'Функції' : 'Цілі'}
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
          {sections.map((section, i) => (
            <SectionGroup key={section.id} section={section} index={i} />
          ))}
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
