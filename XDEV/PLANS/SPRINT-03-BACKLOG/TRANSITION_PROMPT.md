# Sprint-03 Transition Prompt

> Копіюй і вставляй на початку КОЖНОЇ нової сесії Sprint-03.

---

```
Привіт. Продовжуємо Sprint-03 BookIT.

ОБОВ'ЯЗКОВИЙ STARTUP (виконай ДО будь-чого іншого):
1. mempalace_status
2. Read XDEV/MAPS/SYSTEM_MAP.md (offset 200, limit 60)

3. Read XDEV/PLANS/SPRINT-03-BACKLOG/HANDOFF.md — знайди перший ⬜ TODO
4. Read XDEV\PLANS\SPRINT-03-BACKLOG\initial_plan.md - для контексту
5. Тут моєю мовою описано: XDEV/PLANS/SPRINT-03-BACKLOG/BACKLOG.md

Після startup відповісти: "STARTUP OK: Palace [N] drawers | SYSTEM_MAP current | Next: T[N] — [назва]"

Поточний стан (з HANDOFF.md):
- 3/18 виконано: T15 ✅ DONE, T1 ✅ DONE, T10 ✅ DONE
- Наступна: T4 — Studio білінг: форма + баг сабміту

T4 деталі:
- Файли: BillingPage.tsx, billing/actions.ts
- Проблема: 4 підпроблеми:
  1. Прибрати блок «Коли вигідніше» (рядки 393-412 в BillingPage.tsx)
  2. Текст кнопки → humanizer: co-creation «моїми руками»
  3. Телефон підтягувати з профілю майстра (не TG/email)
  4. submitBetaRequest() не зберігає — тільки спінер, помилка «Не вдалося зберегти»
- Скіл: code-reviewer + humanizer
- Humanizer: ТАК — кнопка beta-request

GATE перед кодом:
1. mempalace_search "billing beta request submit studio"
2. QA: задай 2-3 уточнення якщо потрібно
3. SKILL: code-reviewer → запусти Skill tool
4. GATE OK → код

Після коду:
- npx tsc --noEmit (нуль помилок)
- npm run build (clean)
- vercel --prod
- Оновити HANDOFF.md: T4 ⬜ → ✅, вписати commit hash
- mempalace_add_drawer
- Повідомити юзера → він QA → наступна задача T3

Воркфлоу: ОДНА задача = ОДИН deploy. Після deploy повідомляй.

Контекст:
- Root: C:\Users\Vitossik\SaaS\bookit\
- Активна тема: Frost (єдина, Blossom/Studio = wip)
- Stack: Next.js 16, TS strict, Tailwind v4, Supabase, Vaul
- Повний план: XDEV/PLANS/SPRINT-03-BACKLOG/SPRINT-03-PLAN.md
```

---

## Як оновлювати після кожної ітерації

Після завершення T[N]:
1. У **HANDOFF.md** → змінити `⬜ TODO` → `✅ DONE`, вписати commit hash
2. У **TRANSITION_PROMPT.md** → оновити "Поточний стан" + "T[N+1] деталі"
3. У **TASK.md** → оновити прогрес N/18
4. Закомітити: `git add XDEV/PLANS/SPRINT-03-BACKLOG/ XDEV/TASK.md`
