# Bookit — перенесення на новий ноут (Windows → Windows)

Дата збірки: 2026-07-03. Старий ноут: користувач `Vitos`, корінь `C:\Users\Vitos\SaaS`.

> **Головне попередження.** Купа конфігів має **прибиті абсолютні шляхи** `C:\Users\Vitos\...`
> (CLAUDE.md, hooks, .claude.json, MEMORY.md посилання). Найпростіший безшовний варіант —
> завести на новому ноуті Windows-користувача з іменем **`Vitos`**. Тоді правок 0.
> Якщо ім'я інше — доведеться grep-заміна (див. §7).

Порядок кроків важливий. Виконуй згори вниз.

---

## 0. Встанови інструменти на новому ноуті

| Інструмент | Версія на старому | Де взяти |
|-----------|-------------------|----------|
| Node.js   | **v24.16.0** (major 24 обов'язково) | nodejs.org або nvm-windows |
| npm       | 11.16.0 (їде з Node) | — |
| Git       | 2.52.x | git-scm.com |
| GitHub CLI (`gh`) | latest | cli.github.com |
| Claude Code | latest | — |
| Chrome + «Claude in Chrome» extension | — | для browser-MCP |

---

## 1. Код (через git clone — НЕ з бандла)

```powershell
# створи батьківську папку, назви ТОЧНО SaaS
mkdir C:\Users\Vitos\SaaS
cd C:\Users\Vitos\SaaS
git clone https://github.com/winston1234564757/SaaS.git .

# незавершена дизайн-робота лежить в окремій гілці:
git checkout migration-checkpoint
```

Гілка `migration-checkpoint` містить WIP дизайн-системи (globals.css токени, EditorialCover,
Section, ClientDossierHero, dossier-preview) + свіжі XDEV-доки. `main` лишається чистим.
Коли доробиш — змержиш у main сам.

---

## 2. Секрети (.env) — з бандла

Скопіюй вміст папки `secrets/` поверх репо, ЗБЕРІГАЮЧИ структуру:

```
secrets\SaaS\.env                          → C:\Users\Vitos\SaaS\.env
secrets\SaaS\.env.local                    → C:\Users\Vitos\SaaS\.env.local
secrets\bookit\.env.local                  → ...\SaaS\bookit\.env.local
secrets\bookit\.env.prod                   → ...\SaaS\bookit\.env.prod
secrets\bookit\.env.test                   → ...\SaaS\bookit\.env.test
secrets\bookit\.env.test.runtime           → ...\SaaS\bookit\.env.test.runtime
secrets\bookit\.env.vercel                 → ...\SaaS\bookit\.env.vercel
secrets\bookit\.vercel\.env.production.local → ...\SaaS\bookit\.vercel\.env.production.local
```

Ці файли gitignored — тому їх немає в clone, тільки тут.

---

## 3. Залежності

```powershell
cd C:\Users\Vitos\SaaS\bookit
npm install
npx playwright install    # e2e-тести + dossier-shot.mjs рендер
```

---

## 4. Глобальний Claude config — з бандла (папка `claude-global/`)

Копіюй у `C:\Users\Vitos\.claude\`:

```
claude-global\CLAUDE.md              → C:\Users\Vitos\.claude\CLAUDE.md
claude-global\settings.json          → C:\Users\Vitos\.claude\settings.json
claude-global\settings.local.json    → C:\Users\Vitos\.claude\settings.local.json
claude-global\agents\      (папка)   → C:\Users\Vitos\.claude\agents\
claude-global\commands\    (папка)   → C:\Users\Vitos\.claude\commands\
claude-global\mcp-wrappers\(папка)   → C:\Users\Vitos\.claude\mcp-wrappers\
claude-global\skills\      (папка)   → C:\Users\Vitos\.claude\skills\
claude-global\plugins\     (папка)   → C:\Users\Vitos\.claude\plugins\
claude-global\projects\    (папка)   → C:\Users\Vitos\.claude\projects\   (це auto-memory / MEMORY.md)
```

Окремо — MCP-реєстрація і trust проєктів:

```
claude-global\dot-claude.json  →  C:\Users\Vitos\.claude.json
```

> Файл переіменований на `dot-claude.json` щоб не загубився. На новому ноуті клади його
> як `.claude.json` (з крапкою, у корінь профілю користувача, НЕ в папку .claude).

---

## 5. MemPalace (28k+ drawers) — з бандла

```
mempalace\  (весь вміст)  →  C:\Users\Vitos\.mempalace\
```

Перевір: у Claude Code виконай `mempalace_status` — має показати 28,000+ drawers.
Якщо порожньо — MCP-сервер не бачить дані; перевір шлях у `.claude.json`.

---

## 6. Git identity

```powershell
git config --global user.name  winston1234564757
git config --global user.email viktor.koshel24@gmail.com
```

---

## 7. Виправлення шляхів (ім'я нового користувача = `Vitos`, НЕ `Vitos`)

Прибиті шляхи `C:\Users\Vitos\...` є в 100+ файлах. Критичні (зламають запуск):
`SaaS\.claude\settings.json` (18 хуків), `SaaS\.claude\hooks\*.py`, `~\.claude.json`,
`SaaS\CLAUDE.md`, глобальний `.claude\settings.json`.

**НЕ роби це PowerShell-заміною** — вона псує кирилицю (cp1251 mojibake). Використай
`fix-paths.py` з бандла — він UTF-8-безпечний, пропускає не-utf8 файли, не додає BOM,
ідемпотентний (можна запускати повторно).

Порядок (ВАЖЛИВО — тільки ПІСЛЯ кроків 1,4,5, коли все вже на місцях):

```powershell
# 1) поклади fix-paths.py в корінь профілю (або будь-куди)
# 2) запусти:
python C:\Users\Vitos\<куди-поклав>\fix-paths.py
```

Що робить:
- **[A]** міняє `Vitos` → `Vitos` у текстових файлах під `C:\Users\Vitos\SaaS` +
  `C:\Users\Vitos\.claude` + `~\.claude.json`;
- **[B]** перейменовує папки auto-memory `~\.claude\projects\C--Users-Vitos-*` →
  `C--Users-Vitos-*` (інакше Claude Code не знайде MEMORY.md — ім'я папки це
  закодований старий шлях).

Пропускає node_modules, .git, DEPRECATED, plugins, skills, .mempalace.
Виводить звіт. Ідемпотентний — можна запускати повторно.

> `.mempalace` навмисно НЕ чіпається — сервер знаходить дані через `~/.mempalace`
> автоматично, а шляхи всередині drawer-ів косметичні.
>
> Альтернатива без правок взагалі: заведи Windows-користувача з іменем `Vitos`.
> Але раз обрано `Vitos` — просто прожени скрипт.

Після скрипта репо буде «брудним» у git (hook-шляхи змінились) — це очікувано,
НЕ комітай ці зміни в main (вони машинно-специфічні).

---

## 8. Re-auth (НЕ переноситься — токени в keyring/OAuth)

```powershell
gh auth login          # GitHub.com, HTTPS
```
- Claude Code: `/login`
- Supabase MCP: OAuth-вікно відкриється при першому виклику інструмента
- Vercel: `vercel login` (якщо користуєшся CLI; проект: sqlrxsopllgztvgrerqk)

SSH-ключів на старому ноуті НЕ було (все через HTTPS+gh) — нічого переносити.

---

## 9. Фінальна перевірка

Спершу автоматична перевірка (read-only, нічого не змінює):

```powershell
powershell -ExecutionPolicy Bypass -File .\verify-migration.ps1
# з перевіркою збірки:
powershell -ExecutionPolicy Bypass -File .\verify-migration.ps1 -Build
```

Має бути **0 FAIL**. Скрипт перевіряє: Node 24 / npm / git / gh / python, репо+гілку,
git identity, усі 8 .env, node_modules+next, весь `.claude` config, memory-папки
(перейменовані), mempalace, **gh auth** (залогінено + scope repo), **supabase MCP**
(конфіг + project_ref + OAuth + доступність endpoint), і що `fix-paths.py` відпрацював
(немає залишків `Vitos`).

Примітка: одразу після переносу `gh auth` і `supabase MCP OAuth` будуть WARN — це
нормально, вони авторизуються на кроці re-auth (§8) / при першому виклику в Claude Code.

Якщо є FAIL — найчастіше: не запущено `fix-paths.py` або не поклав якийсь файл.

Далі вручну:

```powershell
cd C:\Users\Vitos\SaaS\bookit
npx tsc --noEmit       # 0 errors
npm run build          # clean
npm test               # 42 unit (Vitest)
```

У Claude Code при старті має пройти `STARTUP OK` (mempalace_status + SYSTEM_MAP.md).

---

## 10. Продовжити цей діалог у Claude Code

Транскрипт сесії «Migration» (`8381b8cc-…jsonl`) вже в бандлі:
`claude-global\projects\C--Users-Vitos-SaaS-bookit\`. Після кроку 4 (`fix-paths.py`
переіменує теку в `C--Users-Vitos-SaaS-bookit` і виправить шляхи всередині .jsonl):

```powershell
cd C:\Users\Vitos\SaaS\bookit
claude --resume        # обрати "Migration" зі списку минулих сесій
# або:  claude --continue   (найновіша сесія в цій теці)
```

Хочеш абсолютно свіжий стан (з цим повідомленням включно) — скопіюй `8381b8cc-…jsonl`
зі старого ноута в останню чергу, перед переходом. Знімок у бандлі — до моменту збірки.

Це продовжує саме нитку розмови. Робочий контекст (рішення, архітектура) і без цього
є в MEMORY.md + MemPalace.

---

## Що НЕ увійшло в бандл (навмисно)

- `~/.claude/history.jsonl`, `sessions/`, `shell-snapshots/`, `telemetry/`, `cache/`,
  `backups/`, `paste-cache/`, `uploads/` — сесійний шум, самовідновлюється.
- `~/.claude/projects/*/` крім `memory/` та транскрипта поточної сесії (§10) —
  583M транскриптів інших минулих сесій, не потрібні.
- `.credentials.json` (Claude-токен) — навмисно НЕ переносимо, зроби `/login` заново (безпечніше).
- `dossier-preview.png` — генерується `node dossier-shot.mjs`.
- `node_modules/` — ставиться через `npm install`.
