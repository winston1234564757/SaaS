# STEP 03 — Onboarding Handoff (новий чат)

> **Дата:** 2026-05-29  
> **Попередня сесія:** StepPreview glassmorphism redesign + layout override  
> **Поточна сесія:** Три нових задачі (описані нижче)

---

## Що вже зроблено (не чіпати)

### 1. Layout override — прибрана оболонка дашборду
**Файл:** `bookit/src/app/(master)/layout.tsx` (рядки 84–101)

При `pathname.startsWith('/dashboard/onboarding')` layout повертає чистий `div` з Frost-градієнтом замість `DashboardLayout`. Жодних навбарів.

```tsx
if (isOnboarding) {
  return (
    <div data-theme="frost" style={{ minHeight: '100dvh', background: [...] }}>
      {children}
    </div>
  );
}
```

### 2. StepPreview — glassmorphism card
**Файл:** `bookit/src/components/master/onboarding/steps/StepPreview.tsx`

Повністю переписаний. Портретна картка (280×456, borderRadius 28, backdrop-blur 24px). Градієнтний аватар від імені (`nameToGradient()`), WCAG-contrast через `hexLuminance()`. Bento-тайли для послуг. URL-блок поза карткою.

### 3. BlobBackground — прибрано
**Файл:** `bookit/src/app/(master)/dashboard/onboarding/page.tsx`  
`BlobBackground` видалено — Blossom-кольори несумісні з Frost.

---

## ЗАДАЧА 1 — Баг: послуги зберігаються тільки для однієї спеціалізації

### Проблема
Коли юзер обирає кілька спеціалізацій (наприклад, `nails` + `massage`), в `StepServices` є tabs. Але `handleSave()` генерує послуги тільки для **активного таба** (`resolvedTemplateKey`). Послуги для решти спеціалізацій ніколи не потрапляють до `saveOnboardingServices`.

```ts
// StepServices.tsx рядок 83–87
const resolvedTemplateKey =
  serviceCategoryId ||
  selectedCategories.map(c => CAT_TO_TEMPLATE[c]).find(t => t && CATEGORY_TEMPLATES[t]) ||
  '';
const template = resolvedTemplateKey ? CATEGORY_TEMPLATES[resolvedTemplateKey] : null;
```

`handleSave()` (рядок 111–135) генерує послуги лише з `template` — одного шаблону.

### Рішення
Переробити UX: **замість одного shared base-price** — **окремий стан per-category**. Зберігати послуги для ВСІХ обраних спеціалізацій одним батчем.

#### Архітектурні зміни:

**a) State в OnboardingWizard** (`bookit/src/components/master/onboarding/OnboardingWizard.tsx`):
```ts
// Замість:
const [serviceCategoryId, setServiceCategoryId] = useState(...)
const [serviceBasePrice, setServiceBasePrice] = useState(...)
const [selectedServiceTypes, setSelectedServiceTypes] = useState(...)

// Зробити per-category:
const [categoryPrices, setCategoryPrices] = useState<Record<string, string>>(
  initialData.categoryPrices ?? {}
)
const [categoryServiceTypes, setCategoryServiceTypes] = useState<Record<string, Record<string, boolean>>>(
  initialData.categoryServiceTypes ?? {}
)
```

**b) StepServices props** — передавати `categoryPrices` + `categoryServiceTypes` замість одного `serviceBasePrice`.

**c) `handleSave` в StepServices** — ітерувати по ВСІХ `selectedCategories` + збирати послуги з кожного шаблону:
```ts
function handleSave() {
  const allServices: SavedService[] = [];
  for (const catId of selectedCategories) {
    const templateKey = CAT_TO_TEMPLATE[catId];
    if (!templateKey || !CATEGORY_TEMPLATES[templateKey]) continue;
    const tmpl = CATEGORY_TEMPLATES[templateKey];
    const basePrice = parseFloat(categoryPrices[catId] ?? '0') || 0;
    const types = categoryServiceTypes[catId] ?? { express: true, standard: true, premium: true };
    TIERS.filter(t => types[t.key] !== false).forEach(t => {
      const def = tmpl[t.key];
      const price = basePrice > 0 ? Math.round(basePrice * def.priceMult) : 0;
      if (price > 0) allServices.push({ name: def.name, emoji: '', price, durationMinutes: def.time });
    });
  }
  onSave(allServices);
}
```

**d) OnboardingData type** (`bookit/src/types/onboarding.ts`) — додати:
```ts
categoryPrices?: Record<string, string>;
categoryServiceTypes?: Record<string, Record<string, boolean>>;
```

**e) StepPreview** — оновити `buildPreviewServices()` щоб брати послуги з `categoryPrices/categoryServiceTypes` замість одного `serviceBasePrice`.

---

## ЗАДАЧА 2 — Превью-мокап: відповідність реальному дизайну

### Референс
`C:\Users\Vitos\SaaS\image.png` — зображення показує як має виглядати публічна сторінка майстра.

