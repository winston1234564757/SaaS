<#
  verify-migration.ps1 — перевірка, що BookIT коректно встав на новий ноут.
  READ-ONLY: нічого не змінює, лише звітує.

  Запуск (звичайний):   powershell -ExecutionPolicy Bypass -File .\verify-migration.ps1
  З перевіркою збірки:  powershell -ExecutionPolicy Bypass -File .\verify-migration.ps1 -Build

  Шляхи беруться від $env:USERPROFILE — тобто працює під будь-яким ім'ям користувача.
#>
param([switch]$Build)

$ErrorActionPreference = 'SilentlyContinue'
$script:pass = 0; $script:fail = 0; $script:warn = 0

function Ok  ($m){ Write-Host ("  [ OK ] " + $m) -ForegroundColor Green;  $script:pass++ }
function Bad ($m){ Write-Host ("  [FAIL] " + $m) -ForegroundColor Red;    $script:fail++ }
function Warn($m){ Write-Host ("  [WARN] " + $m) -ForegroundColor Yellow; $script:warn++ }
function Head($m){ Write-Host ""; Write-Host ("== " + $m + " ==") -ForegroundColor Cyan }

$U      = $env:USERPROFILE
$SaaS   = Join-Path $U "SaaS"
$bookit = Join-Path $SaaS "bookit"
$claude = Join-Path $U ".claude"

Write-Host ("Профіль користувача: " + $U) -ForegroundColor DarkGray

# ---------------------------------------------------------------- Toolchain
Head "Інструменти"

$node = & node -v
if ($node -match 'v(\d+)\.') {
  if ([int]$Matches[1] -ge 24) { Ok ("Node " + $node) }
  else { Bad ("Node " + $node + " — потрібен v24.x (нативні залежності можуть не зібратись)") }
} else { Bad "Node не знайдено в PATH" }

if (& npm -v)    { Ok  ("npm " + (& npm -v)) }         else { Bad "npm не знайдено" }
if (& git --version) { Ok ((& git --version)) }        else { Bad "git не знайдено" }

$py = & python --version
if ($py) { Ok ($py) } else { Bad "python не знайдено — хуки та fix-paths.py не працюватимуть" }

if (& gh --version | Select-Object -First 1) { Ok "gh CLI встановлено" }
else { Warn "gh CLI не знайдено — постав і зроби 'gh auth login'" }

# ---------------------------------------------------------------- Repo
Head "Репозиторій"

if (Test-Path (Join-Path $SaaS ".git")) {
  Ok ("SaaS репо на місці: " + $SaaS)
  $branch = & git -C $SaaS rev-parse --abbrev-ref HEAD
  if ($branch -eq "migration-checkpoint") { Ok "гілка = migration-checkpoint" }
  elseif ($branch -eq "main") { Warn "гілка = main (незавершену роботу шукай: git checkout migration-checkpoint)" }
  else { Warn ("гілка = " + $branch) }

  $gn = & git -C $SaaS config user.name
  $ge = & git -C $SaaS config user.email
  if ($gn -eq "winston1234564757") { Ok ("git user.name = " + $gn) } else { Warn ("git user.name = '" + $gn + "' (очікується winston1234564757)") }
  if ($ge -eq "viktor.koshel24@gmail.com") { Ok ("git user.email = " + $ge) } else { Warn ("git user.email = '" + $ge + "'") }
} else { Bad ("SaaS репо НЕ знайдено: " + $SaaS) }

# ---------------------------------------------------------------- Secrets
Head "Секрети (.env)"

$envFiles = @(
  (Join-Path $SaaS ".env"),
  (Join-Path $SaaS ".env.local"),
  (Join-Path $bookit ".env.local"),
  (Join-Path $bookit ".env.prod"),
  (Join-Path $bookit ".env.test"),
  (Join-Path $bookit ".env.test.runtime"),
  (Join-Path $bookit ".env.vercel"),
  (Join-Path $bookit ".vercel\.env.production.local")
)
foreach ($f in $envFiles) {
  if ((Test-Path $f) -and ((Get-Item $f).Length -gt 0)) { Ok ("env: " + $f.Replace($U,"~")) }
  else { Bad ("НЕМАЄ або порожній: " + $f.Replace($U,"~")) }
}

