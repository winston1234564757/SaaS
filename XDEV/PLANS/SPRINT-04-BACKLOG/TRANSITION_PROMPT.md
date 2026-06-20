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
Прогрес: 28/37 ✅ | Sprint-04 IN PROGRESS
Наступна: T30 — Розхідники: UX/UI реалізація
T29 ✅ BACKEND ЗАВЕРШЕНО (commit: 82e04e7d):
  ✅ Міграції 142-144: products.unit, product_service_links.quantity→NUMERIC, master_expenses+RLS
  ✅ types/database.ts: Product.unit, MasterExpense, ReviewedConsumable, FinanceAnalytics.operational_expenses_total
  ✅ expenses.actions.ts: createExpense/updateExpense/deleteExpense/getExpenses
  ✅ completeBooking(id, reviewedConsumables?): stock deduction + product_transactions
  ✅ useExpenses + useConsumablesForBooking hooks
  ✅ get_finance_analytics RPC: +operational_expenses_total у return
Деталі: XDEV/PLANS/SPRINT-04-BACKLOG/HANDOFF.md


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
