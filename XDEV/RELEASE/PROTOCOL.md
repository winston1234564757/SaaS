# 🔁 PROTOCOL.md — Workflow одного чату (= одного кроку)

> Цей протокол виконується від першого хіду чату до `STEP NN COMPLETE`.
> Порушення кроків — порушення Iron Rules.
> Версія: 1.0 · Створено: 2026-05-27

---

## ⏱️ Фази чату

```
┌──────────────────────────────────────────────────────────────┐
│  PHASE 0: SESSION START         (перший хід, ~60 секунд)     │
│  PHASE 1: TASK GATE (QA)        (clarify 3-5 Q, declare skill)│
│  PHASE 2: EXECUTION             (7 Quality Gate dimensions)  │
│  PHASE 3: VERIFICATION          (tsc, build, tests, manual)  │
│  PHASE 4: CLOSE-OUT             (docs sync, drawer, handoff) │
└──────────────────────────────────────────────────────────────┘
```

---

## PHASE 0 — SESSION START (IRON RULE -1)

**Виконати в першому хіду, до будь-чого іншого:**

```
1. Call mempalace_status                            (tool call, обов'язково)
2. Read XDEV/MAPS/SYSTEM_MAP.md (last 50 lines)     (з offset)
3. Read XDEV/RELEASE/STATUS.md                      (який крок активний)
4. Read XDEV/RELEASE/STEPS/STEP_NN_*.md             (playbook активного)
5. Reply: "STARTUP OK: Palace [N] drawers | SYSTEM_MAP current | Active Step: NN ([page]) | Model: [Opus/Sonnet]"
```

**Без STARTUP OK — жодного коду, жодних file reads для задачі.**

---

## PHASE 1 — TASK GATE (IRON RULE 1, 2, 0.5)

### 1.1 MemPalace search
```
mempalace_search "[step keywords + page name + key features]"
```
**Мета:** знайти попередні рішення, баги, патерни що стосуються цієї сторінки.

### 1.2 QA Gate — clarification (3-5 питань)
Використовувати [bookit/.claude/CLARIFICATION_FRAMEWORK.md](../../bookit/.claude/CLARIFICATION_FRAMEWORK.md).

**Стандартний шаблон для дизайн-задач:**
1. Scope: вся сторінка чи конкретні секції?
2. Aesthetic: пріоритет полішингу (емодзі/типографіка/motion)?
3. Themes: всі 3 (Blossom/Studio/Frost) одразу чи по черзі?
4. Motion: куди додати animation/polish?
5. Priority: high-impact чи косметика?

**Стандартний шаблон для код-задач:**
1. Focus: performance / security / architecture / quality?
2. Scope: одна функція / компонент / повна фіча?
3. Context: яка проблема / бажаний результат?
4. Severity: critical bug / tech debt / improvement?
5. Output: код / звіт / refactor plan?

### 1.3 Skill declaration (IRON RULE 2)
- Обрати скіл за [SKILL_PROTOCOL.md](../SKILL_PROTOCOL.md) Decision Tree.
- **Оголосити в тексті** `SKILL: [name]` + **в тій самій відповіді** викликати Skill tool.
- Zero tolerance: text без Skill tool call = протокол-violation.

### 1.4 Humanizer list (IRON RULE 0.5)
Виписати ВСІ UI-рядки що зміняться/додадуться:
- Кнопки, лейбли, плейсхолдери, заголовки, повідомлення, empty states, toast
- **Виключення:** `aria-label`, `data-testid`, формати дат (`HH:mm`), технічні enum (`pending`, `confirmed`)
- Запустити `/humanizer` з цим списком, отримати humanized версії.

### 1.5 User approval
Дочекатися explicit OK від користувача.

### 1.6 GATE OK confirmation
```
GATE OK: search✓ | QA✓ | Skill: [name] | Humanizer: [confirmed/N/A]
```
**Тільки тоді — відкривати файли і писати код.**

---

## PHASE 2 — EXECUTION (7 Quality Gate dimensions)

Виконати playbook кроку з [STEPS/STEP_NN_*.md](./STEPS/) — поетапно по 7 вимірах.

### Послідовність роботи (рекомендовано)
```
1. Aesthetics & Themes      → візуальна основа спершу
2. No-Emoji Policy          → паралельно зі стилями
3. Motion & Transitions     → після візуалу
4. Errors & Validation      → структурна частина
5. A11y & Performance       → перевірочна частина
6. Core Features            → найскладніше, з perевіркою бізнес-логіки
7. Tests Verification       → перед close-out
```

### Інструменти на ходу
- **Token Efficiency:** Grep before Read, з offset (RULE із AI_DEVELOPER.md)
- **MemPalace search:** перед прийняттям рішень (RULE -1)
- **DB-to-DOM thinking:** DB Layer → Server Action → UI (з AI_ONBOARDING.md)

