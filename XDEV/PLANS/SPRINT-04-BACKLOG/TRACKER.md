# Sprint-04 TRACKER
> Живий статус. Оновлюється після кожної ітерації (⬜→✅).
> Деталі виконаного: `HANDOFF.md` | Повний план + acceptance: `SPRINT-04-PLAN.md`

**Прогрес:** 26/34 ✅ | **Розпочато:** 2026-06-12 | **Оновлено:** 2026-06-15

| Іт | ID | Назва | Статус | Скіл | Commit | Brief |
|----|----|-------|--------|------|--------|-------|
| 1 | T01 | Frost тема: всі клієнти → міграція | ✅ | `code-reviewer` | `490a108` | rawTheme fallback '' → 'frost'; DB migration 20260609000001 |
| 2 | T02 | In-app сповіщення: unread кольорові + z-index | ✅ | `code-reviewer` | `b7c1d25` `f88b444` `185d78a` `2746e21` | text-accent unread bell; badge z-10; markAllRead on close; optimistic setQueryData; X button explicit markAllRead call |
| 3 | T03 | Портфоліо → Сторіс: редірект замість drawer | ✅ | `code-reviewer` | `55ce2f9` | drawer removed; redirect to /dashboard/marketing?tab=stories&portfolioId |
| 4 | T04 | Мобайл магазин: кнопка "Додати товар" + toggle уніфікація | ✅ | `senior-frontend` | `df27107` `3c26ff6` | inline btn + TabBtn outlined + уніфікація всіх 5 pill-тоглів: role=switch/bg-accent/44px |
| 5 | T05 | Клієнти (список): стандартизація кнопок + smart кнопка | ✅ | `code-reviewer` | `c239ae4` | MessageSquare→Sparkles; size-11 rounded-full; onSmartAction wired |
| 6 | T06 | Меню > Система > Студія: redesign + alpha/beta | ✅ | `design-taste-frontend` + `humanizer` | `875f512` | StudioBetaCard.tsx new: beta form (name/contact/size) → submitBetaRequest; WaitlistButton replaced; #1E5C3F badge for a11y |
| 7 | T07 | Записи мобайл: safe area top + opacity при скролі | ✅ | `senior-frontend` + `impeccable` | `224b0f9` `5be8ae1` `cc50914` `0167e17` | widget-card controls (no sticky); safe-area paddingTop; hotfix-2: sticky fully removed |
| 8 | T08 | Дашборд: tooltip safe area (кліп на краях) | ✅ | `senior-frontend` + `impeccable` | `acce085` `3743331` `5a5971f` | WeeklyChart: fixed outside bento-card (backdrop-filter trap); useLayoutEffect clamp; hotfix-4: FM overrides style.transform when y/scale in initial/animate → split into 2 nested motion.div (outer=position, inner=animation) |
| 9 | T09 | Мобайл послуги: кнопка + toggle a11y + компакт + sep | ✅ | `design-taste-frontend` | `99cbd6c` `decf6fd` | FAB→inline bg-accent btn; groupBy category + multi-Droppable; compact p-3/size-10; knob bg-white; hotfix: x=26 sym + ProductCard/ProductFormDrawer bg-white |
| 10 | T10 | Портфоліо: кольори стандарт + mobile photo actions | ✅ | `design-taste-frontend` + `impeccable` | `69f072e` `39cc4e9` `3cb5502` `438a2f7` | PhotoLightbox shared; tap overlay + ←→ reorder; bg-accent tokens; ProductFormDrawer lightbox; hotfix: lightbox 90vw/80vh + grid-cols-2 gap-4 |
| 11 | T11 | GrowthHub мобайл: tab layout redesign | ✅ | `design-taste-frontend` | `fae6e9a` | grid-cols-3 widget blocks; icon+label+desc; bg-accent active; Rocket header removed |
| 12 | T12 | Профіль: відпустка/вихідні overlap fix (3 таби) | ✅ | `redesign-existing-projects` | `8533ce4` `b9b3b86` `1af1b3e` | always-open form; flex segmented control equal-height; "Короткий" label; hotfix-2: py-2/text-xs inputs, p-5 form padding, gap-4 fields |
| 13 | T13 | Записи: баг буферу 10 хв між записами | ✅ | `focused-fix` | `9b5fdde` | smartSlots.ts: `b.end` → `b.end + bufferMinutes` — backward buffer enforcement |
| 14 | T14 | Конструктор сторіс (ПК+мобайл): розширення робочої зони | ✅ | `senior-frontend` + `impeccable` | `6cc91f2` `aeb10fa` `8d39a4d` `51e8875` `0fa2aab` | Two-column sticky desktop; ResizeObserver scale; hotfix-5: lg:flex-wrap; **mobile redesign (51e8875)**: two-section split lg:hidden/hidden lg:flex; preview-first (ResizeObserver mobileScale); grid-cols-4 photo picker; flex-wrap mode tabs (no page h-scroll); **hotfix-6 (0fa2aab)**: grid-cols-2 pos/text + glass full-width + pill switches (motion.div knob, role=switch) |
| 15 | T15 | Сповіщення: каскад Push→TG + тексти + PWA deep link | ✅ | `focused-fix` + `senior-backend` | `51f0ba7` `f2b24bf` | some→every cascade; /100 price fix; SW_NAVIGATE→shared; /goto redirect page (iOS/Android hint); remove onlyApplePush → no double delivery; gotoUrl() всі 19 TG кнопок |
| 16 | T16 | Клієнтський навбар: redesign + Каталог + /explore (Deploy-14 ✅) | ✅ | `impeccable` + `design-taste-frontend` + `emil-design-eng` | `947311e` `e59ff92` `eae2f99` `c2c3c12` `0bd45a4` `28a5a40` `3e151e5` | navbar+explore base; FROM SCRATCH: Great Vibes hero, geo, smart sort, 7 filters, 2-row dropdowns. Phases 3-5: critique(15→36/40)+layout+bolder+harden+animate+audit(15→18/20)+polish+humanizer. Deploy-14 shipped |
| 17 | T17 | /my/* повний візуальний редизайн (masters, loyalty, notifications) | ✅ | `design-taste-frontend` + `impeccable` | `830acd4` | portrait 2-col grid; loyalty progress; date-grouped notifications |
| 17b | T-card | Картка майстра: повний редизайн (повний цикл) | ✅ | `ui-ux-pro-max` + `design-taste-frontend` + `impeccable` | `a9c5b5b` | framed photo zone h-[192px], MasterCard+MasterListCard, grid/list toggle, 4 badges WCAG AA, uniform height h-full |
| 18 | T19 | /my/bookings: повний аудит + premium redesign | ✅ | `ui-ux-pro-max` + `design-taste-frontend` + `impeccable` + `humanizer` | `9118000` | B+D+C hybrid: hero zone (72px avatar, isToday), master groups (visit count, expand), smart CTAs; Sheet variant=bottom; STATUS_CFG WCAG AA fixed |
| 19 | T20 | /my/bookings: модалка відгуку + "Записатись знову" | ✅ | merged into T19 | `9118000` | ReviewSheet (5-star animated, textarea), CancelSheet confirm; "Записатись знову" router.push /[slug]?services=ids pre-fill |
| 20 | T21 | /my/profile: Identity Card redesign + avatar upload + IG/TG fields | ✅ | `design-taste-frontend` + `impeccable` | `4e8d0c5` | Identity Card hero (96px avatar upload), social fields (instagram_url+telegram_handle), collapsible health, isDirty sticky save bar; migration profile_social_fields applied |

---
**═══ CLIENT ZONE REDESIGN — Залишилось (Deploy #20-22) ═══**

| Іт | ID | Назва | Статус | Скіл | Commit | Brief |
|----|----|-------|--------|------|--------|-------|
| 21 | **T-chat** | **/my/messages: client↔master direct messaging (Deploy-20)** | ✅ | `design-taste-frontend` + `impeccable` + `emil-design-eng` | `e3273aa` | conversations+direct_messages tables; MessagesListPage+DirectChatPage+ConversationRow; useDMChat+useUnreadDMCount; Бонуси→Чат nav; read receipts; iOS keyboard push-up; attachments |
| 22 | T-chat-kbd | /my/messages: мобайл keyboard UX (Telegram-like) | ✅ | merged into T-chat | `e3273aa` | h-dvh + visualViewport resize listener + safe-area-inset-bottom — included in T-chat |
| 23 | **T-phone** | **/my/setup/phone: onboarding redesign з нуля (Deploy-21)** | **▶ NEXT** | `design-taste-frontend` + `impeccable` | — | NEW — phone verification form redesign; Frost theme; elegant step UI |
| 24 | T24 | Клієнтська зона: desktop layout — всі 8 сторінок (Deploy-22) | ⬜ | `design-taste-frontend` + `impeccable` | — | 2-col / side panels / wide grid для /my/* + /explore |

---
**═══ Інші задачі Sprint-04 ═══**

| Іт | ID | Назва | Статус | Скіл | Commit | Brief |
|----|----|-------|--------|------|--------|-------|
| 25 | T18 | Оптимізація завантаження сторінки послуг | ⬜ | `performance-profiler` + `senior-backend` | — | — |
| 26 | T22 | Стандартизація завантаження фото (всі сутності) | ⬜ | `senior-fullstack` + `impeccable` | — | — |
| 27 | T23 | Онбординг тур: persona simulation + brainstorm + spec | ⬜ | `spec-driven-workflow` + `ui-ux-pro-max` | — | — |
| 28 | T25 | dashboard/settings (ПК): повний redesign з нуля | ⬜ | `design-taste-frontend` + `impeccable` | — | — |
| 29 | T28 | Розхідники: бізнес-аналіз + persona sim + spec | ⬜ | `spec-driven-workflow` + `senior-architect` | — | — |
| 30 | T29 | Розхідники: міграції + серверна логіка | ⬜ | `create-migration` + `senior-backend` | — | — |
| 31 | T30 | Розхідники: UX/UI реалізація | ⬜ | `design-taste-frontend` + `impeccable` | — | — |
| 32 | T31 | Smart Design System: Context-Adaptive UI | ⬜ | `spec-driven-workflow` + `senior-frontend` + `impeccable` | — | Три глобальних паттерни: adaptive contrast (mix-blend/hook), smart tooltip hook (viewport-aware flip+shift), fit-text component (ResizeObserver scale) |
| 33 | T32 | Smart Slots: авто Flash Deal при скасуванні | ✅ | `spec-driven-workflow` + `create-migration` + `senior-backend` | `e7645f9` | migration 141 (auto_flash_on_cancel + discount_pct); createFlashDealInternal; RPC bug fix (p_slot_timestamp); AutoFlashSettingsCard toggle+pills; encoding hotfix 6 landing files |
| 34 | T33 | Лендинг: повна консистентність тарифів | ✅ | `humanizer` + `senior-frontend` | `e01e138` | LandingPricing Studio→Waitlist; Starter 8 фіч; softened metrics до 32%/27%; BillingPage sync |

---

## ⚠️ Pending post-deploy (з Sprint-03)
- `npx supabase db push` — міграція `20260607000000_security_search_path_fix.sql` (19 RPC search_path functions) — застосувати через Dashboard SQL Editor
- Vercel Pro → cron `0 * * * *` для check-uncompleted

## Воркфлоу: ONE TASK = ONE SESSION
1. Прочитати `HANDOFF.md` — знайти ▶ NEXT задачу
2. Startup: `mempalace_status` → `SYSTEM_MAP` → `TRACKER.md`
3. QA Gate → Skill → код → tsc → build → deploy
4. Після deploy: оновити TRACKER.md + HANDOFF.md + TRANSITION_PROMPT.md
