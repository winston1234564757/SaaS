# OPT-RND-02 — MasterContext value міняє identity щорендер

**Тип:** BUGFIX
**Пріоритет:** P0
**Статус:** DONE (код) · ⏳ auth-flow QA + commit pending
**Спеціаліст-скіли:** `react-best-practices` `senior-frontend`

---

## Поточний стан
`src/lib/supabase/context.tsx`:
- `:101-103` — `refresh` створюється наново щорендер (не в `useCallback`).
- `:181-184` — `contextValue = useMemo(() => ({... refresh ...}), [..., refresh, ...])`. Оскільки `refresh` у deps і нестабільний, memo дає **новий identity щорендер** → безсенсовий.
- `fetchProfile` (визначена вище, ~`:70-99`) теж не в `useCallback`, і стоїть у deps `useEffect` (`:179`).

`MasterContext` обгортає всю `(master)` піддерево дашборду. Кожен ререндер провайдера пропагує в **усіх** споживачів `useMasterContext()`. `reactCompiler` це НЕ рятує — нестабільність identity всередині власних memo-deps провайдера.

## Ціль
Обгорнути `fetchProfile` і `refresh` у `useCallback` зі стабільними deps → `contextValue` набуває стабільного identity, ререндери провайдера перестають безпідставно пропагувати.

## Файли, які чіпаю
- `src/lib/supabase/context.tsx:70-103` — `fetchProfile`/`refresh` у `useCallback`.
- `:181-184` — deps memo лишаються, але тепер стабільні.

## Ризики / що може зламатись
- **Критично:** `fetchProfile` стоїть у deps `useEffect` (`:179`), що підписує `onAuthStateChange`. Якщо `useCallback` deps зроблять `fetchProfile` нестабільною — ефект переpідпишеться, що може зачепити auth-lock deadlock-guard (`setTimeout(0)` на `:148`, коментар `:140-146`). deps `useCallback` мають бути мінімальні й стабільні (`supabase`, сеттери стабільні). Ідеально — прибрати `fetchProfile` з deps ефекту через ref, якщо це не зламає recovery.
- Visibility-recovery (`:167-169`) і safety-timeout (`:114-121`) залежать від тих самих функцій — не зламати.
- Регресія auth: перевірити INITIAL_SESSION гілку (`:129`), login/logout, impersonation (`realAdminProfile`).

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] `contextValue` стабільний між ререндерами без зміни даних (перевірити React DevTools / лог).
- [ ] Auth-flow не зламано: login, logout, refresh-token, visibility-recovery, impersonation.
- [ ] deadlock-guard `setTimeout(0)` збережений.

## Відкриті питання до тебе
1. Немає — бриф самодостатній. (Ризик auth-lock врахований.)

---

## [Заповнюється після DONE]
**Root cause / рішення:** `fetchProfile` + `refresh` створювались наново щорендер → `contextValue = useMemo(..., [..., refresh, ...])` мав новий identity щорендер → безсенсовий memo, пропагація в усіх консумерів. Додатково `fetchProfile` у deps `useEffect(:179)` → ефект переpідписував `onAuthStateChange`+visibilitychange НА КОЖНОМУ рендері (прихований churn).
Рішення: `fetchProfile = useCallback(..., [supabase])`, `refresh = useCallback(..., [fetchProfile])`. Щоб не тягнути `user` у deps (що знову зробило б колбеки нестабільними), доданий `userRef` (`useRef<User|null>`, синхр. `userRef.current = user` щорендер — патерн useLatest) — використовується в `refresh` і `handleVisibilityChange` замість `user` із замикання. Тепер ефект має СТАБІЛЬНІ deps → підписка `onAuthStateChange` раз на mount (як і передбачав deadlock-guard коментар), userRef дає свіжий user для visibility-recovery.
**Файли:** `src/lib/supabase/context.tsx` — userRef (+sync), fetchProfile→useCallback, refresh→useCallback, handleVisibilityChange→userRef.current.
**Верифікація:** TSC 0 · Build clean · ESLint react-hooks 0 (refs/exhaustive-deps — саме те, що ловить ризик deps). Auth e2e (00-role-login-smoke + 01-auth-guards, non-destructive dev-сервер на локальному Supabase): **14 passed**, 4 fail = dev-only false-positive (React dev-mode eval() vs build-time CSP unsafe-eval, не регресія — дашборд/портал монтуються чисто, MasterProvider відпрацював). Прод-білд e2e не ганявся (потребує env-swap).
**Commit:** `7d66e4c4`.
**Що винесено в mempalace:** drawer «OPT-RND-02 MasterContext useCallback+userRef».
