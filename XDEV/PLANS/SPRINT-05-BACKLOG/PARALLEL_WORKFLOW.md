# Sprint-05 PARALLEL_WORKFLOW — Мультиагентне виконання

> Розширення `WORKFLOW.md`, не заміна. Тут — ТІЛЬКИ те, що додає паралелізм.
> Базові гейти (mempalace, бриф, humanizer, tsc/build, типи задач, тіри) лишаються з `WORKFLOW.md`.
>
> **Статус:** DESIGN (затверджено founder 2026-06-25) · воркери ще не запускались.
> **Рішення founder:** batch-QA по хвилі · один деплой на хвилю · пілот = 2 воркери, різні зони.

---

## 0. Навіщо і де межа виграшу

Паралелізм дає виграш **лише** коли:
1. Задачі **file-disjoint** (різні зони — див. §2).
2. Задачі досить великі, щоб окупити холодний старт воркера (mempalace + SYSTEM_MAP + бриф наново). → **Тільки Tier 1-2.**
3. Founder приймає **batch-QA**: оглядає хвилю разом, не по одній.

**Антипатерни (НЕ паралелити):**
- Tier 0 (COPY, дрібний CSS) — швидше інлайн в оркестраторі, холодний старт не окупиться.
- Дві задачі однієї зони (напр. два `M-DASH-*`) — гарантований merge-конфлікт.
- Будь-що, що чіпає **shared-файли** (§2.1) — серіалізувати в оркестраторі.

---

## 0.5 Скіли машинерії (вже встановлені — НЕ качати нічого)

Оркестрацію забезпечують ДВА вже наявні скіли. Маркетплейсний `orchestration/ORCHESTRATION.md` — дженерик бізнес-патерн, НЕ використовуємо.

- **`context-window-management`** — координація паралельних хвиль: marker-line protocol (§4), launch-turn barrier (Фаза B), 8 антипатернів (оркестратор НЕ переказує прозу воркера; артефакти через `artifact_id`, не через діалог).
- **`subagent-driven-development`** — диспетч свіжого субагента на задачу + рев'ю після кожної + широке фінальне рев'ю.

Оркестратор завантажує `context-window-management` на старті хвилі. Для рев'ю змердженого коду — `subagent-driven-development` патерн (task-review + final-review).

**Авто-нудж:** хук `.claude/hooks/orchestrator_skill_hook.py` (UserPromptSubmit) детектить ключові слова (хвил/паралель/оркестр/воркер/worktree/subagent/мультиагент) і інжектить нагадування завантажити ці два скіли ДО спавну воркерів. Хук не викликає Skill сам — лише нудж у контекст. Вимкнути/глянути: `/hooks`.

---

## 1. Ролі

### Оркестратор = ця головна сесія
Володіє і робить **сам, ніколи не делегує**:
- `TRACKER.md` / `HANDOFF.md` / `TRANSITION_PROMPT.md` / `TASK.md` — єдиний письменник.
- `git merge` worktree-гілок воркерів.
- Спільний `npm run build` після merge всієї хвилі.
- `vercel --prod` — один на хвилю.
- Людський QA-гейт із founder (бриф-апрув ДО хвилі, QA-огляд ПІСЛЯ деплою).
- `mempalace_add_drawer` по кожній закритій задачі.
- Tier 0 задачі — робить інлайн, без воркера.

### Воркер = `Agent(isolation: "worktree")`, один на задачу
Робить у власному worktree:
- Власний startup (mempalace_status → SYSTEM_MAP → бриф своєї задачі).
- Бриф → код → `npx tsc --noEmit` → `npm run build` (у своєму worktree).
- Спеціаліст-скіли своєї задачі (колонка TRACKER) + humanizer на свій UI-текст.
- Повертає **структурований звіт** (§4), НЕ деплоїть, НЕ чіпає файли трекінгу.

**Воркер ніколи не торкається:** TRACKER/HANDOFF/TRANSITION/TASK, інших зон, shared-файлів §2.1, `git push`, `vercel`.

---

## 2. Disjoint-карта зон (вісь паралелізму)

Правило: **одна зона = максимум один воркер у хвилі.** Зони = піддиректорії `src/components/master/*` + маршрути.

