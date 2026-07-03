# DESIGN-SYSTEM-BACKLOG — конвергенція на дизайн-мову BookIT

> Окремий бек-лог однієї наскрізної роботи: **перевести весь застосунок на дизайн-мову**, народжену з C-CLI-01 (картка клієнта+запису, founder 10/10).
> Не плутати зі SPRINT-05-BACKLOG (загальний продуктовий беклог). Тут — тільки редизайн-конвергенція.

---

## Що це

Після C-CLI-01 (03.07) зафіксовано канон дизайн-мови і зроблено фундамент-кіт. Далі — розкат по всіх поверхнях проєкту. Кожна поверхня = окрема REDESIGN-задача за WORKFLOW (ONE TASK = ONE SESSION).

## Джерела істини (читати ПЕРЕД будь-якою DS-задачею)

| Файл | Роль |
|------|------|
| [XDEV/DESIGN_LANGUAGE.md](file:///C:/Users/Vitos/SaaS/XDEV/DESIGN_LANGUAGE.md) | **Спека.** Закон темного/білого блоку · on-dark контраст-рамп · токени · кіт примітивів · бани |
| [XDEV/PLANS/DESIGN_SYSTEM_ROLLOUT.md](file:///C:/Users/Vitos/SaaS/XDEV/PLANS/DESIGN_SYSTEM_ROLLOUT.md) | **Мапа розкату** — фази P1–P5 (звідки виведено задачі) |
| [BRIEFS/C-CLI-01.md](file:///C:/Users/Vitos/SaaS/XDEV/PLANS/SPRINT-05-BACKLOG/BRIEFS/C-CLI-01.md) | **Еталон реалізації** (концепт «Досьє» + variant cover/inline) |
| [SPRINT-05-BACKLOG/WORKFLOW.md](file:///C:/Users/Vitos/SaaS/XDEV/PLANS/SPRINT-05-BACKLOG/WORKFLOW.md) | Task-типи, Тіри, пре-код ритуал, гейти |

## Кіт примітивів (`bookit/src/components/ui/`)

- `EditorialCover` — темний блок-герой (один на поверхню)
- `Section` — білий блок-тіло (hairline-хедер + диференційоване тіло)
- `Button` / `Badge` — під мову (`surface="light|dark"`)
- `Sheet` — `srTitle` коли обкладинка володіє ідентичністю
- Видалено: `BentoCard` (мертвий анти-патерн)

## Як користуватись

1. Новий чат → встав `TRANSITION_PROMPT.md`.
2. Візьми ▶ NEXT з `TRACKER.md`.
3. Task Gate: mempalace_search → живий код + скрін → бриф `BRIEFS/DS-*.md` → ОК founder → скіли → код.
4. Гейти: рендер власними очима (прев'ю-роут поза auth + Playwright) → a11y MCP → humanizer → TSC:0/build → founder QA → ship-gate.
5. Після здачі: TRACKER ✅ + TRANSITION нотатка + mempalace_add_drawer.

## Статус

Див. [TRACKER.md](./TRACKER.md). Прогрес рахується там.
