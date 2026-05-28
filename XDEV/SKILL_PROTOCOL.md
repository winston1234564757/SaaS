# SKILL_PROTOCOL.md — Майстер-Інструкція по Скілах

> **Статус:** Авторитетний документ рівня `CLAUDE.md`.
> **Закон:** Перед кожною дизайн або код ітерацією обов'язково пройти Decision Tree, отримати відповіді на уточнювальні питання та оголосити скіл. Без матчу зі скілом жодна ітерація не починається.

---

## 🧬 ЗАЛІЗНЕ ПРАВИЛО ІТЕРАЦІЇ
```
1. Отримати задачу від користувача.
2. Прочитати цей файл ➔ визначити відповідний скіл.
3. Задати 3–5 уточнювальних питань (згідно з CLARIFICATION_FRAMEWORK.md).
4. Оголосити: "Запускаю [skill] тому що [причина]".
5. Виконати роботу.
6. Провести аудит за допомогою скілів-аудиторів (impeccable / code-reviewer / humanizer).
7. QA сесія з користувачем.
```
**Ніколи не пропускати кроки 2–4. Ніколи.**

---

## 🌳 DECISION TREE — Вибір Скіла

```
Задача прийшла
│
├─ ДИЗАЙН / UI / КОМПОНЕНТ / СТОРІНКА?
│   ├─ Треба ЗОБРАЖЕННЯ/КОНЦЕПТ (не код)?
│   │   ├─ Web ➔ imagegen-frontend-web
│   │   └─ Mobile ➔ imagegen-frontend-mobile
│   │
│   ├─ Є СКРІНШОТ ➔ треба перенести у код?
│   │   └─ image-to-code
│   │
│   ├─ АПГРЕЙД існуючої сторінки/компонента?
│   │   └─ redesign-existing-projects
│   │
│   ├─ АУДИТ / КРИТИКА / POLISH існуючого UI?
│   │   └─ impeccable
│   │
│   ├─ АНІМАЦІЇ / FRAMER MOTION / мікро-взаємодії?
│   │   └─ emil-design-eng
│   │
│   ├─ СКЛАДНИЙ UX / багато варіантів стилю?
│   │   └─ ui-ux-pro-max
│   │
│   └─ ГЕНЕРАЦІЯ НОВОГО UI-КОДУ (більшість задач)?
│       └─ Будь-який стиль, преміум ➔ design-taste-frontend (PRIMARY)
│
├─ ТЕКСТ / КОПІРАЙТ / LABEL?
│   └─ humanizer (ЗАВЖДИ — навіть для одного слова)
│
├─ КОД / АРХІТЕКТУРА / РЕАЛІЗАЦІЯ?
│   ├─ React / Next.js компоненти, хуки ➔ senior-frontend
│   ├─ Backend / API / Server Actions ➔ senior-backend
│   ├─ Next.js специфіка (routing, cache, RSC) ➔ nextjs-best-practices
│   ├─ Anthropic SDK / Claude API ➔ claude-api
│   ├─ Ревʼю / безпека / якість ➔ code-reviewer
│   ├─ Безпека (окремий аудит API/Webhooks/RLS) ➔ security-review
│   ├─ Рефакторинг / simplify ➔ simplify
│   └─ Повний вивід без обрізання ➔ full-output-enforcement (ДОДАТИ до основного)
│
└─ ІНФРАСТРУКТУРА / КОНФІГ?
    ├─ Запустити / перевірити в браузері ➔ run ➔ verify
    ├─ Налаштувати settings.json, hooks ➔ update-config
    ├─ Scheduled tasks / cron ➔ schedule
    └─ PR review ➔ review
```

---

## 🎨 КАТАЛОГ Core Skills (The Seven Identities)

