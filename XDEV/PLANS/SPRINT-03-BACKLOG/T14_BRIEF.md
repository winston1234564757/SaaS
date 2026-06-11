# T14 — Онбординг: виразний блок посилання

> Ітерація 15 | **Скіл: impeccable** | Розмір: S | Наступна: T11

---

## Проблема
На кроці превью онбордингу блок з посиланням на профіль майстра виглядає другорядним — юзер не розуміє що це ключовий елемент (його «link in bio»). Потрібно зробити його виразним і action-oriented.

## Рішення
Переробити блок посилання на головний CTA кроку: великий, виразний, з copy-кнопкою та preview.

---

## Файли
| Файл | Шлях | Що міняємо |
|------|------|-----------|
| `StepPreview.tsx` | `src/components/master/onboarding/steps/StepPreview.tsx` | Весь блок посилання |
| `OnboardingWizard.tsx` | `src/components/master/onboarding/OnboardingWizard.tsx` | Якщо потрібен slug |

---

## Mempalace search (виконати перед кодом)
```
mempalace_search "onboarding preview step link slug StepPreview"
mempalace_search "link in bio booking page slug master profile"
```

---

## QA Gate (задати перед кодом)
1. **Що показувати** — тільки посилання, чи і QR-код?
2. **Copy** — скопіювати посилання в clipboard + toast «Скопійовано»?
3. **Preview** — відкрити сторінку в новій вкладці при кліку?
4. **Стиль** — велика картка з URL + CTA кнопки, чи інший формат?
5. **Текст** — «Твій link in bio» / «Твоя сторінка запису» / що humanizer скаже?

---

## Acceptance Criteria
- [ ] Блок посилання — візуально домінує на кроці (не дрібний текст)
- [ ] Кнопка «Копіювати» → копіює URL → toast підтвердження
- [ ] Кнопка «Відкрити» → відкриває сторінку в новій вкладці
- [ ] Copy text проходить через humanizer перед кодом
- [ ] Мобайл: touch targets ≥ 44px
- [ ] TSC: 0 помилок | Build: clean

---

## Post-change checklist
```
□ npx tsc --noEmit        — нуль помилок
□ npm run build           — clean
□ vercel --prod
□ TRACKER.md: рядок T14 ⬜→✅ + commit hash
□ HANDOFF.md: додати секцію T14 з деталями
□ TRANSITION_PROMPT.md: next = T11, Brief = T11_BRIEF.md
□ mempalace_add_drawer з ключовими рішеннями
```