# ---------------------------------------------------------------- Deps
Head "Залежності"

if (Test-Path (Join-Path $bookit "node_modules")) {
  Ok "bookit\node_modules існує"
  if (Test-Path (Join-Path $bookit "node_modules\next")) { Ok "next встановлено" }
  else { Bad "node_modules є, але next немає — перезапусти npm install" }
} else { Bad "bookit\node_modules немає — запусти 'npm install' у bookit" }

$pwCache = Join-Path $U "AppData\Local\ms-playwright"
if (Test-Path $pwCache) { Ok "Playwright браузери завантажені" }
else { Warn "Playwright браузери не знайдено — 'npx playwright install' (для e2e + dossier-shot)" }

# ---------------------------------------------------------------- Claude global
Head "Глобальний Claude config"

if (Test-Path (Join-Path $claude "CLAUDE.md"))      { Ok ".claude\CLAUDE.md" }           else { Bad ".claude\CLAUDE.md немає" }
if (Test-Path (Join-Path $claude "settings.json"))  { Ok ".claude\settings.json" }       else { Bad ".claude\settings.json немає" }
if (Test-Path (Join-Path $U ".claude.json"))        { Ok "~\.claude.json (MCP + trust)" } else { Bad "~\.claude.json немає (MCP-сервери не піднімуться)" }

