# ✨ PREMIUM UX STANDARDS — Design & Interaction Rules

> **Статус:** Обов'язкові для виконання стандарти інтерфейсу BookIT. Кожен UI-компонент має відповідати рівню Premium SaaS.

---

## 🚫 No-Emoji Policy (Absolute)
- **Правило:** Жодних емодзі в інтерфейсі (кнопки, заголовки, бейджі, селектори, service pills, filter chips, widget rows).
- **Обґрунтування:** Емодзі дешевшають вигляд продукту. Для акцентів використовувати виключно **Lucide React** іконки з відповідною вагою та кольором.
- **Виключення:** Тільки якщо це **непеределаний** користувацький контент (напр. нотатки клієнтів у free-text полі).
- **ЗАБОРОНЕНО в коді:** `{svc.emoji}`, `{item.emoji}`, `{category.emoji}` — будь-який рендер поля `emoji` з DB у видимих UI-елементах.

---

## 🎨 Theme Standards (джерело правди: globals.css)

BookIT підтримує 3 офіційні колірні теми, які перемикаються за допомогою `data-theme` на тезі `<html>`:

### 1. Blossom (Taupe Light Air · Default)
- `--background`: `#DDD5C6` | `--accent`: `#B8732A` ( WCAG AA на Taupe) | `--accent-on`: `#F5EDE0`
- `--text-primary`: `#28201A` | `--text-secondary`: `#7A7060` | `--text-tertiary`: `rgba(100, 90, 76, 0.62)`
- `--hero-card-bg`: `#28201A` | `--btn-primary-bg`: `#28201A`
- **Особливість:** Теплі, затишні тони, м'які тіні, ефект матового паперу (`--surface`: `rgba(255,255,255,0.62)`).

### 2. Studio (Teal Brutal Dark)
- `--background`: `#0E1D21` | `--accent`: `#D3A376` (золотий) | `--accent-on`: `#0E1D21`
- `--text-primary`: `#CDD8DC` | `--text-secondary`: `#8EA8B5` | `--text-tertiary`: `#7E9CAA`
- `--hero-card-bg`: `var(--accent)` | `--btn-primary-bg`: `var(--accent)`
- **Особливість:** Глибокі темні тони, контрастні золотисті акценти, ефект темного скла (`--surface`: `rgba(30, 76, 90, 0.94)`).

### 3. Frost (Ice Lavender)
- `--background`: `#EFF2FF` | `--accent`: `#0F172A` (slate) | `--accent-on`: `#F8FAFC`
- `--text-primary`: `#0F172A` | `--text-secondary`: `#475569` | `--text-tertiary`: `rgba(15, 23, 42, 0.45)`
- `--hero-card-bg`: `#0F172A` | `--btn-primary-bg`: `#0F172A`
- **Особливість:** Холодні світлі відтінки лаванди, напівпрозоре фіолетове скло (`--surface`: `rgba(218, 226, 255, 0.90)`), кнопки за замовчуванням transparent з overlay при hover.

### Layout Константи (однакові для всіх 3-х тем!)
- Card radius: `24px` (rounded-3xl).
- Button radius: `100px` (pill).
- Input radius: `100px` (pill).
- Topbar height: `60px` · Bottom nav height: `76px` · Sidebar width: `280px`.
- Body font: **Geist Sans** (НЕ Inter) · Display/heading font: **Cormorant Garamond** (НЕ Playfair Display).

---

## 📱 Mobile-First Sheets (Vaul)
- Всі модальні вікна на мобільних телефонах мають відкриватися як `BottomSheet` (`vaul`).
- Обов'язкова підтримка свайпу вниз для закриття, наявність iOS-handle та `pb-32` для безпечної зони.
- Закриття з затримкою для плавності анімацій:
  ```typescript
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleClose = () => {
    setIsModalOpen(false);
    setTimeout(onClose, 400); // Час на завершення анімації Vaul
  };
  ```

---

## 🔳 Side-Stripe (Status Indicators)
- Тонка вертикальна лінія зліва на картці: `borderLeft: 3px solid color` безпосередньо на контейнері картки.
- Запобігає появі зайвих елементів `div` всередині картки та ідеально слідує за `border-radius`.

---

## 🔳 Asymmetric Bento Dashboard (Bento Grid)
- **Grid Structure:** Desktop дашборди використовують 4-колоночну асиметричну сітку (`lg:grid-cols-4`, `gap-4`). Жодних простих 2x2.
- **Hierarchy:**
  - **Identity (Hero):** `lg:col-span-1 lg:row-span-2` — портретна картка з фото.
  - **Intelligence (Advisor):** `lg:col-span-2` — широкий блок із порадами та аналітикою.
  - **Action (Quick Buttons):** `lg:col-span-1` — квадратні швидкі дії.
  - **Metrics (Analytics):** `lg:col-span-2` — графіки та статистика.
- **Visuals:** Блоки мають клас `.widget-card` (backdrop-blur, rounded-3xl, mica shadow).

---

## 🖱️ Cursor & Hover Policy (Absolute Rule)
- Будь-який інтерактивний елемент (Link, button, клікабельний рядок, картка з `onClick`) **обов'язково** має `cursor-pointer` та hover-ефект.
- Hover-ефект не повинен просто змінювати opacity до 80% (це виглядає як disabled).
- **Для themed cards** (Blossom, Studio, Frost) використовуй `group` parent + overlay div:
  ```tsx
  <div className="group relative overflow-hidden ...">
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
         style={{ background: 'color-mix(in srgb, var(--accent-on) 8%, transparent)' }} />
    <span className="relative z-10">content</span>
  </div>
  ```

---

## 🎬 Animation Patterns (Framer Motion Rules)

### `mode="popLayout"` vs `mode="wait"`
- **`mode="wait"` заборонено** для блоків змінної висоти (таби, перемикачі списків).
- **Завжди використовуй `mode="popLayout"`**, щоб уникнути zero-height моменту під час зміни висоти контенту (запобігає стрибанню сусідніх елементів та сайдбару).
  ```tsx
  // ✅ ПРАВИЛЬНО
  <AnimatePresence mode="popLayout">
    <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
      {content}
    </motion.div>
  </AnimatePresence>
  ```

### Sliding Tab Indicator
Єдиний правильний паттерн для перемикачів та табів — анімований повзунок із `layoutId`:
```tsx
{isActive && (
  <motion.div layoutId="tab-indicator-UNIQUE_ID"
    className="absolute inset-0 rounded-full"
    style={{ background: 'var(--accent)' }}
    transition={{ type: 'spring' as const, duration: 0.35, bounce: 0 }}
  />
)}
```

---

## 💾 Persistence & Plurals
- **Ukrainian Plurals — ЗАВЖДИ `pluralUk`**: `pluralUk(n, 'запис', 'записи', 'записів')` з `@/lib/utils/pluralUk.ts`. Жодних ternary `n === 1 ? ... : ...`.
- **Автозбереження:** 500ms debounce для інпутів нотаток з індикатором "Зберігаємо...".

---
*Стандарт BookIT: Кожен клік має приносити задоволення.*