#### `design-taste-frontend` ★★★★★ (PRIMARY UI)
- **Роль:** Senior UI/UX Engineer. Генерує преміальний UI-код.
- **Коли:** Будь-який новий компонент, сторінка, тема.
- **Стилі BookIT:** Blossom (Taupe Light Air), Studio (Teal Brutal Dark), Frost (Ice Lavender) — передавати параметри теми через prompt.
- **Ланцюг:** `clarify ➔ design-taste-frontend ➔ emil-design-eng (якщо анімація) ➔ impeccable ➔ humanizer`

#### `impeccable` ★★★★★ (Design QA)
- **Роль:** Design Critic. 27 детерміністичних правил проти anti-patterns.
- **Коли:** ЗАВЖДИ після будь-якої дизайн-генерації.
- **Виявляє:** card-in-card nesting, слабка ієрархія, generic шрифти, слабкий контраст, зайві shadows.

#### `emil-design-eng` ★★★★ (Animation Engineer)
- **Роль:** Motion Engineer. Філософія Emil Kowalski — деталі що роблять UI живим.
- **Коли:** Анімації входу/виходу, micro-interactions, Framer Motion polish.
- **Правила BookIT:** `mode="popLayout"` (не `wait`), spring з `bounce: 0–0.12`, `layoutId` для табів.

#### `ui-ux-pro-max` ★★★★ (Elite Aesthetics)
- **Роль:** UX Architect. Вибір складних палітр, шрифтових пар та UX-сіток.
- **Коли:** Складні UX-рішення з кількома варіантами, коли треба вибрати між підходами.

#### `humanizer` ★★★★★ (Copywriting)
- **Роль:** Робить мову живою, видаляє AI-штампи.
- **Коли:** ЗАВЖДИ перед записом будь-якого тексту у файл (крім aria-label, форматів дат, console.log).
- **Заборонені слова:** "revolutionize", "leverage", "empower", "unlock potential", "seamlessly".

#### `code-reviewer` ★★★★★ (Code Quality)
- **Роль:** Security & Quality Audit.
- **Коли:** ЗАВЖДИ перед комітом або після будь-якої нетривіальної реалізації.
- **Фокус:** strict mode, RLS, safe queries, prevention of auth loop memory leaks.

#### `security-review` ★★★★ (Security Specialist)
- **Роль:** Security Audit.
- **Коли:** Payments (Monobank webhook), auth flows, cron endpoints, admin routes.

---

## 🛠️ ДОДАТКОВІ СКІЛИ (References & Utilities)

- **`redesign-existing-projects`:** Перехід з generic AI-шаблонів на преміум дизайн без зламу логіки.
- **`imagegen-frontend-web` / `imagegen-frontend-mobile`:** Генерація зображень/концептів (не коду).
- **`image-to-code`:** Скріншот/mockup ➔ точний React-код.
- **`senior-frontend` / `senior-backend`:** Реалізація логіки, хуків, API та RLS політик.
- **`nextjs-best-practices`:** App Router, RSC, caching, `src/proxy.ts`.
- **`simplify`:** Очищення коду від overengineering та дублювання.
- **`full-output-enforcement`:** Запобігання обрізанню великих файлів коду (додавати до основного скіла).
- **`verify` / `run`:** Запуск dev server та перевірка результату в браузері.

---

## 🔄 ОБОВ'ЯЗКОВІ ЛАНЦЮГИ

```
ДИЗАЙН-ЛАНЦЮГ (нова сторінка/компонент):
clarify ➔ design-taste-frontend ➔ [emil-design-eng?] ➔ impeccable ➔ humanizer (текст) ➔ QA

ТЕКСТ-ЛАНЦЮГ:
драфт ➔ humanizer ➔ записати у файл

КОД-ЛАНЦЮГ (нова фіча):
clarify ➔ senior-frontend/backend ➔ [simplify?] ➔ code-reviewer ➔ [security-review?] ➔ QA

АПГРЕЙД-ЛАНЦЮГ:
redesign-existing-projects ➔ impeccable ➔ humanizer ➔ QA
```

---
*Останнє оновлення: 2026-05-24 · Версія: 8.2.0*
