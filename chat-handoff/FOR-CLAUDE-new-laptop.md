# Інструкція для Claude Code на НОВОМУ ноуті — завершити міграцію BookIT + відновити чат

Ти — Claude Code, запущений на **новому** ноуті (Windows, користувач `Vitos`). Раніше на
старому ноуті (користувач `Vitos`) велася сесія «Migration»: ми переносили робоче
оточення BookIT. Твоя задача — **довести перенос до кінця, перевірити його і підготувати
відновлення того діалогу**.

Правила: працюй крок за кроком, ПЕРЕВІРЯЙ стан перед кожною дією, нічого не припускай.
Усі шляхи бери від `$env:USERPROFILE` (має бути `C:\Users\Vitos`). Якщо профіль інший —
скажи людині й став уточнення, не вгадуй.

## Що вже зроблено до тебе (на старому ноуті)
- Код + XDEV → git, гілка `migration-checkpoint` (github.com/winston1234564757/SaaS).
- Секрети, `~/.claude` config, `.mempalace` (28k+ drawers) → у zip-бандлі
  (`bookit-migration-2026-07-03.zip`, на USB / Робочому столі).
- Транскрипт цього чату + скрипти + ця інструкція → у git під `chat-handoff/`.
- Ім'я користувача змінилось `Vitos → Vitos` — прибиті шляхи треба виправити (`fix-paths.py`).

---

## Кроки

### 1. Git — підтягнути все
```powershell
cd $env:USERPROFILE\SaaS
git fetch origin
git checkout migration-checkpoint
git pull --ff-only
```

### 2. Переконайся, що бандл розкладено
Мають існувати:
- `$env:USERPROFILE\SaaS\.env` та `$env:USERPROFILE\SaaS\bookit\.env.local` (+ ще 6 .env)
- `$env:USERPROFILE\.claude\CLAUDE.md` та `$env:USERPROFILE\.claude.json`
- `$env:USERPROFILE\.mempalace\palace\mempalace.yaml`

Якщо чогось немає — ЗУПИНИСЬ і попроси людину розпакувати `bookit-migration-2026-07-03.zip`
та розкласти файли (повна розкладка — `chat-handoff\MIGRATION.md`, розділи §2, §4, §5).
Не вигадуй вміст секретів.

### 3. Виправ прибиті шляхи (Vitos → Vitos)
```powershell
python $env:USERPROFILE\SaaS\chat-handoff\fix-paths.py
```
Переписує config/код/хуки, перейменовує memory-папки, чистить `.jsonl`. Ідемпотентний.

### 4. Залежності (якщо `bookit\node_modules` немає)
```powershell
cd $env:USERPROFILE\SaaS\bookit
npm install
npx playwright install
```

### 5. Перевірка — ціль 0 FAIL
```powershell
powershell -ExecutionPolicy Bypass -File $env:USERPROFILE\SaaS\chat-handoff\verify-migration.ps1
```
Розбери КОЖЕН FAIL. `WARN` на `gh auth` та `supabase MCP OAuth` — це нормально до re-auth (крок 7).

### 6. Поклади транскрипт чату в теку сесій проєкту
```powershell
$dst = "$env:USERPROFILE\.claude\projects\C--Users-Vitos-SaaS-bookit"
New-Item -ItemType Directory -Force $dst | Out-Null
Copy-Item "$env:USERPROFILE\SaaS\chat-handoff\8381b8cc-c684-4d2d-8ddd-c3bfc04ff314.jsonl" $dst -Force
```
(Це найсвіжіший транскрипт з git; він перезапише старіший знімок із бандла, якщо той був.)

### 7. Re-auth (інтерактивне — попроси людину виконати)
- `gh auth login` — GitHub.com, HTTPS
- Supabase MCP авторизується сам при першому виклику інструмента
- Claude Code вже залогінений, якщо ця твоя сесія працює

### 8. Передай естафету на відновлення діалогу
**Важливо: ти — НЕ та сама сесія.** Щоб продовжити саме той діалог, людина має вийти
з поточної сесії й запустити:
```powershell
cd $env:USERPROFILE\SaaS\bookit
claude --resume        # обрати "Migration" зі списку
```
Скажи це людині прямо. Не вдавай, ніби ти вже той відновлений чат.

### 9. Прибрати тимчасове (ПІСЛЯ успішного `--resume`)
```powershell
cd $env:USERPROFILE\SaaS
git rm -r chat-handoff
git commit -m "chore: прибрати chat-handoff після відновлення сесії"
```

---

## Наприкінці
Коротко відзвітуй людині: що OK, що WARN/FAIL, і нагадай запустити `claude --resume`,
щоб продовжити нашу нитку розмови. Далі — за протоколом BookIT (`STARTUP OK`:
`mempalace_status` + `SYSTEM_MAP.md`).
