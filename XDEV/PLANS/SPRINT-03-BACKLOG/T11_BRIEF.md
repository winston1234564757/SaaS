# T11 — Флеш-акції: повний аудит

> Ітерація 16 | **Скіл: code-reviewer + react-doctor** | Розмір: L | Наступна: T16

---

## Проблема
Флеш-акції — критична фіча для монетизації (Starter / Pro), але:
1. `quick-actions.ts` видалено (D у git status) — потенційна регресія
2. Логіка лімітів, сповіщень і UX потребує повного аудиту
3. Можливі баги в createFlashDeal / cancelFlashDeal / notifications

---

## Файли
| Файл | Шлях | Рядки | Що перевіряємо |
|------|------|-------|----------------|
| `actions.ts` | `src/app/(master)/dashboard/flash/actions.ts` | 1-177 | createFlashDeal (23-163), cancelFlashDeal (165-177) |
| `FlashDealPage.tsx` | `src/components/master/flash/FlashDealPage.tsx` | — | UI + форма + список |
| `FlashDealDrawer.tsx` | `src/components/master/dashboard/FlashDealDrawer.tsx` | — | Drawer з дашборду |
| `FlashDealsCard.tsx` | `src/components/master/analytics/sections/FlashDealsCard.tsx` | — | Аналітика |
| `quick-actions.ts` | `src/app/(master)/dashboard/flash/quick-actions.ts` | DELETED | Перевірити регресію |

---

## Відомий контекст (mempalace)
- `createFlashDeal()`: рядки 23-163 — Starter limit 5/місяць (рядок 21), Push + Telegram до клієнтів у 48h вікні (рядки 103-159)
- `cancelFlashDeal()`: рядки 165-177 — встановлює status='expired'
- `quick-actions.ts` (видалено): `launchQuickFlashDeal()` — автостворення акції з топ-послугою, 20% знижка, 2h термін. Starter: 2/місяць.
- `FlashDealPage.tsx` використовує `useTour` + `AnchoredTooltip` для туру

## Mempalace search (виконати перед кодом)
```
mempalace_search "flash deal createFlashDeal cancelFlashDeal starter limit"
mempalace_search "flash notifications push telegram 48h window"
mempalace_search "quick-actions launchQuickFlashDeal deleted regression"
```

---

## QA Gate (задати перед кодом)
1. **Регресія quick-actions** — що саме імпортувало з `quick-actions.ts`? Чи є 404 / TS помилки?
2. **Starter ліміт** — 5/місяць у actions.ts і 2/місяць у quick-actions були різними — яке правильне?
3. **Notifications** — Push + Telegram реально відправляються? Перевірити лог?
4. **UX** — що саме не працює або виглядає не так у формі?
5. **cancelFlashDeal** — чи правильно переводить статус (expired vs cancelled)?

---

## Acceptance Criteria
- [ ] `git show HEAD -- src/app/(master)/dashboard/flash/quick-actions.ts` — перевірено регресію
- [ ] createFlashDeal — Starter limit правильний (1 значення)
- [ ] cancelFlashDeal — коректно змінює статус
- [ ] Push + Telegram нотифікації — перевірено що спрацьовують
- [ ] FlashDealPage — UX без blocker-багів
- [ ] TSC: 0 помилок | Build: clean

---

## Post-change checklist
```
□ git show HEAD -- src/app/(master)/dashboard/flash/quick-actions.ts  (регресія)
□ npx tsc --noEmit        — нуль помилок
□ npm run build           — clean
□ vercel --prod
□ TRACKER.md: рядок T11 ⬜→✅ + commit hash
□ HANDOFF.md: додати секцію T11 з деталями
□ TRANSITION_PROMPT.md: next = T16, Brief = T16_BRIEF.md
□ mempalace_add_drawer з ключовими рішеннями
```
