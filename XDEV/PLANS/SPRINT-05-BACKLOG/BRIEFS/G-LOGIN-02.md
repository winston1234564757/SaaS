# G-LOGIN-02 — Логін мобільний: зазор між інпутом і клавіатурою

**Тип:** BUGFIX · **Tier:** 1 · **Скіл:** `senior-frontend`
**Статус:** RE-OPEN (попередній фікс `e9946bc9` не спрацював на iOS)

## Справжній Root Cause (виправлено)

Хибна передумова всіх попередніх 5 спроб: «`dvh` зменшується коли відкривається клавіатура».
**На iOS Safari це НЕ так.** `dvh`/`svh`/`lvh` реагують лише на згортання адресного рядка браузера, НЕ на віртуальну клавіатуру (клавіатура — оверлей, керується `interactive-widget`, який iOS ігнорує → дефолт `resizes-visual` → layout viewport і `dvh` не міняються).

Наслідок:
- `h-[100dvh]` контейнер лишається на повну висоту (~844px) навіть із відкритою клавіатурою.
- `flex-spacer`/`my-auto` позиціонує форму в межах цих 844px → форма за клавіатурою.
- iOS сам панорамує visual viewport, щоб показати focused input → форма опиняється посередині з «мертвою зоною» знизу (те, що на скріншоті).

Додатковий структурний фактор: `(auth)/layout.tsx` вкладений у root `<div className="flex flex-col min-h-screen">`. Навіть якщо стиснути auth-контейнер, `min-h-screen` тримає body на 100vh → body лишається панорамованим iOS.

Чому минулого разу `AuthKeyboard` (visualViewport) видалили: він ставив `height: vv.height` на **position:static** елемент → конфлікт із iOS body-pan (`offsetTop`). Висновок «прибрати JS, юзати dvh» був помилковий — бракувало `position: fixed` + компенсації `offsetTop`.

## Fix (visualViewport-driven fixed shell)

**1. NEW `AuthViewportShell` (client)** — обгортає весь auth-екран:
- `position: fixed; inset-x-0; top-0` + `h-[100dvh]` (baseline до гідрації) → вириваємось із `min-h-screen` батька, body перестає бути панорамованим.
- `useEffect` на `window.visualViewport`: на `resize` + `scroll` ставимо
  `el.style.height = vv.height + 'px'` (реальна висота над клавіатурою)
  `el.style.transform = 'translateY(' + vv.offsetTop + 'px)'` (компенсація body-pan).
- Cleanup listeners; graceful fallback якщо `visualViewport` відсутній (старі браузери) → лишається `h-[100dvh]`.

**2. `AuthScrollMain`** — повертаємо центрування через `my-auto` (замість flex-spacer):
- `<main className="flex-1 flex flex-col overflow-y-auto px-5 py-6">` + дочірній `<div className="w-full max-w-sm mx-auto my-auto">`.
- `my-auto` центрує коли влазить; коли форма вища за видиму зону — margins колапсують, `overflow-y-auto` дає скрол без flex-clip bug.

**3. Root viewport meta** (`src/app/layout.tsx`) — додаємо `interactive-widget=resizes-content` → прогресивне покращення для Android Chrome (на iOS ігнорується, шкоди нема).

## Результат
- iOS Safari: shell = точно видима зона над клавіатурою; форма всередині, зазор ≈ pb/py-6, без мертвої зони ✓
- iOS, висока форма (role_select): скролиться всередині shell, без clip ✓
- Android Chrome: `resizes-content` + dvh працює нативно ✓
- Без клавіатури: форма відцентрована вертикально ✓
- autoFocus / фокус не чіпаємо ✓

## Файли
- NEW: `bookit/src/app/(auth)/_components/AuthViewportShell.tsx`
- EDIT: `bookit/src/app/(auth)/layout.tsx` (зовнішній div → `<AuthViewportShell>`)
- EDIT: `bookit/src/app/(auth)/_components/AuthScrollMain.tsx` (flex-spacer → my-auto)
- EDIT: `bookit/src/app/layout.tsx` (viewport meta: `interactiveWidget: 'resizes-content'`)

## Ризики
- `position: fixed` на auth-shell: desktop split-layout стає fixed full-screen — візуально ідентично (auth = весь екран), без регресу.
- `transform` створює containing block для fixed-нащадків — у формі fixed-нащадків нема (перевірено), безпечно.
- Не тестується автоматично (iOS Safari) → потрібна ручна перевірка на реальному пристрої після деплою.
