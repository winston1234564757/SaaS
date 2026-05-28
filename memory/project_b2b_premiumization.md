---
name: project-b2b-premiumization
description: B2B Premiumization and Stabilization (v8.3)
metadata:
  type: project
---

Реалізація 10 завдань стабілізації та AAA-дизайну B2B кабінету майстра (запущено в прод 2026-05-24).

**Why:** Усунення інтерфейсних колізій, layout shifts, та "іграшкових" елементів дизайну, переведення їх на преміум Bento-стиль та нативну роботу на iOS/PWA.

**Architectural Decisions & Solutions:**

1. **PWA Status Bar & Safe Area:**
   - Читання теми майстра (`client_theme` cookie) на рівні SSR у `layout.tsx` для інжектування динамічного `<meta name="theme-color" content={currentTheme.statusBarColor} />`.
   - **PWA Status Bar Style:** Змінено `statusBarStyle` з `default` на `black-translucent` у `appleWebApp` метаданих. Це робить статус-бар повністю прозорим в iOS Standalone PWA, дозволяючи кольоровому фону теми додатку (`body`) заходити під статус-бар (усунуло білу смугу).
   - **Покращення:** Видалено глобальний `pt-[env(safe-area-inset-top)]` з `layout.tsx`, який ламав десктопний TopBar та фіксовані елементи. Замість цього відступ перенесено локально для мобільних в'юпортів: `main` у `DashboardLayout.tsx` (`pt-[env(safe-area-inset-top)] lg:pt-0`), `MyLayout` для B2C (`pt-[env(safe-area-inset-top)] md:pt-20`), та контейнер `MobileHub.tsx` (`pt-[calc(env(safe-area-inset-top)+2rem)]`).
   - **Динамічний колір:** Впроваджено динамічне оновлення мета-тегу `<meta name="theme-color">` при зміні теми користувачем на клієнті у `ThemeApplier` (`DashboardLayout.tsx`) та `handleThemeChange` (`MyProfilePage.tsx`).

2. **Calendar Shift Prevention:**
   - Використання `<AnimatePresence mode="popLayout">` у `WeeklyOverview.tsx`.
   - Встановлення `position: absolute` на вихідний елемент під час `exit` анімації. Це запобігає виштовхуванню нової сітки вниз під час перемикання днів.

3. **Stats Widget Flexbox Align:**
   - Відмова від `absolute right-2 top-2` для іконок на користь флексу `flex justify-between items-start gap-2`.
   - Це запобігає перекриттю довгих українських назв метрик (наприклад, "Скасування бронювань") іконками.

4. **Premium Neon Glass (Frost Theme):**
   - Швидкі дії переведені на saturated напівпрозоре скло з неоновим підсвічуванням: `bg-primary/15 backdrop-blur-md border border-primary/40 shadow-[0_0_15px_rgba(var(--primary-rgb),0.25)]`.

5. **Bio Expandable Bento:**
   - Опис майстра `bio` перенесено прямо в основну bento-картку `ProfileHero`.
   - Обмеження тексту за допомогою `line-clamp-3` із мікро-кнопкою "Читати далі" / "Згорнути" та плавною зміною висоти через `<motion.div layout />`.

6. **Realtime Busyness Sync:**
   - Хук `useBusyness.ts` тепер динамічно розраховує робочі хвилини на основі розкладу майстра (`schedule_templates`) та винятків/відпусток (`schedule_exceptions`), замість константного ліміту `DAILY_CAPACITY = 8`.

7. **Bento Editors (Services & Products):**
   - Відмова від модалок для CRUD. Тонкі межі `border-neutral-200/50` / `border-white/10`.
   - Розділення полів на 3 bento-секції: Core Metadata (col-span-8), Media Assets (col-span-4), Strategy & Prices (col-span-4).

8. **Portfolio Auto-Draft Flow:**
   - При переході на `/portfolio/new` автоматично створюється прихована чернетка з `is_published: false` в БД.
   - Миттєвий редирект на `/portfolio/[id]?draft=true`, що дозволяє відразу завантажувати та сортувати фотографії за допомогою `@hello-pangea/dnd`.
   - У разі скасування/навігації назад чернетка автоматично видаляється через Server Action для чистоти бази даних.
   - **Фікс зависання сторінки:**
     - Виправлено конфлікт `redirect()` у `try-catch` блоці в `new/page.tsx` (винесено за межі блоку, щоб запобігти перехопленню помилки `NEXT_REDIRECT`).
     - Оптимізовано функції `getMasterReviews` та `getMasterClients` — вони більше не викликають `supabase.auth.getUser()` паралельно у `Promise.all` (що викликало взаємоблокування та зависання на сервері Next.js), а отримують `masterId` як параметр та виконують запити через `createAdminClient()`.
