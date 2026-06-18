# Sprint-04 TRACKER
> Живий статус. Оновлюється після кожної ітерації (⬜→✅).
> Деталі виконаного: `HANDOFF.md` | Повний план + acceptance: `SPRINT-04-PLAN.md`

**Прогрес:** 25/37 ✅ | **Розпочато:** 2026-06-12 | **Оновлено:** 2026-06-19

> ⚠️ **РЕСТРУКТУРИЗАЦІЯ 2026-06-16:** Ітерації 16–22 переміщено в `##ClientDesign` — над ними велась робота, але бажаний дизайн-результат не досягнуто. Потрібне повне переосмислення UX/UI по `CLIENT_ZONE_REDESIGN.md`.

---

## ✅ Фаза 1–2 — Швидкі фікси + UX (T01–T15)

| Іт | ID | Назва | Статус | Скіл | Commit | Brief |
|----|----|-------|--------|------|--------|-------|
| 1 | T01 | Frost тема: всі клієнти → міграція | ✅ | `code-reviewer` | `490a108` | rawTheme fallback '' → 'frost'; DB migration 20260609000001 |
| 2 | T02 | In-app сповіщення: unread кольорові + z-index | ✅ | `code-reviewer` | `b7c1d25` `2746e21` | text-accent unread bell; badge z-10; optimistic setQueryData; X→markAllRead |
| 3 | T03 | Портфоліо → Сторіс: редірект замість drawer | ✅ | `code-reviewer` | `55ce2f9` | drawer removed; redirect /dashboard/marketing?tab=stories&portfolioId |
| 4 | T04 | Мобайл магазин: кнопка "Додати товар" + toggle уніфікація | ✅ | `senior-frontend` | `df27107` `3c26ff6` | inline btn + TabBtn outlined; уніфікація 5 pill-тоглів role=switch/bg-accent/44px |
| 5 | T05 | Клієнти (список): стандартизація кнопок + smart кнопка | ✅ | `code-reviewer` | `c239ae4` | MessageSquare→Sparkles; size-11 rounded-full; onSmartAction wired |
| 6 | T06 | Меню > Система > Студія: redesign + alpha/beta | ✅ | `design-taste-frontend` + `humanizer` | `875f512` | StudioBetaCard.tsx; beta form (name/contact/size) → submitBetaRequest |
| 7 | T07 | Записи мобайл: safe area top + widget-card controls | ✅ | `senior-frontend` + `impeccable` | `224b0f9` `0167e17` | paddingTop env(safe-area); sticky fully removed; widget-card controls |
| 8 | T08 | Дашборд: tooltip safe area (кліп на краях) | ✅ | `senior-frontend` + `impeccable` | `acce085` `5a5971f` | WeeklyChart fixed outside bento-card; outer=position inner=animation (FM pattern) |
| 9 | T09 | Мобайл послуги: кнопка + toggle a11y + компакт + sep | ✅ | `design-taste-frontend` | `99cbd6c` `decf6fd` | FAB→inline btn; groupBy category + multi-Droppable; compact p-3/size-10; knob bg-white |
| 10 | T10 | Портфоліо: кольори стандарт + mobile photo actions | ✅ | `design-taste-frontend` + `impeccable` | `69f072e` `438a2f7` | PhotoLightbox shared; tap overlay + ChevronLeft/Right reorder; bg-accent tokens |
| 11 | T11 | GrowthHub мобайл: tab layout redesign | ✅ | `design-taste-frontend` | `fae6e9a` | grid-cols-3 widget blocks; icon+label+desc; bg-accent active; Rocket removed |
| 12 | T12 | Профіль: відпустка/вихідні overlap fix (3 таби) | ✅ | `redesign-existing-projects` | `8533ce4` `1af1b3e` | always-open form; flex segmented control equal-height; "Короткий" label |
| 13 | T13 | Записи: баг буферу 10 хв між записами | ✅ | `focused-fix` | `9b5fdde` | smartSlots.ts: b.end → b.end + bufferMinutes — backward buffer enforcement |
| 14 | T14 | Конструктор сторіс (ПК+мобайл): розширення робочої зони | ✅ | `senior-frontend` + `impeccable` | `6cc91f2` `0fa2aab` | two-column sticky desktop; ResizeObserver scale; mobile preview-first; grid-cols-4 picker; pill switches |
| 15 | T15 | Сповіщення: каскад Push→TG + тексти + PWA deep link | ✅ | `focused-fix` + `senior-backend` | `51f0ba7` `f2b24bf` | some→every cascade; /100 price fix; /goto redirect page; gotoUrl() 19 TG buttons |

