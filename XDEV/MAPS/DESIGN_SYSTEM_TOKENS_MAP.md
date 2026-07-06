# 🎨 Design System & Visual Redesign Map — BookIT

Цей документ визначає специфікацію дизайн-токенів, правил типографіки, анімаційних ефектів та посторінкового чеклиста для майбутнього глобального редизайну кабінету майстра (Master Dashboard).

---

## 🎨 Тематичні токени (Theme Mapping)

BookIT підтримує 3 офіційні теми, що перемикаються за допомогою `data-theme` на тезі `<html>`. Всі токени налаштовані в [globals.css](file:///c:/Users/Vitos/SaaS/bookit/src/app/globals.css).

| Токен (CSS Variable) | Blossom (Taupe Light Air · Default) | Studio (Teal Brutal Dark) | Frost (Ice Lavender) |
|---|---|---|---|
| `--background` | `#DDD5C6` | `#0E1D21` | `#EFF2FF` |
| `--background-deep` | `#C9BEA8` | `#0A1417` | `#E0E5FF` |
| `--accent` | `#B8732A` (WCAG AA) | `#D3A376` (золотий) | `#0F172A` (slate) |
| `--accent-light` | `rgba(184, 115, 42, 0.15)` | `rgba(211, 163, 118, 0.14)` | `rgba(15, 23, 42, 0.08)` |
| `--accent-on` | `#F5EDE0` | `#0E1D21` | `#F8FAFC` |
| `--surface` | `rgba(255, 255, 255, 0.62)` | `rgba(30, 76, 90, 0.94)` | `rgba(218, 226, 255, 0.90)` |
| `--border` | `rgba(40, 32, 26, 0.12)` | `rgba(103, 126, 138, 0.28)` | `rgba(99, 102, 241, 0.14)` |
| `--border-strong` | `rgba(40, 32, 26, 0.20)` | `rgba(120, 154, 170, 0.50)` | `rgba(99, 102, 241, 0.22)` |
| `--text-primary` | `#28201A` | `#CDD8DC` | `#0F172A` |
| `--text-secondary` | `#7A7060` | `#8EA8B5` | `#475569` |
| `--text-tertiary` | `rgba(100, 90, 76, 0.62)` | `#7E9CAA` | `rgba(15, 23, 42, 0.45)` |
| `--hero-card-bg` | `#28201A` | `var(--accent)` | `#0F172A` |
| `--btn-primary-bg` | `#28201A` | `var(--accent)` | `#0F172A` |
| `--blob-1` | `rgba(100, 78, 55, 0.22)` | `rgba(26, 61, 69, 0.80)` | `rgba(99, 102, 241, 0.22)` |

### 📐 Розмітка та Радіуси (Однакові для всіх тем)
*   **Радіус карток**: `24px` (`rounded-3xl` / `var(--card-radius)`)
*   **Радіус кнопок**: `100px` (Pill / `var(--button-radius)`)
*   **Радіус полів введення**: `100px` (Pill / `var(--input-radius)`)
*   **Висота Topbar**: `60px` (`var(--topbar-height)`)
*   **Висота Bottom Nav**: `76px` (`var(--bottom-nav-height)`)
*   **Ширина Sidebar**: `280px` (`var(--sidebar-width)`)

---

## ✍️ Шрифтові правила (Typography Guidelines)

*   **Body Text**: **Geist Sans** (`var(--font-geist-sans)`), DM Sans як fallback. Використання *Inter* суворо заборонено.
*   **Headings / Display**: **Cormorant Garamond** (`var(--font-cormorant)`). На темі **Studio** для привітання використовується Cormorant Light в UPPERCASE з великим `letter-spacing`. На темі **Frost** — Geist Bold.
*   **Script Accent**: **Great Vibes** (`var(--font-great-vibes)`) — тільки для Blossom логотипу або коротких привітань (до 2 слів).
*   **Заборонені ваги**: `font-black`, `font-light`, `font-thin` заборонені.

---

## 🎬 Правила Інтерактивності та Анімацій (Motion Specs)

1.  **Spring-анімації**: Всі мікро-взаємодії повинні використовувати пружинну фізику з низьким bounce (`0–0.12`) та тривалістю до `300ms` (`type: "spring" as const`).
2.  **AnimatePresence**:
    *   Суворо **заборонено** `mode="wait"` для елементів із плаваючою висотою.
    *   Завжди використовуйте `mode="popLayout"`.
    *   Для блоків динамічної висоти (наприклад, календар з різною кількістю тижнів) обгортайте батьківський блок у `<motion.div layout transition={{ type: "spring" as const, duration: 0.3, bounce: 0 }}>`.
3.  **Sliding Tab Indicator**: Для перемикачів використовуйте анімований повзунок з `layoutId="tab-indicator-<unique_id>"`.
4.  **Тактильний відгук**:
    *   Кожен клікабельний елемент повинен мати клас `cursor-pointer`.
    *   Тактильний ефект на клік: `active:scale-[0.95] transition-transform duration-100`.
    *   Hover-ефект для карток тем здійснюється через group hover overlay div:
        ```tsx
        <div className="group relative overflow-hidden ...">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
               style={{ background: 'color-mix(in srgb, var(--accent-on) 8%, transparent)' }} />
          <span className="relative z-10">контент</span>
        </div>
        ```
5.  **No-Emoji Policy**: Жодних смайлів в інтерфейсі. Використовуйте Lucide React іконки, обгорнуті у `<span style={{ color }}>...</span>` для кольорових акцентів.

---

## 🔳 Bento Grid & Dashboard Layout (Кабінет Майстра)

Десктопний кабінет базується на асиметричній сітці `lg:grid-cols-4` із картками класу `.widget-card` / `.bento-card`:

1.  **Identity Widget** (Портрет): `lg:col-span-1 lg:row-span-2`
2.  **Intelligence Widget** (Підказки/Поради AI): `lg:col-span-2`
3.  **Action Widget** (Швидкі Кнопки): `lg:col-span-1`
4.  **Metrics Widget** (Графіки): `lg:col-span-2`

---

## 📋 Посторінковий чеклист редизайну (Dashboard Redesign Target)

### 1. Головний екран кабінету (`/dashboard`)
*   [ ] Перевірити сумісність `.ambient-blob-1/2/3` анімацій з фонами всіх 3-х тем.
*   [ ] Усунути будь-які емодзі з `TodaySchedule` та AI-підказок.
*   [ ] Налаштувати перемикання теми на календарі (`MonthlyCalendarWidget`) без зсувів сітки.
*   [ ] Перевірити плавний спливаючий ефект (y-вісь) при переході між тижнями/днями.

### 2. Керування записами (`/dashboard/bookings`)
*   [ ] Кнопки перемикання режимів Day/Week/Month повинні мати `layoutId="tab-indicator-bookings"`.
*   [ ] Всі картки замовлень (`BookingCard`) повинні мати left-stripe статусні смужки (`borderLeft: 3px solid var(--border-status)`).
*   [ ] Перевірити адаптивність таймлайну на мобільних пристроях.

### 3. CRM та клієнти (`/dashboard/clients`)
*   [ ] У списку клієнтів заблокувати будь-які емодзі Vibe-міток, замінивши їх на Lucide Badges.
*   [ ] Перевірити, що при відкритті картки клієнта `ClientDetailSheet` через URL (`?clientId=...`) використовується `BottomSheet` (vaul) із правильним `pb-32` та анімацією закриття 400ms.

### 4. Налаштування профілю (`/dashboard/settings`)
*   [ ] Форма налаштування годин роботи повинна використовувати округлі селектори без різких кутів.
*   [ ] Перевірити сумісність теми Studio з LocationPicker (карта повинна мати темні стилі).
