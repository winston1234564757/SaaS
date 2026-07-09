# OPT-ASSET-02 — Кластер: публічні raw <img> → next/image

**Тип:** MOTION
**Пріоритет:** P2
**Статус:** DRAFT
**Спеціаліст-скіли:** `senior-frontend`

---

## Поточний стан
Публічні / гарячі `<img>` без оптимізації (CLS + повнорозмірний payload), мали б бути `next/image` з `width`/`height`/`sizes`:
- `src/components/shared/wizard/ServiceSelector.tsx:138, 345` (сервіс + провайдер у booking-флоу).
- `src/components/shared/wizard/ServiceDetailSheet.tsx:77` (full-bleed cover).
- `src/components/shared/chat/ChatMessageList.tsx:109` (вкладення чату).
- `src/components/shared/MobileHub.tsx:162`, `master/dashboard/SharePageCard.tsx:121`, `master/settings/widgets/PublicStatusWidget.tsx:171`, `master/billing/BillingPage.tsx:48`, `app/invite/[code]/page.tsx:160,240,311`.

`next.config.ts` уже whitelist'ить `*.supabase.co` — міграція низько-фрикційна.

## Ціль
Перевести перелічені на `next/image` з коректними `sizes`. **НЕ чіпати** blob/data-URL прев'ю (`onboarding/steps/StepBasic.tsx:89`, `StepProfile.tsx:96`, `StoryCanvas`, crop-прев'ю, `AdminSupportConsole.tsx:395`) — next/image не оптимізує object-URL.

## Файли, які чіпаю
- ~9 файлів вище (публічні/supabase-hosted зображення).

## Ризики / що може зламатись
- Потрібні відомі `width`/`height` або `fill`+контейнер із розміром — інакше layout зламається. Перевірити кожен випадок (fill для cover, фіксовані для аватарів).
- Деякі URL можуть бути не з supabase (зовнішні) — перевірити whitelist перед конвертацією, інакше runtime-помилка next/image.
- `sizes` має відповідати реальній ширині в лейауті, інакше вантажиться завеликий варіант.

## Acceptance criteria
- [ ] TSC: 0 | Build: clean
- [ ] Публічні зображення через next/image з коректними sizes; blob/data-URL лишились raw.
- [ ] Немає CLS/зламаного лейауту на цих екранах (own-eyes).

## Відкриті питання до тебе
1. Немає — чекаю APPROVE.