### Що показує референс:
- Round аватар з верифікаційним значком
- Ім'я + спеціалізація (дві через кому: "Стрижка, Масаж")
- Рядок "Записатися — відправитися до 09:00"
- **Графік роботи** — компактна таблиця з днями (Пн–НД) з часом 09:00–18:00
- **Послуги** — секція з лейблом "Основні послуги", тайли з іконкою (emoji), назвою послуги, тривалістю та ціною праворуч з бейджем

### Що треба зробити в StepPreview
**Файл:** `bookit/src/components/master/onboarding/steps/StepPreview.tsx`

Замінити поточний "bento-tiles" блок послуг на реалістичніший вигляд:
1. **Schedule mini-table** всередині картки — показувати дні тижня (Пн–НД) і час. Брати з пропа `schedule`.
2. **Services list** — реалістичні тайли з emoji + назва + тривалість + ціна (як на публічній сторінці), а не просто кольорові bento-плашки.
3. **Структура картки** (зверху вниз):
   - Аватар (round, 64px) + ім'я + verified badge
   - Спеціалізація
   - Рейтинг-рядок
   - `---` separator
   - "Графік роботи" label + компактний schedule
   - `---` separator  
   - "Послуги" label + service tiles

Картка залишається тією ж glassmorphism (280×456, backdrop-blur 24px). Змінюється тільки **вміст**.

---

## ЗАДАЧА 3 — Інпут редагування slug (адреса публічної сторінки)

### Де додати
**StepPreview** (`bookit/src/components/master/onboarding/steps/StepPreview.tsx`) — в URL standalone блоці (рядки 313–347).

### Поточний стан
URL-блок зараз показує URL лише для читання + кнопки "Копіювати" / "Відкрити".

### Що треба
Зробити slug **редагованим**. UX:
1. Кнопка "редагувати" (олівець, `Pencil` з Lucide) поруч з URL
2. Натискання переводить у режим інлайн-редагування — `<input>` з поточним slug
3. Валідація: тільки `[a-z0-9-]`, мінімум 3 символи, максимум 32
4. При blur або Enter — зберігати через `saveOnboardingProgress` + новий server action `updateSlug`
5. Error state якщо slug зайнятий (перевірити через Supabase: `maybeSingle()` на `master_profiles.slug`)

### Server Action для оновлення slug
**Файл:** `bookit/src/app/(master)/dashboard/onboarding/actions.ts`

Додати:
```ts
export async function checkAndUpdateSlug(slug: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизований' };

  // Перевірити що slug вільний
  const { data: existing } = await supabase
    .from('master_profiles')
    .select('id')
    .eq('slug', slug)
    .neq('id', user.id)
    .maybeSingle();
  
  if (existing) return { error: 'Цей нік вже зайнятий' };
  
  const { error } = await supabase
    .from('master_profiles')
    .update({ slug })
    .eq('id', user.id);
  
  return { error: error?.message ?? null };
}
```

### Props
`StepPreview` вже отримує `slug`. Потрібно додати `onSlugChange: (newSlug: string) => void` проп і пробросити через `OnboardingWizard`.

---

## Ключові файли (short-list)

| Файл | Що змінювати |
|---|---|
| `bookit/src/components/master/onboarding/OnboardingWizard.tsx` | Змінити state (per-category prices/types), пробросити нові пропи |
| `bookit/src/components/master/onboarding/steps/StepServices.tsx` | Рефактор handleSave для всіх категорій |
| `bookit/src/components/master/onboarding/steps/StepPreview.tsx` | Контент картки (schedule + реалістичні послуги) + slug editing |
| `bookit/src/app/(master)/dashboard/onboarding/actions.ts` | Додати `checkAndUpdateSlug` |
| `bookit/src/types/onboarding.ts` | Додати `categoryPrices` + `categoryServiceTypes` |

---

## Архітектурний контекст

- Route: `/dashboard/onboarding` — `(master)` route group
- Theme: завжди `data-theme="frost"` (встановлюється в layout + useEffect в OnboardingWizard)
- Збереження прогресу: `saveOnboardingProgress(step, data)` — upsert в `profiles.onboarding_data`
- Анімація кроків: Framer Motion `AnimatePresence mode="popLayout"` + spring `{ stiffness: 320, damping: 28 }`
- Правило Lucide: ніколи `style` prop → `<span style={{color}}>` обгортка
- Правило Tailwind v4: `@import "tailwindcss"` в globals.css, no tailwind.config.ts

---

## Послідовність роботи

1. Спочатку зробити **ЗАДАЧУ 1** (баг критичний — дані втрачаються)
2. Потім **ЗАДАЧА 3** (slug editing — простіша, в межах StepPreview)
3. Потім **ЗАДАЧА 2** (preview redesign — потребує змін контенту картки)
4. Після всіх трьох — TSC + build + mempalace_add_drawer + оновити STATUS.md

---

## Post-Change Protocol

```bash
cd bookit
npx tsc --noEmit
npm run build
```

Після — `mempalace_add_drawer` з ключовими рішеннями. Оновити `XDEV/RELEASE/STATUS.md` (Step 03 прогрес).