foreach ($d in @("skills","plugins","agents","commands")) {
  $p = Join-Path $claude $d
  if ((Test-Path $p) -and ((Get-ChildItem $p).Count -gt 0)) { Ok (".claude\" + $d + "\ (непорожня)") }
  else { Warn (".claude\" + $d + "\ відсутня або порожня") }
}

# memory: папка має бути перейменована під новий шлях, і НЕ містити Vitossik
$projRoot = Join-Path $claude "projects"
$memDirs  = Get-ChildItem $projRoot -Directory | Where-Object { $_.Name -like "*SaaS*" }
if ($memDirs) {
  $stale = $memDirs | Where-Object { $_.Name -like "*Vitossik*" }
  if ($stale) {
    Bad ("папка пам'яті ще зі старим ім'ям: " + ($stale.Name -join ", ") + " — запусти fix-paths.py")
  }
  $memOk = $false
  foreach ($md in $memDirs) {
    if (Test-Path (Join-Path $md.FullName "memory\MEMORY.md")) { $memOk = $true }
  }
  if ($memOk) { Ok "auto-memory MEMORY.md знайдено" } else { Warn "MEMORY.md у projects\*SaaS*\memory не знайдено" }
} else { Bad "папок projects\*SaaS* немає — auto-memory не перенесено" }

# ---------------------------------------------------------------- MemPalace
Head "MemPalace"

$palace = Join-Path $U ".mempalace\palace\mempalace.yaml"
if (Test-Path $palace) {
  $mpSize = [math]::Round(((Get-ChildItem (Join-Path $U ".mempalace") -Recurse | Measure-Object Length -Sum).Sum / 1MB), 0)
  if ($mpSize -ge 50) { Ok ("mempalace на місці (~" + $mpSize + " MB даних)") }
  else { Warn ("mempalace.yaml є, але папка лише ~" + $mpSize + " MB — дані могли не скопіюватись повністю") }
} else { Bad ("mempalace.yaml немає: " + $palace) }

# ---------------------------------------------------------------- Auth + MCP
Head "Auth та MCP"

# --- GitHub CLI auth ---
if (Get-Command gh -ErrorAction SilentlyContinue) {
  $ghTmp = [System.IO.Path]::GetTempFileName()
  & gh auth status *> $ghTmp
  $ghExit = $LASTEXITCODE
  $ghOut = Get-Content $ghTmp -Raw
  Remove-Item $ghTmp -Force
  if ($ghExit -eq 0 -and $ghOut -match 'account (\S+)') {
    $acct = $Matches[1]
    if ($ghOut -match '\brepo\b') { Ok ("gh залогінено: " + $acct + " (scope repo є)") }
    else { Warn ("gh залогінено: " + $acct + " — але немає scope 'repo' (push не спрацює)") }
  } else {
    Warn "gh НЕ авторизовано — виконай 'gh auth login' (GitHub.com, HTTPS)"
  }
} else { Warn "gh не встановлено — постав CLI і зроби 'gh auth login'" }

# --- Supabase MCP: конфіг ---
$mcp = Join-Path $bookit ".mcp.json"
if (Test-Path $mcp) {
  $mcpRaw = Get-Content $mcp -Raw
  if ($mcpRaw -match 'project_ref=([a-z0-9]+)') {
    $ref = $Matches[1]
    if ($ref -eq 'sqlrxsopllgztvgrerqk') { Ok ("supabase MCP налаштовано (project_ref=" + $ref + ")") }
    else { Warn ("supabase MCP project_ref=" + $ref + " — очікувався sqlrxsopllgztvgrerqk") }
  } elseif ($mcpRaw -match 'supabase') { Warn "supabase у .mcp.json є, але без project_ref" }
  else { Bad "bookit\.mcp.json є, але без supabase MCP" }
} else { Bad "bookit\.mcp.json немає — supabase MCP не підніметься" }

# --- Supabase MCP: OAuth (не мігрується — авторизація при першому виклику) ---
$cred = Join-Path $claude ".credentials.json"
if ((Test-Path $cred) -and (Select-String -Path $cred -Pattern "supabase" -SimpleMatch -Quiet)) {
  Ok "supabase MCP OAuth-токен вже присутній"
} else {
  Warn "supabase MCP ще не авторизовано — Claude Code відкриє OAuth при першому виклику (це нормально)"
}

# --- Supabase MCP: доступність endpoint (м'яка перевірка) ---
try {
  $resp = Invoke-WebRequest -Uri "https://mcp.supabase.com/mcp" -Method Head -TimeoutSec 8 -UseBasicParsing
  Ok ("endpoint mcp.supabase.com доступний (HTTP " + [int]$resp.StatusCode + ")")
} catch {
  if ($_.Exception.Response) {
    Ok ("endpoint mcp.supabase.com доступний (HTTP " + [int]$_.Exception.Response.StatusCode + ")")
  } else {
    Warn "endpoint mcp.supabase.com недоступний — перевір інтернет / проксі / firewall"
  }
}

# ---------------------------------------------------------------- Path-fix
Head "Виправлення шляхів (fix-paths.py має бути запущено)"

$critical = @(
  (Join-Path $SaaS ".claude\settings.json"),
  (Join-Path $U ".claude.json"),
  (Join-Path $SaaS "CLAUDE.md")
)
foreach ($f in $critical) {
  if (Test-Path $f) {
    if (Select-String -Path $f -Pattern "Vitossik" -SimpleMatch -Quiet) {
      Bad ("ще містить 'Vitossik': " + $f.Replace($U,"~") + " — запусти fix-paths.py")
    } else { Ok ("шляхи виправлено: " + $f.Replace($U,"~")) }
  } else { Warn ("файл відсутній: " + $f.Replace($U,"~")) }
}

# ---------------------------------------------------------------- Build (opt)
if ($Build) {
  Head "Збірка (npx tsc --noEmit)"
  Push-Location $bookit
  $tsc = & npx tsc --noEmit 2>&1 | Out-String
  Pop-Location
  if ($LASTEXITCODE -eq 0) { Ok "tsc --noEmit: 0 помилок" }
  else { Bad "tsc --noEmit: є помилки (див. нижче)"; Write-Host $tsc -ForegroundColor DarkGray }
}

# ---------------------------------------------------------------- Summary
Write-Host ""
Write-Host "================ ПІДСУМОК ================" -ForegroundColor Cyan
Write-Host ("  OK:   " + $script:pass) -ForegroundColor Green
Write-Host ("  WARN: " + $script:warn) -ForegroundColor Yellow
Write-Host ("  FAIL: " + $script:fail) -ForegroundColor Red
Write-Host ""
if ($script:fail -eq 0 -and $script:warn -eq 0) {
  Write-Host "Все встало чисто. Лишилось re-auth: gh auth login + Claude /login." -ForegroundColor Green
} elseif ($script:fail -eq 0) {
  Write-Host "Критичних проблем немає, глянь WARN вище." -ForegroundColor Yellow
} else {
  Write-Host "Є FAIL — виправ перш ніж працювати (найчастіше: не запущено fix-paths.py або не поклав файли)." -ForegroundColor Red
}
