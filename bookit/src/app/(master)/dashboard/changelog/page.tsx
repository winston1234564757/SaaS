'use client';

import { motion } from 'framer-motion';
import { 
  Rocket, 
  LayoutGrid, 
  ChevronLeft, 
  ExternalLink, 
  CheckCircle2,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const UPDATES = [
  {
    title: 'B2B Premiumization & Stabilization',
    icon: Sparkles,
    color: 'sage',
    description: 'Масштабна стабілізація та покращення UI/UX кабінету майстра. Впроваджено 10 ключових покращень для преміального вигляду та нативної роботи.',
    details: [
      'PWA & Safe Area: динамічний колір статус-бару під тему та запобігання перекриттю вирізами на iOS',
      'Calendar Shift: усунено стрибки інтерфейсу календаря при перемиканні днів через AnimatePresence popLayout',
      'Bento Editors: редактори послуг та товарів переведено на повносторінковий Bento Grid дизайн із тонкими межами',
      'Realtime Busyness: розрахунок завантаженості майстра тепер базується на робочих хвилинах реального розкладу',
      'Portfolio Drafts: автоматичне створення чернеток та зручне сортування drag-and-drop',
      'Bio Expandable: опис майстра інтегровано в Bento-картку профілю з плавним розгортанням height-spring'
    ],
    link: '/dashboard/settings',
    linkText: 'Перейти до налаштувань'
  },
  {
    title: 'Inline Tabs Switcher (Revenue & Growth)',
    icon: Sparkles,
    color: 'sage',
    description: 'Повністю ліквідовано Bento-меню та Drawers на сторінках доходів та росту. Тепер налаштування відображаються inline через нативний перемикач вкладок.',
    details: [
      'Sliding Tab Switcher: додано преміальні pill-перемикачі з плавною анімацією ковзання layoutId',
      'Inline Settings: Флеш-акції, Смарт-ціни, Лояльність, Реферали та Партнери відтепер відкриваються прямо на сторінці без Drawers',
      'URL State Sync: поточний таб зберігається в URL-параметрі ?tab=... за допомогою nuqs',
      'Адаптивний Paywall: золотий інлайн-пейвол Dynamic Pricing інтегровано безпосередньо в структуру вкладки'
    ],
    link: '/dashboard/revenue',
    linkText: 'Відкрити нові таби'
  },
  {
    title: 'Revenue & Growth Bento Hubs',
    icon: Sparkles,
    color: 'sage',
    description: 'Оновлена архітектура кабінету майстра: депрековано автономні сторінки та впроваджено Redirect Gateways. Тепер всі CRUD-налаштування відкриваються миттєво у Drawers/Bottom Sheets.',
    details: [
      'Redirect Gateways: запити на /flash, /pricing, /loyalty, /referral, /partners автоматично відкривають Drawers у Bento Hubs',
      'Drawer-Friendly Pricing Gate: інтегровано inline paywall із золотим градієнтом та Locked Key preview прямо у шторку',
      'Secure RPC Aggregator: історія рефералів тепер завантажується одним швидким запитом RPC get_master_referral_history',
      'No-Emoji Compliance: очищено UI партнерського флоу від емодзі згідно з стандартами UX',
    ],
    link: '/dashboard/revenue',
    linkText: 'Перейти до Revenue Hub'
  },
  {
    title: 'Inventory & Financial Intelligence',
    icon: Sparkles,
    color: 'accent',
    description: 'BookIT стає міні-ERP: облік витратних матеріалів (мл/г), собівартість COGS, чистий прибуток по запису та прогноз дефіциту на 14 днів.',
    details: [
      'inventory_items: переименовано products → ERP-таблиця з типами consumable / for_sale',
      'Moving Weighted Average: автоматичний розрахунок ціни закупівлі при поповненні складу',
      'Рецептури послуг: прив\'яжіть матеріали (мл фарби, г порошку) до кожної послуги',
      'CFO-логіка: при завершенні запису — автоматичне списання COGS та розрахунок net_profit',
      'Oracle Widget: попередження на дашборді якщо матеріалів не вистачить на 14 днів',
      'Upsell PWA: клієнти бачать рекомендовані товари відповідно до заброньованої послуги',
    ],
    link: '/dashboard/inventory',
    linkText: 'Перейти до інвентарю'
  },
  {
    title: 'Desktop Premium Overhaul',
    icon: LayoutGrid,
    color: 'sage',
    description: 'Масштабне оновлення інтерфейсу для великих екранів. BookIT тепер виглядає як справжній Premium SaaS.',
    details: [
      '4-Column Bento Grid: ідеальний розподіл інформації на десктопі',
      'Mica Glassmorphism: глибоке розмиття та скляні ефекти для всіх модалок',
      'Responsive TopBar: розумна навігація з More-дропдауном',
      'Harmonized Widgets: всі віджети огляду адаптовані під нову сітку'
    ],
    link: '/dashboard',
    linkText: 'Глянути новий огляд'
  },
  {
    title: 'Telegram Mini App Auth',
    icon: Rocket,
    color: 'sage',
    description: 'Підсилили вхід клієнтів через Telegram Mini App, щоб телефонний лінкінг не ламався на старих акаунтах.',
    details: [
      'Manual phone flow відновлює профіль навіть якщо auth.users існує без рядка в profiles',
      'Після ручного введення номера сесія відкривається одразу, без повторної залежності від initDataRaw',
      'Contact webhook переведений на E.164, тому polling шукає той самий формат телефону що й SMS auth'
    ],
    link: '/dashboard',
    linkText: 'Відкрити BookIT'
  },
  {
    title: 'Vaul Engine',
    icon: Smartphone,
    color: 'sage',
    description: 'Ми перейшли на топову технологію Vaul. Тепер свайпи модалок — це чисте задоволення, як у нативному iOS.',
    details: [
      'Perfect Drag: ідеальна фізика змахування',
      'Smart Scroll Lock: фон більше не "тікає" при відкритті',
      'iOS Dynamic Handle: ручка тепер частина системи свайпів',
      'Покращена стабільність на всіх тач-пристроях'
    ],
    link: '/dashboard',
    linkText: 'Спробувати Vaul'
  },
  {
    title: 'Hybrid Modals',
    icon: LayoutGrid,
    color: 'white',
    description: 'PopUpModal став розумним. Він відчуває твій пристрій і адаптується миттєво.',
    details: [
      'Desktop: класичний елегантний Dialog',
      'Mobile: нативна iOS шторка (BottomSheet)',
      'Уніфікований досвід: однакова логіка всюди',
      'Більше ніяких конфліктів скролу'
    ],
    link: '/dashboard/flash',
    linkText: 'Перевірити модалки'
  },
  {
    title: 'Mosaic Hub & Juicy UX',
    icon: Sparkles,
    color: 'peach',
    description: 'Глобальне оновлення візуальної мови проекту.',
    details: [
      'Mosaic Navigation: асиметрична сітка 5-ти колонок',
      'Peach Glassmorphism (Mica) з глибоким розмиттям',
      'Juicy Selection: тактильний фідбек та robust mapping',
      'Zero Noise: прибрано зайві тексти, фокус на іконках'
    ],
    link: '/dashboard/settings',
    linkText: 'Глянути дизайн'
  }
];

export default function ChangelogPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-transparent pt-6 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center mb-6 active:scale-[0.88] cursor-pointer transition-transform"
          >
            <ChevronLeft size={20} className="text-text-main" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 rounded-full bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest">
              v8.3 &quot;B2B Premiumization&quot;
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
          </div>
          <h1 className="font-display text-5xl text-text-main leading-tight">Що нового?</h1>
          <p className="text-text-sub mt-2 opacity-70">Детальний звіт про еволюцію BookIT</p>
        </header>

        {/* Updates List */}
        <div className="space-y-6">
          {UPDATES.map((upd, idx) => (
            <motion.div
              key={upd.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bento-card p-6 relative overflow-hidden group"
            >
              <div className="flex items-start gap-4 relative z-10">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner",
                  upd.color === 'sage' ? "bg-accent text-accent-on" : "bg-secondary text-text-secondary border border-border"
                )}>
                  <upd.icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-text-main mb-1 flex items-center gap-2">
                    {upd.title}
                    <Sparkles size={14} className="text-sage opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-text-sub leading-relaxed mb-4">{upd.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    {upd.details.map((detail, i) => (
                      <div key={i} className="flex items-center gap-2 text-[13px] text-text-main/70">
                        <CheckCircle2 size={14} className="text-sage" />
                        {detail}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => router.push(upd.link)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/80 border border-border text-sm font-bold text-text-primary hover:bg-secondary transition-all active:scale-[0.95] cursor-pointer shadow-sm"
                  >
                    {upd.linkText}
                    <ExternalLink size={14} className="opacity-50" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How to Check Section */}
        <section className="mt-12 p-6 rounded-[32px] bg-secondary/30 border border-border">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-text-tertiary mb-4">Як перевірити?</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-text-mute uppercase font-bold tracking-tighter">Крок 1</span>
              <p className="text-xs text-text-main font-medium">Відкрий <span className="text-sage font-bold">Mosaic Hub</span> через центральну кнопку знизу.</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-text-mute uppercase font-bold tracking-tighter">Крок 2</span>
              <p className="text-xs text-text-main font-medium">Перейди в Налаштування та спробуй змінити <span className="text-sage font-bold">Спеціалізацію</span>.</p>
            </div>
          </div>
        </section>

        <footer className="mt-12 text-center">
          <p className="text-[11px] text-text-mute font-medium uppercase tracking-[0.3em]">
            Дякуємо, що будуєте BookIT разом з нами
          </p>
        </footer>
      </div>
    </div>
  );
}
