# Sprint-03 Transition Prompt

> **ONE TASK = ONE SESSION** — залізне правило.
> Копіюй і вставляй на початку КОЖНОЇ нової сесії Sprint-03.

---

```
Привіт. Продовжуємо Sprint-03 BookIT.

═══ ОБОВ'ЯЗКОВИЙ STARTUP (виконай ДО будь-чого іншого) ═══
1. mempalace_status
2. Read XDEV/MAPS/SYSTEM_MAP.md (offset 200, limit 60)
3. Read XDEV/PLANS/SPRINT-03-BACKLOG/TRACKER.md — знайди перший ▶ NEXT рядок
4. Відповісти: "STARTUP OK: Palace [N] drawers | Next: T[N] — [назва]"

═══ ПОТОЧНИЙ СТАН ═══
Прогрес: 16/18 ✅
Виконано: T15 T1 T10 T4 T3 T2 T5 T8 T6c T6a T6b T9 T12 T13 T14
Наступна: T11 — Флеш-акції: повний аудит + тести
Brief: XDEV/PLANS/SPRINT-03-BACKLOG/T11_BRIEF.md

═══ TASK GATE (обов'язково перед кодом) ═══
1. Read Brief файл: XDEV/PLANS/SPRINT-03-BACKLOG/T11_BRIEF.md
2. mempalace_search "flash actions quick-actions dashboard frost"
3. QA Gate: задати 3-5 питань (готові питання є в Brief файлі)
4. SKILL: impeccable → запустити Skill tool
5. UI рядки → /humanizer якщо є нові
6. Отримати ОК від юзера → тоді код

═══ ПІСЛЯ КОДУ ═══
□ npx tsc --noEmit (нуль помилок)
□ npm run build (clean)
□ vercel --prod
□ TRACKER.md: T13 ⬜→✅, вписати commit hash
□ HANDOFF.md: додати секцію T13 з деталями
□ TRANSITION_PROMPT.md: оновити "Наступна" → T14 + Brief → T14_BRIEF.md
□ mempalace_add_drawer
□ Повідомити юзера → він QA → підтверджує → наступна T14

═══ КОНТЕКСТ ═══
Root: C:\Users\Vitossik\SaaS\bookit\
Тема: Frost (єдина; Blossom/Studio = wip)
Stack: Next.js 16, TS strict, Tailwind v4, Supabase, Vaul
Повний план: XDEV/PLANS/SPRINT-03-BACKLOG/SPRINT-03-PLAN.md
Всі Brief файли: T13_BRIEF.md, T14_BRIEF.md, T11_BRIEF.md, T16_BRIEF.md, T7_BRIEF.md
```

---

## Залишилось у Sprint-03

| # | ID | Назва | Brief |
|---|----|-------|-------|
| 15 | ~~T13~~ | ~~Онбординг: крок графіку~~ | ✅ b1735d5 |
| 16 | ~~T14~~ | ~~Онбординг: виразний блок посилання~~ | ✅ 4fc56d6 |
| 17 | **T11** ▶ | Флеш-акції: повний аудит + тести | [T11_BRIEF.md](T11_BRIEF.md) |
| 16 | T11 | Флеш-акції: повний аудит | [T11_BRIEF.md](T11_BRIEF.md) |
| 17 | T16 | Тур: підсвічування елементів | [T16_BRIEF.md](T16_BRIEF.md) |
| 18 | T7 | Налаштування профілю (ч.2) | [T7_BRIEF.md](T7_BRIEF.md) |

---

## Як оновлювати після кожної ітерації

Після завершення T[N] → оновити цей файл:
```
Наступна: T[N+1] — [назва]
Brief: XDEV/PLANS/SPRINT-03-BACKLOG/T[N+1]_BRIEF.md

В TASK GATE:
1. Read Brief файл: XDEV/PLANS/SPRINT-03-BACKLOG/T[N+1]_BRIEF.md
2. mempalace_search "[ключові слова з Brief]"
3. QA Gate: [питання з Brief]
4. SKILL: [скіл з Brief]
```

Також оновити:
- **TRACKER.md** → ⬜→✅ + commit hash
- **HANDOFF.md** → нова секція з деталями
- **XDEV/TASK.md** → прогрес [N]/19
