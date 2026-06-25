# M-CLI-03 — Клієнти: інфо-меседжі з dismiss 12год

**Тип:** NEW-FEATURE
**Пріоритет:** P2
**Статус:** ✅ DONE
**Спеціаліст-скіли:** `senior-frontend` + патерн `mark-as-read-on-close` (скіл фізично не встановлений — патерн застосовую вручну)

---

## Поточний стан
- Файл: `master/clients/ClientWidgets.tsx`.
- **«Пора почистити базу»** (р.274-303): `motion.div`, показ коли `archiveCount > 0`, CTA «Відкрити список» → `onSegmentSelect('archive_cleanup')`. Dismiss НЕМАЄ.
- **«Потрібен follow-up»** (р.305-329): `motion.button` (вся плитка = кнопка), показ коли `newbiesAtRisk.length > 0`, → `onSegmentSelect('newbie_danger')`. Dismiss НЕМАЄ.
- Наявна конвенція dismiss: `ChannelBanner.tsx` — `localStorage 'bookit_*_dismissed'` + `AnimatePresence` exit. Але **назавжди**, без TTL і без re-show при зміні даних.

## Ціль (бажана поведінка)
Беклог р.113: системні інфо-меседжі з **dismiss**; повертаються **раз/12год АБО при зміні даних**.
- Додати «×» кнопку на кожен блок → ховає його з collapse/fade.
- Dismiss персиститься 12 год; після — блок повертається.
- Якщо змінився лічильник (`archiveCount` / `newbiesAtRisk.length`) — dismiss скидається, блок показується знову (нові дані = новий привід).

## Файли, які чіпаю
- `bookit/src/lib/hooks/useDismissable.ts` — НОВИЙ reusable хук: `useDismissable(key, dataFingerprint)` → `{ dismissed, dismiss }`. localStorage `bookit_dismiss_${key}` = JSON `{ ts, fp }`. `dismissed` = запис є І (now−ts < 12год) І `fp === dataFingerprint`. SSR-safe (`typeof window`).
- `bookit/src/components/master/clients/ClientWidgets.tsx` — підключити хук до обох блоків + «×» + `AnimatePresence` exit. Follow-up блок (зараз `motion.button`) перебудувати у relative-контейнер: клікабельна зона = button, «×» = окрема absolute-кнопка (не вкладати interactive в interactive).

## [NEW-FEATURE] Acceptance criteria + стани
- [ ] TSC: 0 | Build: clean
- [ ] «×» ховає блок (collapse/fade), `useReducedMotion` → миттєво
- [ ] Після dismiss блок не показується < 12 год (перевірити перезавантаженням)
- [ ] Зміна лічильника (archiveCount/newbies) до закінчення 12 год → блок повертається
- [ ] Follow-up: клік по тілу досі вибирає сегмент; «×» не плутається з ним
- [ ] SSR-safe (нема localStorage на сервері), нема hydration mismatch

## Ризики / що може зламатись
- Hydration mismatch: `dismissed` з localStorage на маунті → ініціалізувати `false` і виставляти в `useEffect` (як ChannelBanner робить через lazy initial, але там SSR повертає false). Узгодити, щоб SSR і перший клієнт-рендер збігалися.
- Nested interactive у follow-up (`motion.button` + «×») — перебудувати на div + 2 кнопки.
- `col-span-2` лейаут блоків зберегти.

## Відкриті питання до тебе
1. **Сховище dismiss-стану** — `localStorage` (per-device, просто, як `ChannelBanner`) чи **БД** (cross-device, стиль `seen_tours`, потребує міграції + server action)?
2. **«При зміні даних»** — сигнал повернення = зміна **лічильника** (`archiveCount` / `newbiesAtRisk.length`)? Чи інший критерій?

---

## [Заповнюється після DONE]
**Root cause / рішення:** Новий хук `useDismissable(key, fp)` (localStorage `bookit_dismiss_${key}` = `{ts, fp}`, dismissed = свіжий <12год І fp збігається, SSR-safe). Підключено до Cleanup (fp=archiveCount) і Follow-up (fp=newbiesAtRisk.length, перебудовано з motion.button у div + окрема «×»). localStorage + лічильник-fingerprint (рішення founder).
**HOTFIX (`e954f909`):** перша версія падала на мобілці — хуки стояли після `if(isLoading) return` → loading→loaded міняв кількість хуків → React краш. Ранній return перенесено після всіх хуків.
**Commit:** `10038f6b` (фіча) + `e954f909` (hotfix)
**Що винесено в mempalace:** `decisions/e65cb174…` (dismiss-патерн) + `fixes/c61af153…` (урок: early return ніколи перед хуками).
