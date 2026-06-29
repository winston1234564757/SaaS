# Task Brief — M-MKT-05 (+ M-MKT-06 bundled)

**Зона:** A. Зона Майстра · **Фаза 3** (інструменти росту)
**Тип:** NEW-FEATURE (inline) + REDESIGN (premium cards) — гібрид
**Тір:** 2 · **Модель:** Sonnet→Opus
**Скіли:** `senior-frontend` (inline Sheet) + `design-taste-frontend` + `impeccable` (redesign+colorize) + `humanizer` + `mcp__a11y`
**Рішення founder (AskUserQuestion):** Sheet-оверлей (reuse) · M-MKT-05+06 разом · видалити старий роут

---

## Контртеза до назви задачі (важливо)
«Статистика inline» **вже існує**: тап по картці розсилки розкриває грід аналітики
(Відправлено/Клікнуло/Записалось/Конверсія/Push/Telegram/Знижка) прямо в `BroadcastHistory.tsx`.
**Єдина функціональна діра M-MKT-05:** кнопка «Деталі по клієнтах» робить `router.push('/dashboard/marketing/${id}')`
— повноекранний редірект на `BroadcastDetailPage`. Це і прибираємо.

Готовий **мертвий** компонент `BroadcastDetailSheet.tsx` = ті самі per-client результати у vaul-Sheet,
але ніде не імпортується (дзеркало M-REV-03 `FlashDealDetailSheet`). Підключаємо його.

---

## Скоуп

### Частина 1 — M-MKT-05: inline-деталі (без редіректу)
1. `BroadcastHistory.tsx`: `onDetail → router.push` → локальний стан `detailId/detailTitle`
   → рендер `<BroadcastDetailSheet>` поверх списку. Прибрати `useRouter` (більше не потрібен).
2. Підключити мертвий `BroadcastDetailSheet` (вже написаний, лише імпорт+проп).
3. **Видалити** осиротілий роут `app/(master)/dashboard/marketing/[id]/page.tsx`
   + `components/master/marketing/BroadcastDetailPage.tsx` (єдиний споживач — рядок 59, прибирається).

### Частина 2 — M-MKT-06: преміальний редизайн + Frost-токени
Усі компоненти розсилок у легасі-хексах (peach-тема), а активна тема = **Frost**. Колоризація:
- `BroadcastHistory.tsx`:
  - `STATUS_MAP` хекси (`#A8928D`/`#D4935A`/`#5C9E7A`/`#C05B5B`) → Frost-токени (`--text-secondary`/`--warning`/`--success`/`--error`).
  - `StatCard` хекси (`#5C9E7A`/`#A8928D`/`#2C1A14`, `rgba(255,232,220,...)`) → токени (`--surface`/`--success`/`--foreground`).
  - Картка `rgba(255,255,255,0.68)` → `var(--surface)`; премі-полиш (impeccable): ієрархія, відступи, hairline.
- `BroadcastDetailSheet.tsx`: `#789A99`/`#5C9E7A`/`#4A9BE0`/`#D4935A`/`divide-[#F5E8E3]`/`#2C1A14`/`#C05B5B` → токени.
  Канали (App/Push/Telegram/SMS) — узгоджена палітра: семантика на токенах + Telegram-blue лишається впізнаваним.
- `BroadcastsTab.tsx`: Pro-банер indigo `rgba(99,102,241,...)` → `var(--accent-light)`/токени; шапка-полиш.

### Поза скоупом (свідомо)
- Бекенд: `getBroadcastAnalytics`/`getBroadcastDeliveryResults`/`sendBroadcast` НЕ чіпати — дані готові.
- `BroadcastEditor.tsx` / `BroadcastEditorPage.tsx` (форма створення) — окремий потік, не редизайн історії.

---

## Ризики
1. **a11y на periwinkle.** Урок M-GROW-01/M-REV-04: `text-success` #16803C провалює малий текст (3.45–3.89);
   кольорові цифри статів → перевірити `mcp__a11y`, при провалі число = `text-foreground`, колір лише на іконці/тінті.
2. **Висота акордеону.** `motion.div layout` + вкладений Sheet — Sheet поверх (overlay), не всередині `height:auto` блока → конфлікту немає.
3. **Видалення роуту.** Підтверджено: єдине посилання — `BroadcastHistory.tsx:59`. Deep-link на `/marketing/[id]` зникне (founder ОК).

---

## Перевірка
- `npx tsc --noEmit` = 0 · `npm run build` (Тір 2 → обов'язково) clean · encoding clean
- a11y: усі кольорові цифри/лейбли перевірені на `--surface` (#DAE2FF eff.)
- Новий UI-текст → `/humanizer` (легенда каналів, summary-лейбли, порожні стани)

## KEY
1. **Назва задачі ≠ реальний скоуп.** «Статистика inline» вже існувала (accordion-грід). Реальна діра M-MKT-05 = один `router.push` на per-client деталі. Звіряй живий компонент перед оцінкою обсягу — як і з backend-задачами (M-SHOP-03b урок утретє).
2. **Готовий мертвий компонент.** `BroadcastDetailSheet` був повністю написаний, але ніколи не імпортований (дзеркало M-REV-03). «Inline без редіректу» = підключити його (3 рядки стану), не писати новий.
3. **De-nesting = impeccable win.** Аналітика була nested cards (7 однакових StatCard) усередині картки — подвійний бан (nested cards + identical grid). Рефактор: 2 outcome-числа (Записалось/Конверсія) + тиха роздільна стрічка вторинних метрик. Без коробок-у-коробках.
4. **Канальна палітра Frost.** App=slate / Push=success / Telegram=#2563EB (впізнаваний бренд-синій, лишено навмисно) / SMS=warning. Усі іконки 3.89–4.01 на periwinkle (графічний поріг 3:1 ✓), сенс дублюється формою CheckCircle/XCircle — колір не несе одноосібно.
5. **Видалення роуту безпечне** коли grep підтверджує єдиного споживача. `.next/types` валідатор тимчасово ламає tsc на видалений роут — `npm run build` регенерує, tsc після build = 0.

**Перевірка:** tsc 0 (після build) · build clean (роут `/marketing/[id]` зник) · a11y MCP ✓ · encoding clean · impeccable-хук clean на всіх 3 файлах.
