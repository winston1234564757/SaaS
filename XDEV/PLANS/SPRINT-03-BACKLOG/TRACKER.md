# Sprint-03 TRACKER
> Живий статус. Оновлюється після кожної ітерації (⬜→✅).
> Деталі виконаного: `HANDOFF.md` | Повний план + acceptance: `SPRINT-03-PLAN.md` | Session brief: `T##_BRIEF.md`

**Прогрес:** 17/18 ✅ | **Розпочато:** 2026-06-09 | **Оновлено:** 2026-06-11

| Іт | ID | Назва | Статус | Скіл | Commit | Brief |
|----|----|-------|--------|------|--------|-------|
| 1 | T15 | Тема Frost за замовчуванням | ✅ DONE | code-reviewer | 3454e0f + 9865942 + 3e1390b | — |
| 2 | T1 | Баги сторінки Записи | ✅ DONE | code-reviewer | a3bfed2 + 06c791c + 81e75c9 | — |
| 3 | T10 | Клієнти: пігулки перекривають текст | ✅ DONE | code-reviewer | 86aa48a | — |
| 4 | T4 | Studio білінг: форма + баг сабміту | ✅ DONE | code-reviewer + humanizer | cb41655 + 8f2ee05 | — |
| 5 | T3 | Налаштування профілю: горизонт. скрол | ✅ DONE | code-reviewer | cdc410a | — |
| 6 | T2 | Дашборд: статистика мобайл + пік-годин + рефералки | ✅ DONE | impeccable + humanizer | 1de90ec + bee63a0 | — |
| 7 | T5 | Конструктор сторіс: анімована стрілка | ✅ DONE | impeccable | 3ed6e4b | — |
| 8 | T8 | Навбар: профіль праворуч + FAB + сповіщення | ✅ DONE | design-taste-frontend | f3107c4 + 620473f + c282e27 | — |
| 9 | T6c | Аналітика десктоп: навігація дат + слайдер | ✅ DONE | design-taste-frontend | ddcf28d | — |
| 10 | T6a | Десктоп лейаут: billing + reviews + growth | ✅ DONE | design-taste-frontend | d184b9e + c282e27 | — |
| 11 | T6b | Десктоп лейаут: revenue + marketing + products + services | ✅ DONE | design-taste-frontend | 60b980c | — |
| 12 | T9 | Портфоліо → конструктор сторіс | ✅ DONE | code-reviewer | f80ef35 | — |
| 13 | T12 | Лояльність: два коди + двосторонній C2B бонус | ✅ DONE | code-reviewer + create-migration | a42386f + 0b44cd6 | — |
| 14 | T13 | Онбординг: крок графіку (Налаштувати/Продовжити) | ✅ DONE | impeccable | b1735d5 | [T13_BRIEF.md](T13_BRIEF.md) |
| 15 | T14 | Онбординг: виразний блок посилання | ✅ DONE | impeccable | 4fc56d6 | [T14_BRIEF.md](T14_BRIEF.md) |
| 16 | **T11** | **Флеш-акції: повний аудит** | ✅ DONE | code-reviewer + react-doctor | 8d284bd | [T11_BRIEF.md](T11_BRIEF.md) |
| 17 | **T16** | **Тур: підсвічування елементів (spotlight)** | **▶ NEXT** | design-taste-frontend + emil-design-eng | — | [T16_BRIEF.md](T16_BRIEF.md) |
| 18 | T7 | Налаштування профілю (ч.2 — незакрите) | ⚠️ PARTIAL | impeccable | eebf5b7 + b81ca4c + 10383f4 | [T7_BRIEF.md](T7_BRIEF.md) |

---

## ⚠️ Pending post-deploy
- `npx supabase db push` — міграція `20260607000000_security_search_path_fix.sql` (19 RPC search_path functions)
- Vercel Pro → cron `0 * * * *` для check-uncompleted

## Воркфлоу: ONE TASK = ONE SESSION
1. Відкрити Brief файл поточної задачі (колонка Brief вище)
2. Виконати startup: `mempalace_status` → `SYSTEM_MAP` → `TRACKER.md`
3. QA Gate → Skill → код → tsc → build → deploy
4. Після deploy: оновити TRACKER.md + HANDOFF.md + TRANSITION_PROMPT.md
