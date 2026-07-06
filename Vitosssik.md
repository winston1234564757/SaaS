# Vitos.md — Твій особистий довідник по роботі з AI-системою BookIT

> Це інструкція для тебе (власника кодової бази).  
> CLAUDE.md та папка XDEV говорять Claude що робити. Цей файл говорить тобі, як з ним взаємодіяти.

---

## 🤖 Що відбувається АВТОМАТИЧНО (завдяки хукам)

Ти просто пишеш повідомлення Claude — і хуки автоматично запускають перевірки та додають контекст:

| Що | Хук | Опис |
|---|---|---|
| **DEV RULES + TASK.md** | `UserPromptSubmit` `dev_rules_hook.py` | Iron Rules, QA-GATE з task-type routing (bug/feature/DB → різні скіли), TASK.md задачі |
| **Skill Router (257 скілів)** | `UserPromptSubmit` `skill_router_hook.py` | Автоматично обирає категорію та топ-скіл з 257 по ключових словах промпту і шляху файлу |
| **Context7 / MCP Hints** | `UserPromptSubmit` `context7_hint_hook.py` | Детектує бібліотечні ключові слова → підказує context7, supabase MCP, vercel CLI, gh CLI |
| **Session Start** | `SessionStart` `session_start_hook.py` | Graphify hot-files + TRACKER прогрес + поточна задача з HANDOFF + startup protocol |
| **Graphify Auto-Rebuild** | `PreToolUse` (Glob/Grep) `graphify_hook.py` | Оновлює граф залежностей і підказує GOD_NODES.md |
| **Encoding Guard** | `PreToolUse` (Edit/Write) `env_guard_hook.py` | Блокує запис якщо виявлено cp1251 mojibake |
| **Humanizer Guard** | `PreToolUse` (Edit/Write) `humanizer_guard_hook.py` | Попереджає якщо UI-текст не пройшов /humanizer |
| **Edit Counter** | `PreToolUse` (Edit/Write) `edit_counter_guard.py` | Рахує зміни сесії для session-end звіту |
| **MemPalace Checkpoint** | `PostToolUse` (Edit/Write) `post_edit_hook.py` | Нагадує зберегти рішення в `mempalace_add_drawer` |
| **Session End (diary)** | `Stop` `self_improving_hook.py` | ЗАВЖДИ diary_write; якщо edits≥1 → add_drawer + sprint pipeline + git+vercel check |
| **Skill Guard** | `Stop` `skill_guard_hook.py` | Перевіряє чи скіл оголошений текстом — також викликаний як tool call |

---

## 🛠️ Що потрібно робити ВРУЧНУ

### 1. Початок нового спринту
1. Відкрий та онови [TASK.md](file:///C:/Users/Vitos/SaaS/XDEV/TASK.md) — запиши туди поточні завдання спринту (Claude зчитає їх автоматично на першому промпті).
2. Запусти Claude Code і дай йому завдання.

### 2. Створення нового коду (компоненти/роути/хуки)
Після додавання нових файлів або імпортів онови граф залежностей:
```bash
cd bookit
npx graphify
```
*Без цього навігаційний індекс GOD_NODES.md буде показувати застарілі шляхи.*

### 3. Ручний сейв пам'яті (за потреби)
Якщо Claude зробив складний архітектурний фікс, але забув викликати сейв, ти можеш написати в чат:
```
/save
```

---

## 📁 Структура документації проєкту

```
C:\Users\Vitos\SaaS\
├── CLAUDE.md              ← Головна точка входу для Claude (правила та команди)
├── IRON_RULES.md          ← 3 залізних закони сесії (Humanizer, Encoding, Palace)
├── DESIGN.md              ← Філософія трьох тем та дизайн-принципи
├── PRODUCT.md             ← Цільова аудиторія, голос бренду та антиреференси
├── Vitos.md               ← Цей файл
├── XDEV/                  ← Вся робоча технічна документація
│   ├── TASK.md            ← Задачі поточного спринту (ти оновлюєш)
│   ├── SKILL_PROTOCOL.md  ← Майстер-інструкція по скілах (Decision Tree, ланцюжки)
│   ├── AI_MASTER_GUIDE.md ← Майстер-Конституція розробника та вхідний брифінг
│   └── MAPS/              ← Архітектурні мапи (SYSTEM_MAP, UI_MAP...)
└── bookit/
    ├── src/app/globals.css ← Джерело колірних змінних для Blossom/Studio/Frost
    └── graphify-out/
        └── GOD_NODES.md   ← Навігаційний індекс файлів
```

---

## 🧪 Основні розробницькі команди (з папки `bookit/`)

```bash
npm run dev                    # Запуск dev-сервера (Turbopack)
npm run build                  # Production build (перевірка перед деплоєм)
npx tsc --noEmit               # Швидка перевірка TypeScript
npm test                       # Запуск юніт-тестів (Vitest)
npm run test:e2e               # Запуск Playwright e2e тестів (з сидом БД)
npx supabase db push           # Застосувати міграції до Supabase Cloud
```

---

## 💡 Якщо щось пішло не так

- **Cyrillic encoding corruption (кракозябри):** Claude пошкодив кодування файлу. Інструкція з відновлення лежить у `XDEV/ENCODING_FIX_PROMPT.md`.
- **Claude ігнорує скіли або пише код без плану:** Нагадай йому про **QA-GATE** ("спочатку онови plan, потім пиши код").
- **Claude "забув" архітектуру попередніх сесій:** Скажи йому: *"знайди в palace [тема]"*. У довгостроковій пам'яті MemPalace накопичено понад 11,000+ drawers.

---
*Останнє оновлення: 2026-06-16 · Версія: 10.0.0 · v10 hooks (13 Python scripts, 257 skills routing)*