---

## ✅ Smart Slots + Лендинг

| Іт | ID | Назва | Статус | Скіл | Commit | Brief |
|----|----|-------|--------|------|--------|-------|
| 33 | T32 | Smart Slots: авто Flash Deal при скасуванні | ✅ | `spec-driven-workflow` + `senior-backend` | `e7645f9` | migration 141 (auto_flash_on_cancel + discount_pct); createFlashDealInternal; AutoFlashSettingsCard |
| 34 | T33 | Лендинг: повна консистентність тарифів | ✅ | `humanizer` + `senior-frontend` | `e01e138` `e2b3bd1` | LandingPricing Studio→Waitlist+betaForm; Pro 13 фіч; BillingPage sync; mojibake fix |

---

## ⬜ Інші задачі Sprint-04

| Іт | ID | Назва | Статус | Скіл | Brief |
|----|----|-------|--------|------|-------|
| 25 | T18 | Оптимізація завантаження сторінки послуг | ✅ | `senior-frontend` + `senior-backend` | Server prefetch + DnD lazy + unoptimized removed → 5s→<2s TTI |
| 26 | T22 | Стандартизація завантаження фото (всі сутності) | ✅ | `senior-fullstack` + `impeccable` | `52dbb4b` `87f3901` | uploadPhoto.ts + PhotoUploader + CropDrawer; 9 files; preview cache-bust; multi-select cropQueue; silent save fix; dismissible=false |
| 27 | T23 | Онбординг тур: persona simulation + brainstorm + spec | ✅ | `brainstorming` + `writing-plans` + `ui-ux-pro-max` | ONBOARDING_TOUR_SPEC.md: 7-step cross-page activation tour, DB-first persistence (activation_tour_step), master layout provider, replaces 17-step Dashboard Tour |
| 27.5 | T23-impl | Activation Tour: повна реалізація (7 tasks) | ✅ | `senior-fullstack` + `create-migration` | `b5f8ec6` | DB migration + ActivationTourContext + ActivationTourBanner + data-tour-step×7 + DashboardLayout swap + onboarding bridge |
| 27.6 | T23-impl-v2 | Per-page TourBanner: замінює cross-page Activation Tour | ✅ | `grill-me` + `senior-frontend` + `impeccable` | `7b9886e` `7da4fdc` `a102304` `a4ccbd9` | 9 destination tours; dynamic navigator (filters seen+current); completion screen (isCompletion); destinationTours.ts shared const; ease-out-quart + scaleX polish; TSC:0 |
| 28 | T25 | dashboard/settings (ПК): повний redesign з нуля  | ⬜ | `design-taste-frontend` + `impeccable` | 2-col або sidebar+content layout |
| 29 | T28 | Розхідники: бізнес-аналіз + persona sim + spec | ⬜ | `spec-driven-workflow` + `senior-architect` | Deliverable: spec + business analysis |
| 30 | T29 | Розхідники: міграції + серверна логіка | ⬜ | `create-migration` + `senior-backend` | Залежить від T28 spec approved |
| 31 | T30 | Розхідники: UX/UI реалізація | ⬜ | `design-taste-frontend` + `impeccable` | Залежить від T29 deployed |
| 32 | T31 | Smart Design System: Context-Adaptive UI | ⬜ | `spec-driven-workflow` + `senior-frontend` + `impeccable` | useSmartTooltip + FitText + .adaptive-text |

---

## ##ClientDesign — Клієнтська Зона: Потрібне Повне Переосмислення

> ⚠️ **Статус:** Над цими задачами велась робота в ітераціях 16–22, коміти існують, але бажаний дизайн-результат не досягнуто.
>
> **Дія:** Повне переосмислення UX/UI з нуля. Процес: `CLIENT_ZONE_REDESIGN.md` Phase 0→5 (Brainstorm → Shape → Generate → Critique → Motion → Ship).
>
> **Технічний стан (зберегти):**
> - `/my/messages` backend: `conversations` + `direct_messages` таблиці ✅, RLS ✅, server actions ✅, hooks ✅ — тільки UI переробляти
> - `/my/profile` schema: `instagram_url` + `telegram_handle` міграція ✅, avatar upload logic ✅ — тільки UI переробляти
> - `/my/bookings` `submitReview` action ✅, `cancelBooking` action ✅ — тільки UI переробляти