| Зона | Корінь файлів | Задачі Sprint-05 |
|------|---------------|------------------|
| `DASH` | `components/master/dashboard/*` + `widgets/frost/*` | M-DASH-07, 08, 09 |
| `CLI` | `components/master/clients/*` | M-CLI-01..05 |
| `BOOK` | `components/master/bookings/*` | M-BOOK-01..05, M-ORD-01 |
| `SVC` | `components/master/services/*` | M-SVC-02, 03 |
| `SHOP` | `components/master/products/*` | M-SHOP-01, 02, 03 |
| `REV` | `components/master/revenue/*` | M-REV-01..06 |
| `GROW` | `components/master/growth/` + `loyalty/` + `referral/` + `partners/` | M-GROW-01, 02 |
| `MKT` | `components/master/marketing/*` | M-MKT-01..06 |
| `REVW` | `components/master/reviews/*` | M-REVW-01, 02 |
| `ANL` | `components/master/analytics/*` | M-ANL-01 |
| `SET` | `components/master/settings/*` | M-SET-01..05 |
| `BILL` | `components/master/billing/*` | M-BILL-01, 02 |
| `PORT` | `components/master/portfolio/*` | M-PORT-01, 02 |
| `DOCHELP` | `documents/` + `support/` + `academy/` | M-DOC-01, M-HELP-01, 02 |
| `CLIENT` | `app/my/*` + `app/explore/*` + client components | усі `C-*` (УВАГА §2.2) |
| `LAND` | landing components | G-LAND-01, 03 |

**Хвиля = до N задач з N РІЗНИХ рядків цієї таблиці.**
Приклад валідної хвилі-2: `M-DASH-09` (DASH) + `M-SET-01` (SET).
Приклад НЕвалідної: `M-DASH-07` + `M-DASH-08` (обидві DASH).

### 2.1 Shared-файли — EXCLUSIVE (ніколи в паралель)
Якщо задача чіпає будь-що з цього — вона йде **соло в оркестраторі**, не у воркері:
- `app/globals.css` (3-тема токени — будь-яка колоризація ризикує сюди)
- `components/master/DashboardLayout.tsx`, `DashboardTopBar.tsx`, `BentoBottomNav`
- `components/shared/ScrollStrip*` (G-PWA-02 парасолька)
- `app/layout.tsx`, `app/(master)/layout.tsx`, `src/proxy.ts`
- `lib/utils/pluralUk.ts`, `lib/utils/token.ts`
- client `MyBottomNav`, спільні client-лейаути

> Перед формуванням хвилі оркестратор робить **dry-scope**: для кожної задачі-кандидата Grep по її ймовірних файлах. Якщо перетин зон АБО торкання §2.1 — задача вибуває з хвилі.

### 2.2 Застереження по `CLIENT`
`C-*` задачі ділять `app/my/layout.tsx`, `MyBottomNav`, спільні client-картки. Усередині `CLIENT` паралелізм майже неможливий — трактувати як ОДНУ зону (один C-воркер на хвилю максимум), а `C-NAV-01`/`C-EXPL-01` (чіпають навбар/лейаут) = exclusive соло.

---

## 3. Життєвий цикл хвилі

```
ФАЗА A — ПЛАНУВАННЯ ХВИЛІ (оркестратор + founder)
  A1. Обрати задачі-кандидати з TRACKER (різні зони, Tier 1-2)
  A2. Dry-scope: Grep файлів кожної → підтвердити disjoint + нема §2.1
  A3. Для кожної: mempalace_search + написати BRIEFS/[ID].md (DRAFT)
  A4. ОДИН AskUserQuestion з усіма брифами хвилі → founder APPROVE/правки
      (батч, не серійно — відповіді = апрув брифів)

ФАЗА B — ПАРАЛЕЛЬНЕ ВИКОНАННЯ (воркери) [launch-turn barrier]
  B1. Спавнити ВСІХ N воркерів в ОДНОМУ turn, Agent(isolation:"worktree",
      run_in_background:true), один task на воркера. Ніколи не мерджити в
      тому ж turn, що й спавн (barrier з context-window-management).
  B2. Кожен: startup → skill → код → tsc → build → marker-line звіт (§4)
  B3. Оркестратор НЕ полить — чекає нотифікацій про завершення, потім реконсайл

ФАЗА C — ІНТЕГРАЦІЯ (оркестратор, СЕРІАЛЬНО)
  C1. Merge worktree-гілок ПО ОДНІЙ. Конфлікт → §5.
  C2. Після всіх merge: ОДИН npm run build на об'єднаному дереві
  C3. tsc --noEmit clean
  C4. vercel --prod (ОДИН на хвилю)

ФАЗА D — ЗАКРИТТЯ (оркестратор + founder)
  D1. Batch-QA: показати founder усю хвилю (що змінилось, превʼю)
  D2. founder підтверджує АБО повертає конкретні задачі у фікс
  D3. Per task: TRACKER ⬜→✅ + commit hash, HANDOFF секція, mempalace_add_drawer
  D4. TRANSITION_PROMPT + TASK.md → наступна черга
  D5. git commit "docs(sprint-05): wave[K] done — TRACKER X/76"
```

