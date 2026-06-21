# Sprint-04 Transition Prompt

> **ONE TASK = ONE SESSION** — залізне правило.
> Копіюй і вставляй на початку КОЖНОЇ нової сесії Sprint-04.

---

```
Привіт. Продовжуємо Sprint-04 BookIT.

═══ ОБОВ'ЯЗКОВИЙ STARTUP (виконай ДО будь-чого іншого) ═══
1. mempalace_status
2. Read XDEV/MAPS/SYSTEM_MAP.md (offset 510, limit 50)
3. Read XDEV/PLANS/SPRINT-04-BACKLOG/TRACKER.md — знайди ▶ NEXT рядок
4. Відповісти: "STARTUP OK: Palace [N] drawers | Next: T[N] — [назва]"

═══ ПОТОЧНИЙ СТАН ═══
Прогрес: 31/37 ✅ | Sprint-04 IN PROGRESS
Наступна: T31 — Smart Design System: Context-Adaptive UI
T30-v2 ✅ ЗАВЕРШЕНО (commit: 1b8d4e11):
  ✅ ProductEditor v2: bulk pricing (закупка→собівартість мл auto-calc), alert threshold, Step 2 service linking full-width
  ✅ ServiceEditor v2: повний CRUD vaul BottomSheet + X remove per row + empty state
  ✅ services/actions: removeServiceConsumableLink + addServiceConsumableLinks
  ✅ bookings/actions: stock alert post-decrement check
  ✅ StockWidget frost + FrostDashboard integration
  ✅ ExpensesTab: "Незабаром" placeholder
  ✅ Migration 145: purchase_unit/qty/price_kopecks на products
T30-ux ✅ ЗАВЕРШЕНО (commit: 94627928):
  ✅ ProductEditor: pre-select ?type=consumable, isConsumable, dynamic title, hide retail fields, unit suffix, price optional
  ✅ ProductsPage: "Додати розхідник" CTA + low-stock badge на Розхідники tab
  ✅ ConsumableCard: "+" → "Поповнити"
  ✅ ServiceEditor: inline "Змінити" link per consumable, видалено bottom note
T30 ✅ UX/UI ЗАВЕРШЕНО (commit: 1b1bfb8b):
  ✅ ConsumableCard + ConsumablesTab (3-й таб у ProductsPage)
  ✅ ProductEditor: unit selector pcs/ml/г
  ✅ MaterialsReviewSheet: vaul intercept при Завершити → qty review → completeBooking(id, reviewed)
  ✅ BookingCard + BookingActionsDropdown + BookingDetailsModal: consumables integration
  ✅ ServiceEditor: read-only розхідники блок
  ✅ ExpensesTab Pro-gate CRUD + RevenueHub Фінанси tab
  ✅ WaterfallChart 6-й бар operationalExpenses + FinancesTab 5 KPI cards
Деталі: XDEV/PLANS/SPRINT-04-BACKLOG/HANDOFF.md

T31 деталі (у HANDOFF.md):
  - useSmartTooltip(anchorRef, options) → viewport-aware { x, y, side }
  - FitText компонент: ResizeObserver + canvas.measureText() бінарний пошук
  - .adaptive-text CSS клас + useAdaptiveColor hook
  Скіл: spec-driven-workflow + senior-frontend + impeccable


═══ TASK GATE (обов'язково перед кодом) ═══
1. Read HANDOFF.md: деталі поточної задачі
2. mempalace_search по темі задачі (тема з TRACKER)
3. QA Gate: задати 3-5 уточнювальних питань
4. Оголосити SKILL: [назва] → одразу запустити Skill tool
5. UI рядки → /humanizer (якщо є нові)
6. Отримати ОК від юзера → тоді код

═══ ПІСЛЯ КОДУ ═══
□ npx tsc --noEmit (нуль помилок)
□ npm run build (clean)
□ vercel --prod
□ TRACKER.md: T[N] ⬜→✅, вписати commit hash
□ HANDOFF.md: додати секцію T[N] з деталями + root cause
□ TRANSITION_PROMPT.md: оновити "Наступна" → T[N+1]
□ mempalace_add_drawer
□ Повідомити юзера → він QA → підтверджує → наступна задача

═══ КОНТЕКСТ ═══
Root: C:\Users\Vitossik\SaaS\bookit\
Тема: Frost (єдина; Blossom/Studio = wip)
Stack: Next.js 16, TS strict, Tailwind v4, Supabase, Vaul
Скіли: 28 скілів у bookit/.claude/skills/
Повний план: XDEV/PLANS/SPRINT-04-BACKLOG/SPRINT-04-PLAN.md
Трекер: XDEV/PLANS/SPRINT-04-BACKLOG/TRACKER.md
Беклог оригінал: XDEV/PLANS/SPRINT-04-BACKLOG/BACKLOG.md
```

---