### Збереження прогресу
- Після кожного значущого фрагменту коду — короткий commit (не амальгамувати дні).
- Зміна публічного API → одразу update [../MAPS/SYSTEM_MAP.md](../MAPS/SYSTEM_MAP.md).

---

## PHASE 3 — VERIFICATION (IRON RULE 3)

### 3.1 Static checks (обов'язково)
```bash
cd bookit
npx tsc --noEmit        # zero errors
npm run lint            # zero errors або documented
npm run build           # Next.js builds clean
```

### 3.2 Tests
```bash
npm test                                # Vitest unit (зелено)
npm run test:e2e -- --grep "<step name>" # Playwright E2E для кроку
```

### 3.3 Manual verification
- Запустити `npm run dev`, перевірити в браузері (3 теми × mobile/desktop).
- Виконати функціональний аудит з playbook (Core Features section).

### 3.4 Verification report
Сформулювати в чаті:
```
VERIFICATION:
- tsc: ✅ 0 errors
- build: ✅ success
- vitest: ✅ N/N pass
- playwright: ✅ N/N pass (e2e/tests/XX.spec.ts)
- manual: ✅ all 7 dimensions checked
```

---

## PHASE 4 — CLOSE-OUT (документація + handoff)

### 4.1 Документація — обов'язкова синхронізація

| Файл | Що оновити |
|---|---|
| [STATUS.md](./STATUS.md) | Статус → ✅ Complete, дата ready, hash коміту, drawer ID |
| [CHANGELOG.md](./CHANGELOG.md) | Новий entry: дата, scope, файли, ключові рішення |
| [../MAPS/SYSTEM_MAP.md](../MAPS/SYSTEM_MAP.md) | Нові routes/components/RPCs/hooks |
| [../MAPS/PAGE_RELEASE_ROADMAP.md](../MAPS/PAGE_RELEASE_ROADMAP.md) | Status кроку → ✅ |
| `bookit/src/app/(master)/dashboard/changelog/page.tsx` | B2B-видимі зміни (якщо є) |

### 4.2 MemPalace drawer (RULE 3)
```
mempalace_add_drawer:
  - title: "[Page] Quality Gate Complete — [date]"
  - wing: "bookit"
  - room: "architecture" | "technical"
  - content: ключові рішення + чому + посилання на коміти + skill chain
```

### 4.3 Git commit
```bash
git add <files>
git commit -m "feat(page-N): [Page] quality gate complete

[Опис ключових змін у 1-2 реченнях]

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### 4.4 Handoff note (наступному чату)
Додати в [STATUS.md](./STATUS.md) під активним кроком:
```
HANDOFF for STEP NN+1:
- Prior step closed: YYYY-MM-DD
- Open issues from prior step: [none / list]
- Carry-over: [нічого / pending items]
- Next chat focus: [STEP NN+1 page]
```

### 4.5 Final reply
```
STEP NN COMPLETE
- Quality Gate: 7/7 dimensions ✅
- Tests: green
- Documentation: synced
- Drawer: [drawer_id]
- Commit: [hash]
- Next: STEP NN+1 ([page]) — see STATUS.md
```

---

## 🚨 Anti-patterns цього процесу

| ❌ ЗАБОРОНЕНО | ✅ ПРАВИЛЬНО |
|---|---|
| Пропустити SESSION_START | Завжди починати з RULE -1 |
| Писати код без GATE OK | Спочатку clarify → skill → humanizer → user OK |
| Один чат = декілька кроків | Один чат = один крок (Крок 8 = exception з explicit split) |
| Skip-крок ("повернусь потім") | Або ✅ COMPLETE, або ⚠️ NEEDS REVISION, або 🔒 BLOCKED |
| Закрити чат без sync доку | Документація = частина close-out, не "after" |
| `git commit --no-verify` | Hooks треба respect — fix root cause |
| Запускати `--amend` | Завжди новий коміт (RULE з CLAUDE.md) |
| Маркувати ✅ без tests | Tests частина 7 dimensions |

---

## 🔄 Перехід між кроками

### Якщо все ОК
```
1. STEP NN COMPLETE (в поточному чаті)
2. Закрити чат
3. Новий чат → SESSION_START → STATUS.md показує STEP NN+1 active
4. Створити STEP_NN+1_xxx.md (якщо ще немає) з TEMPLATE.md
```

### Якщо знайдено блокер
```
1. Update STATUS.md: STEP NN → ⚠️ NEEDS REVISION (з описом)
2. mempalace_add_drawer з описом блокера
3. Не переходити до NN+1, поки NN не ✅
```

### Якщо external dependency
```
1. Update STATUS.md: STEP NN → 🔒 BLOCKED (з зовнішньою причиною)
2. Документувати очікувану розблокувальну дію (e.g., "Vercel Pro upgrade")
3. Дозволено почати NN+1 в новому чаті, якщо NN+1 не залежить від NN
```

---

*Версія: 1.0 · Створено: 2026-05-27 · Узгоджується з IRON_RULES.md та SKILL_PROTOCOL.md*