> Якщо одна задача хвилі провалила QA (D2) — решта хвилі вже задеплоєна і закрита; провалена відкочується/фікситься окремою mini-хвилею. Деплой хвилі НЕ блокується однією задачею, бо вони file-disjoint.

---

## 4. Контракт звіту воркера (marker-line protocol)

Формат із `context-window-management`. Воркер завершує ОСТАННІМ рядком рівно:

```
ROLE_DONE {"task":"[task-id]","status":"complete|partial|failed","branch":"<branch>","tsc":"clean|fail","build":"clean|fail"}
```

Оркестратор парсить регексом `ROLE_DONE\s+(\{[^\n]+\})` і маршрутизує ТІЛЬКИ по цьому маркеру, не по прозі (антипатерн #1). Перед маркером — людиночитна частина (її оркестратор не переказує, лише чіпляє в HANDOFF):

```
WORKER REPORT [task-id]
FILES: <список змінених файлів>
SKILLS: <які скіли застосовано>
HUMANIZER: <before/after для нового UI-тексту, або N/A>
SUMMARY: <2-4 рядки що зроблено>
ROOT-CAUSE: <для BUGFIX — у чому була причина>
RISKS: <що оркестратору перевірити при merge>
DECISIONS: <для mempalace_add_drawer — ключові рішення>
```

Ліміти (антипатерни context-window-management): SUMMARY ≤ 2000 знаків.
`status:partial|failed` → воркер не вгадує, у RISKS пише питання; оркестратор вирішує або ескалює founder.

---

## 5. Merge-протокол і конфлікти

- Merge **по одній гілці**, у порядку від найменшого diff до найбільшого (дрібні ризики першими).
- Disjoint-карта (§2) має робити конфлікти неможливими за конструкцією. **Конфлікт = баг планування хвилі**, не норма:
  - Конфлікт у зональному файлі → дві задачі однієї зони потрапили в хвилю помилково. Зафіксувати в ретроспективі §7.
  - Конфлікт у §2.1 shared-файлі → задача мала бути exclusive. Відкотити її merge, доробити соло.
- Оркестратор резолвить вручну, НЕ просить воркера. Воркер уже завершений (cold).
- Якщо merge тривіальний (різні файли) — git зливає автоматично, оркестратор лише валідує build.

---

## 6. Що НЕ змінюється (успадковано з WORKFLOW.md)

- Типи задач і тіри (COPY/MOTION/BUGFIX/REDESIGN/DATA/NEW-FEATURE).
- Бриф перед кодом для всього, крім COPY.
- humanizer на весь UI-текст. Скріншот для REDESIGN/MOTION.
- Post-change: tsc обовʼязково, build за тіром.
- Encoding-check перед Edit/Write Cyrillic-файлів.
- Iron Rules CLAUDE.md.

**Єдині свідомі послаблення (ухвалені founder):**
- `ONE TASK = ONE SESSION` → `ONE WAVE = ONE INTEGRATION CYCLE`.
- `one task = one deploy` → `one wave = one deploy`.
- Per-task QA → batch-QA по хвилі.

---

## 7. Ретроспектива (заповнювати після кожної хвилі)

| Хвиля | Задачі | Воркерів | Конфлікти | Холодний старт окупився? | Урок |
|-------|--------|----------|-----------|--------------------------|------|
| 1 (2026-06-25) | M-DASH-09 + M-SET-01 | 2 (Sonnet+Haiku) | 1 base-vs-worker (НЕ worker-vs-worker) | ~break-even (217s паралельно vs 365s посл.) + знайдено фікс | **worktree baseRef='fresh' бранчить від origin/main, не локального HEAD** → застаріла база при unpushed комітах. Фікс: `baseRef:'head'` у settings.json. Disjoint-зони вистояли. Воркери без node_modules → код+commit, build лише в оркестратора. |

> Метрика успіху пілота: хвиля-2 закрита швидше, ніж ті ж 2 задачі послідовно, БЕЗ merge-конфліктів і БЕЗ регресій на QA. Якщо ні — машинерія дорожча за виграш, повертаємось до послідовного на дрібних задачах.

---

*Created: 2026-06-25 · Розширює WORKFLOW.md · Узгоджено: founder*
