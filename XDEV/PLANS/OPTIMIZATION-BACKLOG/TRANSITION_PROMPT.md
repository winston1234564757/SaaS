# TRANSITION PROMPT — OPTIMIZATION-BACKLOG

> Скопіюй у нову сесію після `STARTUP OK`.

---

## Контекст

Працюємо за окремим беклогом оптимізації: `XDEV/PLANS/OPTIMIZATION-BACKLOG/`.
Прочитай спершу: `HANDOFF.md` (стан, блокери, own-eyes рецепт, знайдені баги) → `TRACKER.md` → бриф конкретної задачі в `BRIEFS/`.

**Стан:** 7/18 ✅ · 1 ↩️ · 6 комітів на `main`, **не запушено**.

---

## Наступна задача: `OPT-ASSET-02`

**Тип:** MOTION · **Пріоритет:** P2 · **Бриф:** `BRIEFS/OPT-ASSET-02.md`

9× raw `<img>` → `next/image` з коректними `sizes`. Реальний виграш: CLS + payload на публічних поверхнях.

**Файли-кандидати:** `shared/wizard/ServiceSelector.tsx:138,345` · `shared/wizard/ServiceDetailSheet.tsx:77` · `shared/chat/ChatMessageList.tsx:109` · `shared/MobileHub.tsx:162` · `master/dashboard/SharePageCard.tsx:121` · `master/settings/widgets/PublicStatusWidget.tsx:171` · `master/billing/BillingPage.tsx:48` · `app/invite/[code]/page.tsx:160,240,311`

**НЕ чіпати** (blob/data-URL, `next/image` їх не оптимізує): `onboarding/steps/StepBasic.tsx:89`, `StepProfile.tsx:96`, `StoryCanvas`, crop-прев'ю, `AdminSupportConsole.tsx:395`.

**Ризики:** кожен випадок потребує `width/height` або `fill`+контейнер із розміром, інакше зламається лейаут. `sizes` має відповідати реальній ширині. Перевірити, що URL у whitelist `next.config.ts` (там уже `*.supabase.co`) — зовнішні хости кинуть runtime-помилку.

**Обовʼязково own-eyes** — це візуальна зміна. Рецепт рігу в `HANDOFF.md §Own-eyes рig`.

---

## Альтернативи, якщо ASSET-02 не на часі

- **Фаза 2 (DB/RPC)** — `OPT-DB-01/02/03/04/05/08`. Пишу міграції + код; **apply на прод робить founder** (harness блокує прод-write). SQL можна перевірити на локальній БД. Для `OPT-DB-03` рішення вже прийняте: **варіант A — lazy per-tab**.
- **`OPT-RND-04`** — віртуалізація. Розбити: `MastersDirectory` (admin, простіше) окремо від `ChatMessageList` (ризиково: reverse-scroll, stick-to-bottom, `popLayout`). Для чату розглянути `content-visibility: auto` як низькоризикову альтернативу.

---

## Правило цієї роботи

Аудит писався зі статичного читання і **тричі** виявився хибним або перебільшеним (ASSET-03 скасовано, DB-07 звужено 5→2, RND-05 звужено 6→3).

**Перед виконанням будь-якої задачі — перевір її передумову живим кодом.** Якщо передумова не тримається, скасуй або звузь задачу і зафіксуй чому. Не виконуй беклог наосліп.

---

## Не перепитувати (рішення прийняті)

Sheet blur = варіант C · Analytics DB-03 = варіант A (lazy per-tab) · `--color-error` = окрема задача, не в цьому беклозі · `OPT-EXPL-01` = ⏸ до after-launch, не форсити.
