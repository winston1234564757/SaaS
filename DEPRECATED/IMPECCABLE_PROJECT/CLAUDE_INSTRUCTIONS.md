# Інструкція для Claude Code (Remediation Context Handoff)

Цей файл створений для передачі повного архітектурного контексту та специфікацій змін у коді для Claude Code.

---

## 🏛️ КОНТЕКСТ ПРОЄКТУ BOOKIT
- **BookIT** — преміальний SaaS для майстрів бʼюті-індустрії.
- **Стек**: Next.js 16+ App Router, Tailwind v4, React 19, Supabase (PostgreSQL + RLS), Framer Motion.
- **Три системні теми (Theme Spectrum)**:
  - `Blossom`: світлий тауп (основна тема, під яку все писалось спочатку).
  - `Frost`: світла лаванда (Ice Lavender).
  - `Studio`: темний бірюзовий (Teal Dark).
- **Дизайн-система (IRON RULES)**:
  - Радіуси кнопок та полів введення мають бути **strict rounded-full** (pill shape). Використання `rounded-lg/xl` — це дрейф.
  - Повна **No-Emoji Policy** для UI елементів (використовувати тільки Lucide React іконки).

---

## 🚀 ПОКРОКОВИЙ ТЕХНІЧНИЙ ПЛАН ВИПРАВЛЕНЬ

Будь ласка, виконай наступні етапи виправлень у кодовій базі `bookit/` відповідно до специфікації:

### 🛠️ ЕТАП 1: ГАРЯЧІ ВИПРАВЛЕННЯ БЕЗПЕКИ & DB (P0)

#### 1. Безпечна імперсонація адміном
*   **Файли**: 
    - [MastersDirectory.tsx](file:///C:/Users/Vitos/SaaS/bookit/src/components/admin/MastersDirectory.tsx#L137)
    - [layout.tsx (master)](file:///C:/Users/Vitos/SaaS/bookit/src/app/(master)/layout.tsx#L10)
*   **Проблема**: Імперсонація (вхід під видом іншого майстра) довіряє непідписаному клієнтському кукі `user_role === 'admin'`. Це дозволяє зловмиснику змінити кукі вручну та вказати будь-який `impersonate_master_id` для перегляду чужих дашбордів.
*   **Інструкція**:
    1. Перепиши встановлення кукі в `MastersDirectory.tsx`. Замість прямого `Cookies.set('impersonate_master_id', ...)` викликай Server Action.
    2. У Server Action перевір роль користувача в Supabase через `supabase.auth.getUser()`. Якщо роль `'admin'`, встанови криптографічно підписане кукі (HMAC) за допомогою `process.env.IMPERSONATE_SECRET`.
    3. У `(master)/layout.tsx` розкодуй та перевір HMAC підпис кукі `impersonate_master_id` на серверній стороні. Отримуй роль `role` тільки через `supabase.auth.getUser()` та БД, а не клієнтське кукі.

#### 2. Запобігання витоку Supabase-клієнтів
*   **Файли**: [useBookingWizardState.ts](file:///C:/Users/Vitos/SaaS/bookit/src/components/shared/wizard/useBookingWizardState.ts)
*   **Проблема**: Хук ініціалізує новий клієнт Supabase всередині `useEffect`, що спричиняє витік з'єднань при рендерах.
*   **Інструкція**: Видали локальне створення клієнта і імпортуй глобальний синглтон браузерного клієнта Supabase з `@/lib/supabase/client`.

#### 3. Додавання search_path до RPC
*   **Проблема**: Функції з прапором `SECURITY DEFINER` (наприклад, `check_and_log_sms_send`) не містять `SET search_path = public`.
*   **Інструкція**: Додай `SET search_path = public` до SQL-визначень всіх таких RPC-функцій у міграціях Supabase.

---

### 🎨 ЕТАП 2: THEMING & УСУНЕННЯ HEX-ХАРДКОДУ (P0-P1)

#### 1. Реєстрація `--btn-primary-bg`
*   **Файли**: [globals.css](file:///C:/Users/Vitos/SaaS/bookit/src/app/globals.css)
*   **Проблема**: В `BookingWizard` кнопки дій використовують `bg-[var(--btn-primary-bg)]`, але змінна не зареєстрована у `globals.css` для Frost та Studio тем.
*   **Інструкція**: Зареєструй змінну у файлі `globals.css`:
    - Blossom theme (`:root`): `--btn-primary-bg: #28201A;`
    - Frost theme (`[data-theme='frost']`): `--btn-primary-bg: #0F172A;`
    - Studio theme (`[data-theme='studio']`): `--btn-primary-bg: #D3A376;`

#### 2. Текст у редакторі розсилок (Contrast P0)
*   **Файли**: [BroadcastEditor.tsx](file:///C:/Users/Vitos/SaaS/bookit/src/components/master/marketing/BroadcastEditor.tsx)
*   **Проблема**: Темно-коричневий текст на темно-бірюзовому тлі у Studio темі (нульовий контраст).
*   **Інструкція**: Заміни hardcoded колір тексту у полі введення на CSS змінну `var(--text-primary)`.

#### 3. Видалення hardcoded Blossom hex-кодів
*   **Файли**:
    - [MorePage.tsx](file:///C:/Users/Vitos/SaaS/bookit/src/components/master/more/MorePage.tsx)
    - [StudioJoinPage.tsx](file:///C:/Users/Vitos/SaaS/bookit/src/components/master/studio/StudioJoinPage.tsx)
    - [ProductCart.tsx](file:///C:/Users/Vitos/SaaS/bookit/src/components/shared/wizard/ProductCart.tsx)
*   **Проблема**: Плитки меню, кнопки `+` / `-` та фони мають зашиті hex-коди Blossom, які не змінюються при виборі Frost/Studio.
*   **Інструкція**: Заміни hex-коди на змінні CSS-токени (`var(--surface)`, `var(--text-secondary)`, `var(--accent)`).

---

### 🔄 ЕТАП 3: АНІМАЦІЇ ТА UX (P1-P2)

#### 1. Стабілізація висоти календаря
*   **Файли**: [BookingsPage.tsx](file:///C:/Users/Vitos/SaaS/bookit/src/components/master/bookings/BookingsPage.tsx) (або відповідний вкладений календар)
*   **Проблема**: Стрибки лейауту при зміні місяців (5 vs 6 рядків).
*   **Інструкція**: Загорни календар у `<motion.div layout transition={{ type: 'spring', duration: 0.3, bounce: 0 }}>`.

#### 2. Адаптація ImageCropper
*   **Файли**: [ImageCropper.tsx](file:///C:/Users/Vitos/SaaS/bookit/src/components/master/settings/components/ImageCropper.tsx)
*   **Проблема**: Межі кропера виходять за рамки мобільного екрана.
*   **Інструкція**: Застосуй адаптивне обмеження ширини `max-w-full` або `w-[calc(100vw-32px)]`.

---

### 🚨 ПРАВИЛА ВЕРСІОНУВАННЯ & ВЕРИФІКАЦІЇ (Для Claude Code)
1. **Збереження стилю**: Після внесення будь-яких змін обов'язково запускай `npm run lint` та `npm run build`.
2. **Атомарність**: Роби точкові логічні коміти для кожної виправленої задачі.
3. **Українська локалізація**: Усі текстові повідомлення повинні використовувати правильну українську граматику. Для множини використовуй хелпер `pluralUk` з `@/lib/utils/pluralUk`.
4. **Lucide-іконки**: Заборонено використовувати емодзі в UI кнопках, бейджах, картках та категоріях. Тільки Lucide React іконки.