| Іт | ID | Назва | Статус | Скіл | Ref Commit | Scope |
|----|----|-------|--------|------|-----------|-------|
| 16 | **T16-redo** | /explore + клієнтський навбар: повний редизайн | ⬜ redo | `ui-ux-pro-max` + `design-taste-frontend` + `impeccable` + `emil-design-eng` | `3e151e5` | ExplorePage + MyBottomNav + ClientNotificationsBell |
| 17 | **T17-redo** | /my/masters + loyalty + notifications: redesign | ⬜ redo | `design-taste-frontend` + `impeccable` + `emil-design-eng` | `830acd4` | MyMastersPage + MyLoyaltyPage + ClientNotificationsPage |
| 17b | **T-card-redo** | Картка майстра (MasterCard + MasterListCard): redesign | ⬜ redo | `ui-ux-pro-max` + `design-taste-frontend` + `impeccable` | `a9c5b5b` | MasterCard + MasterListCard в ExplorePage; uniform height; WCAG badges |
| 18 | **T-bookings-redo** | /my/bookings: premium redesign + review modal + "Записатись знову" | ⬜ redo | `ui-ux-pro-max` + `design-taste-frontend` + `impeccable` + `humanizer` | `9118000` | MyBookingsPage; HeroCard; MasterGroup; ReviewSheet; CancelSheet |
| 20 | **T-profile-redo** | /my/profile: Identity Card redesign (schema ✅) | ⬜ redo | `design-taste-frontend` + `impeccable` | `4e8d0c5` | MyProfilePage; avatar upload; socials; collapsible health; isDirty bar |
| 21 | **T-chat-redo** | /my/messages: UI redesign + keyboard UX (backend ✅) | ⬜ redo | `design-taste-frontend` + `impeccable` + `emil-design-eng` | `e3273aa` | DirectChatPage + MessagesListPage + ConversationRow + keyboard h-dvh |
| 22.1 | **T-QA-bookings** | /my/bookings: 6 QA fixes | ✅ | `design-taste-frontend` | `731ea92` | MasterGroup 2-row; service pills; cross-master conflict check; HeroCard single-row; tab border removed; orders admin client |
| 22.2 | **T-QA-explore** | /explore: фото -30% + теги в strip | ✅ | `design-taste-frontend` | `8cada91` | h-[192px]→h-[134px]; bottom section removed (не вміщується); tags strip: PRO+Рекомендований+Є слот |
| 22.3 | **T-QA-chat** | /my/messages: Мої майстри + UX fixes | ⬜ | `design-taste-frontend` + `impeccable` | — | masters section at top; header border; nav hide on chat; keyboard UX polish |
| 22.4 | **T-QA-navbar** | MyBottomNav FAB redesign | ⬜ | `design-taste-frontend` + `impeccable` | — | FAB center button; Записи|Бонуси|[FAB]|Чат|Профіль layout |
| 23 | **T-phone** | /my/setup/phone: onboarding redesign з нуля | ⬜ | `design-taste-frontend` + `impeccable` | — | phone verification form redesign; Frost theme; elegant step UI |
| 24 | **T24** | Клієнтська зона: desktop layout — всі 8 сторінок | ⬜ | `design-taste-frontend` + `impeccable` | — | 2-col / side panels / wide grid для /my/* + /explore |
---

## ⚠️ Pending post-deploy (з Sprint-03)
- `npx supabase db push` — міграція `20260607000000_security_search_path_fix.sql` (19 RPC search_path functions) — застосувати через Dashboard SQL Editor
- Vercel Pro → cron `0 * * * *` для check-uncompleted

## Воркфлоу: ONE TASK = ONE SESSION
1. Прочитати `HANDOFF.md` — знайти ▶ NEXT задачу
2. Startup: `mempalace_status` → `SYSTEM_MAP` → `TRACKER.md`
3. QA Gate → Skill → код → tsc → build → deploy
4. Після deploy: оновити TRACKER.md + HANDOFF.md + TRANSITION_PROMPT.md
