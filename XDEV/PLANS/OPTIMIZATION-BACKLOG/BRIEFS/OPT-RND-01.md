# OPT-RND-01 — Sheet.tsx: backdrop-blur під scale-анімацією (джанк у всіх модалках)

**Тип:** MOTION
**Пріоритет:** P0
**Статус:** DONE (код) · ⏳ own-eyes QA + commit pending
**Спеціаліст-скіли:** `fixing-motion-performance`

---

## Поточний стан
`src/components/ui/Sheet.tsx`:
- `:58` (DialogVariant) — `motion.div` анімує `scale: 0.95→1` (SPRING) і водночас несе `backdrop-blur-3xl saturate-150`.
- `:111` (BottomVariant) — те саме з `backdrop-blur-3xl`.

Браузер повторно семплить і блюрить увесь фон **на кожному кадрі** scale-пружини. `Sheet` — спільний примітив майже всіх drawer'ів/модалок (bookings, reviews, clients, products, wizard). На середніх/слабких мобільних — джанк на open/close. Це цільова аудиторія.

## Ціль
Прибрати blur з анімованого елемента. Варіанти (обрати): (a) blur лише на статичному overlay-шарі за панеллю, панель без backdrop-blur; (b) знизити до `blur-md`; (c) анімувати тільки `opacity` (без scale) для контент-панелі з блюром.

## Файли, які чіпаю
- `src/components/ui/Sheet.tsx:58,111` — розділити анімований шар і блюр-шар.

## Ризики / що може зламатись
- Візуальна регресія «скла» — узгодити, наскільки сильним лишити блюр статично (own-eyes прев'ю на реальній модалці, напр. BookingDetailsModal + BottomSheet).
- Це спільний примітив — зачіпає ВСІ модалки одразу; перевірити обидва варіанти (Dialog + Bottom) у Frost.
- `saturate-150` на анімованому шарі так само дорогий — винести на статичний шар.

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] Жоден анімований (scale) елемент Sheet не несе `backdrop-blur-3xl`.
- [ ] Open/close плавний; візуал «скла» збережений на статичному шарі (own-eyes перевірка).

## Відкриті питання до тебе
1. ~~Зберегти скло на overlay чи прибрати повністю?~~ ВИРІШЕНО: варіант C — blur+saturate на статичний overlay, панель = чистий tint.

---

## [Заповнюється після DONE]
**Root cause / рішення:** Активна тема Frost має `--surface: rgba(255,255,255,0.62)` (напівпрозора панель), тож `backdrop-blur-3xl saturate-150` на панелі давав реальне скло, але сидів на scale-анімованому (Dialog) / translateY-анімованому (vaul Bottom) елементі → per-frame re-blur великої поверхні. Рішення (варіант C): прибрано `backdrop-blur-3xl saturate-150` з обох панелей; blur перенесено на статичні overlay-шари, підняті `backdrop-blur-[2px]` → `backdrop-blur-xl saturate-150` (overlay анімує ЛИШЕ opacity — короткий one-shot fade, дозволено). Панелі тепер чистий transform/opacity. Уніфіковано для Dialog + Bottom.
**Файли:** `src/components/ui/Sheet.tsx` — overlay DialogVariant (`:45`), панель DialogVariant (`:58`), overlay BottomVariant (`:107`), панель BottomVariant (`:111`).
**Верифікація:** TSC 0 · Build clean. ⏳ Own-eyes (жива модалка на Frost — desktop Dialog + mobile Bottom) НЕ прогнано автоматично — на founder / playmright-скрін.
**Commit:** pending (чекає дозволу).
**Що винесено в mempalace:** drawer «OPT-RND-01 Sheet blur→overlay».
