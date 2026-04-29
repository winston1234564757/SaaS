# SYSTEM_MAP — Bookit Architectural Index

> Оновлено: 2026-04-27 · Джерело: живий код (src/app, src/components, src/lib, supabase/migrations)

---

## [B2B / Master Zone] — `(master)/dashboard/...`

### Layout & Auth Guard
- `src/app/(master)/layout.tsx` — Server Component, server-side auth check; ініціює `MasterProvider`
- `src/components/master/DashboardLayout.tsx` — shell: sidebar nav + bottom nav (mobile)

### Routes → Компоненти → Server Actions

| Route | Відповідальність | Page | Actions | Key Component |
|---|---|---|---|---|
| `/dashboard` | Головна: статистика дня, розклад, нотифікації | `dashboard/page.tsx` | `dashboard/actions.ts` | `master/dashboard/TodaySchedule.tsx`, `DashboardHero.tsx`, `NotificationsBell.tsx` |
| `/dashboard/bookings` | Список записів + пошук + статуси + ручне створення | `bookings/page.tsx` | `bookings/actions.ts` | `master/bookings/BookingsPage.tsx`, `BookingCard.tsx`, `BookingActionsDropdown.tsx` |
| `/dashboard/clients` | CRM: клієнти, теги, VIP, нотатки, retention | `clients/page.tsx` | `clients/actions.ts` | `master/clients/ClientsPage.tsx`, `ClientDetailSheet.tsx`, `ClientCombobox.tsx` |
| `/dashboard/services` | CRUD послуг та товарів (reorder, активація) | `services/page.tsx` | — | `master/services/ServicesPage.tsx` |
| `/dashboard/analytics` | Аналітика Pro: виручка, топ-послуги, retention-когорти, CSV | `analytics/page.tsx` | — | `master/analytics/AnalyticsPage.tsx` |
| `/dashboard/reviews` | Відгуки клієнтів (тільки читання) | `reviews/page.tsx` | — | `master/reviews/ReviewsPage.tsx` |
| `/dashboard/flash` | Flash-акції: CRUD + Push/Telegram розсилка | `flash/page.tsx` | `flash/actions.ts`, `flash/quick-actions.ts` | `master/flash/FlashDealPage.tsx` |
| `/dashboard/pricing` | Dynamic Pricing rules editor | `pricing/page.tsx` | `pricing/actions.ts` | `master/pricing/PricingPage.tsx` |
| `/dashboard/billing` | Підписки Monobank: tier, оплата, checkout | `billing/page.tsx` | `billing/actions.ts` | `master/billing/BillingPage.tsx` |
| `/dashboard/settings` | Розклад, відпустки, Telegram, локація, тема | `settings/page.tsx` | `settings/actions.ts` | `master/settings/SettingsPage.tsx`, `VacationManager.tsx`, `LocationPicker.tsx` |
| `/dashboard/loyalty` | Програми лояльності: CRUD тирів | `loyalty/page.tsx` | `loyalty/actions.ts` | `master/loyalty/LoyaltyPage.tsx` |
| `/dashboard/referral` | Реферальна програма: Bounty + Alliance | `referral/page.tsx` | — | `master/referral/ReferralPage.tsx` |
| `/dashboard/studio` | Studio-режим: запрошення майстрів | `studio/page.tsx` | `studio/actions.ts` | `master/studio/StudioPage.tsx` |
| `/dashboard/partners` | Партнери (studio join flow) | `partners/page.tsx` | — | `master/partners/PartnersPage.tsx` |
| `/dashboard/revenue` | Revenue Hub | `revenue/page.tsx` | — | `master/revenue/RevenuePage.tsx` |
| `/dashboard/marketing` | Marketing Hub: Story Generator + Broadcast розсилки (in-app/Push/Telegram/SMS) | `marketing/page.tsx` | `marketing/actions.ts` | `master/marketing/StoryGenerator.tsx`, `BroadcastEditor.tsx`, `BroadcastDetailSheet.tsx`, `BroadcastHistory.tsx` |
| `/dashboard/growth` | Growth tools | `growth/page.tsx` | — | `master/growth/GrowthPage.tsx` |
| `/dashboard/portfolio` | Портфоліо: CRUD кейсів, фото (drag-reorder), consent клієнта, прив'язка до послуг/відгуків | `portfolio/page.tsx` | `portfolio/actions.ts` | `master/portfolio/PortfolioPage.tsx`, `PortfolioItemEditor.tsx`, `PortfolioItemCard.tsx`, `PortfolioPhotoUploader.tsx` |
| `/dashboard/products` | Товари: CRUD, стоки, замовлення | `products/page.tsx` | `products/actions.ts` | `master/products/ProductsPage.tsx` |
| `/dashboard/documents` | Юридичні документи майстра | `documents/page.tsx` | — | `master/documents/DocumentsPage.tsx` |
| `/dashboard/support` | Підтримка | `support/page.tsx` | — | `master/support/SupportPage.tsx` |
| `/dashboard/more` | Додаткові посилання: юридика, акаунт | `more/page.tsx` | — | `master/more/MorePage.tsx` |

### Onboarding Wizard
- Route: `src/app/onboarding/` (окремий layout, не в master)
- `src/app/onboarding/page.tsx` — async SC: читає `onboarding_step` + `onboarding_data` з DB
- Кроки: `BASIC → SCHEDULE → SERVICES_FORM → PROFIT_PREDICTOR → PROFILE_PREVIEW → SUCCESS`
- Persistence: `saveOnboardingProgress()` server action → `profiles.onboarding_step` + `profiles.onboarding_data`

---

## [B2C / Client Zone] — Public & Client Area

### Публічна Сторінка Майстра
- Route: `src/app/[slug]/page.tsx` — Server Component, SSR, SEO
- Actions: `src/app/[slug]/actions.ts` (server-side data fetch)
- Key component: `src/components/public/PublicMasterPage.tsx` (~40KB, головний рендер сторінки)
- Booking Entry Point: `src/components/public/BookingFlow.tsx` → монтує `BookingWizard`

### Booking Wizard
- Component: `src/components/shared/BookingWizard.tsx`
- Кроки: послуги → товари → дата → слот → підтвердження → SMS OTP (guest)
- Server Action: `src/lib/actions/createBooking.ts`
- Ціноутворення: `src/lib/actions/computeBookingPrice.ts`
- Auth після букінгу: `src/components/public/PostBookingAuth.tsx` — отримує `masterId`, `masterC2cEnabled`, `masterC2cDiscountPct`; динамічно фетчить `loyalty_programs` для майстра (Supabase browser client, RLS публічний SELECT); рендерить loyalty card / C2C teaser / BookIT fallback
- Phone discount lookup: `getActivePhoneDiscount` (debounced, 400ms) → показується в ClientDetails до підтвердження

### Short Link Redirect
- Route: `src/app/r/[code]/route.ts` — redirect + click tracking (`broadcast_links.clicks++`)
- Формат: `bookit.com.ua/r/[6-char-code]` → `target_url` (з `?serviceId=` для pre-selection)

### Booking URL (Studio path)
- Route: `src/app/studio/[slug]/page.tsx` — окрема точка входу для Studio-сторінки
- `src/components/public/StudioPublicPage.tsx`

### Explore (Каталог Майстрів)
- Route: `src/app/explore/page.tsx`
- Component: `src/components/public/ExplorePage.tsx` (~16KB)

### Client Area `/my/`
- Layout: `src/app/my/layout.tsx` — client layout + `MyBottomNav`
- `src/app/my/bookings/` → `MyBookingsPage.tsx` + `my/bookings/actions.ts`
- `src/app/my/profile/` → профіль клієнта
- `src/app/my/masters/` → мої майстри
- `src/app/my/loyalty/` → прогрес лояльності
- `src/app/my/notifications/` → `ClientNotificationsPage.tsx` — in-app нотифікації + pending portfolio consent requests
- `src/app/my/portfolio-consent/actions.ts` → `approvePortfolioConsent`, `declinePortfolioConsent`

### Публічний Магазин
- `src/app/[slug]/shop/page.tsx` — SSR, revalidate 60s; fetches products + active orders for auth client; Pro/Studio only
- `src/components/public/ShopPage.tsx` — клієнтський компонент: каталог товарів, кошик, checkout форма (pickup / Nova Poshta), `createOrder` server action
- Order flow: `createOrder` → INSERT `orders` + `order_items` → decrement stock (`increment_stock_rpc`) → master отримує сповіщення
- На сторінці майстра: Shop Banner (до послуг) + Products preview strip (до 3 товарів + "Всі товари")
- `master_profiles.ships_nova_poshta BOOLEAN` — контролює чи пропонується доставка Нова Пошта

### Публічне Портфоліо
- `src/app/[slug]/portfolio/page.tsx` — SSR grid усіх опублікованих робіт майстра, revalidate 300s
- `src/app/[slug]/portfolio/[id]/page.tsx` — SSR детальна сторінка: фото, відгуки, клієнт, inline BookingFlow (PortfolioBookingButton)
- `src/components/public/portfolio/PublicPortfolioGallery.tsx` — горизонтальний strip: 2 items + "Всі роботи" (на сторінці майстра, після Shop Banner)
- `src/components/public/portfolio/PortfolioBookingButton.tsx` — client component: кнопка + inline BookingFlow з pre-selected послугою

### Auth Flow
- `src/app/(auth)/` — login/register
- `src/app/auth/callback/` — OAuth callback
- SMS OTP: `src/app/api/auth/send-sms/`, `verify-sms/`, `link-booking/`
- SMS OTP form: `src/components/public/ClientAuthSheet.tsx` + `NavLoginSheet.tsx`

### Invite / Join
- `src/app/invite/[code]/` — реферальний лендінг
- `src/app/studio/join/` — прийняти запрошення в студію

### Legal
- `src/app/(public)/legal/[slug]/page.tsx` — SSG, читає `src/content/legal/*.md`
- Компонент: `src/components/shared/LegalFooterLinks.tsx`
- Константи: `src/lib/constants/legal.ts`

---

## [Core Logic & State]

### Supabase Clients
| Файл | Призначення |
|---|---|
| `src/lib/supabase/client.ts` | Singleton browser client; `pwaDummyLock`, `autoRefreshToken:false`, custom fetch timeout |
| `src/lib/supabase/server.ts` | SSR client (cookies) — Server Components & Actions |
| `src/lib/supabase/admin.ts` | ЄДИНА точка `service_role_key` — тільки API routes + cron |
| `src/lib/supabase/context.tsx` | `MasterProvider` / `MasterContext` — user, profile, masterProfile, isLoading |
| `src/lib/supabase/safeQuery.ts` | `safeQuery` / `safeMutation` wrapper — уніформна обробка помилок |

### TanStack Query Hooks (`src/lib/supabase/hooks/`)
| Hook | staleTime | Дані |
|---|---|---|
| `useBookings.ts` | 2 хв | Список записів майстра |
| `useBookingById.ts` | — | Один запис (для DrawerDetail) |
| `useDashboardStats.ts` | 1 хв | Статистика дашборду |
| `useAnalytics.ts` | 5 хв | Аналітика (виручка, топ, retention) |
| `useServices.ts` | 10 хв | Послуги + категорії |
| `useProducts.ts` | 10 хв | Товари |
| `useOrders.ts` | — | Замовлення товарів |
| `useClients.ts` | — | CRM-клієнти через RPC `get_master_clients_with_vip` |
| `useNotifications.ts` | 30 с | In-app нотифікації |
| `useRealtimeNotifications.ts` | — | Supabase Realtime підписка на `notifications` |
| `useFlashDeals.ts` | — | Flash-акції |
| `useReviews.ts` | — | Відгуки |
| `usePortfolioItems.ts` | 2 хв | Portfolio items майстра (з photos + review_ids) |
| `useBroadcasts.ts` | — | Broadcasts list, preview recipients, clients picker, delivery results |
| `useTimeOff.ts` | — | Відпустки / вихідні |
| `useVacation.ts` | — | Schedule exceptions |
| `useWizardSchedule.ts` | — | 30-денний розклад для BookingWizard |
| `useWeeklyOverview.ts` | — | Тижневий огляд |
| `useClientNote.ts` | — | Нотатки клієнтів |
| `useProductLinks.ts` | — | product_service_links |
| `useOrders.ts` | — | Замовлення товарів майстра (orders + order_items) |
| `useDateRange.ts` | — | Аналітика за діапазоном дат |

### Session / PWA Hooks (`src/lib/hooks/`)
- `useSessionWakeup.ts` — visibility change → `resetFetchController` → `invalidateQueries` (усуває нескінченні скелетони після переключення вкладок)
- `useDeepSleepWakeup.ts` — JS freeze detection → `onlineManager` + `invalidateQueries`
- `useTour.ts` — онбординг-тур (has_seen_tour)
- Provider: `src/lib/providers/QueryProvider.tsx`

### Slot Engine
- `src/lib/utils/smartSlots.ts` — `generateAvailableSlots`, `scoreSlots`, `buildSlotRenderItems`; Fluid Anchor алгоритм (snap при зіткненні з перервою)
- `src/lib/utils/dynamicPricing.ts` — `calculateDynamicPrice(basePrice, rules, slotDateTime)` → ціна в копійках; `DISCOUNT_FLOOR=-30%`, `MARKUP_CEIL=+50%`
- `src/lib/actions/computeBookingPrice.ts` — фінальний розрахунок ціни бронювання
- `src/lib/actions/createBooking.ts` — повна логіка створення запису (26KB)

### Notifications (Deep Linked)
- Всі канали підтримують глибокі посилання (Deep Linking) на конкретні елементи системи.
- `src/lib/notifications.ts` — orchestrator:
  - `notifyMasterNewBooking` — Push (з deep link) → Telegram (з Inline кнопкою) → SMS
  - `notifyClientBroadcast` — in-app + Push + Telegram + SMS
  - `notifyClientPortfolioConsent` — in-app + Push + Telegram (з кнопками) + SMS
- Фоновий Cron: `/api/cron/check-uncompleted` та `/api/cron/rebooking` надсилають Telegram з Inline кнопками.
- `src/lib/push.ts` — `sendPush`, `broadcastPush` (з підтримкою `url` payload).
- `src/lib/telegram.ts` — `sendTelegramMessage` (підтримує `replyMarkup` для кнопок).
- `src/lib/turbosms.ts` — SMS fallback (TurboSMS API).
- In-app:
  - `notifications` таблиця має поле `related_booking_id`.
  - Клієнтські та майстерські In-App сповіщення (Toast / Bell) клікабельні та ведуть на конкретний запис чи відгук.
  - Наповнюється як DB-тригерами (new_booking, booking_cancelled), так і вручну (review, broadcast).
- `notifications.type` values: `new_booking`, `booking_cancelled`, `new_review`, `unhandled_booking`, `portfolio_consent_request`, `broadcast`, `rebooking_reminder`

### Billing (`src/lib/billing/`)
| Файл | Відповідальність |
|---|---|
| `PaymentProvider.ts` | Abstract interface: `createCheckout`, `verifyWebhookSignature`, `chargeRecurrent` |
| `MonoProvider.ts` | Monobank: invoice create (з `saveCardData`), Ed25519 sig verify + key rotation |
| `pricing.ts` | Pure функції: bounty/lifetime discount stacking, tier pricing (unit-tested) |
| `pricing.test.ts` | Vitest suite (27 тестів, no floating-point помилок) |
| `billing.test.ts` | Ed25519 webhook verification (6 тестів) |

### Routing Guard
- `src/proxy.ts` — `export async function proxy(request: NextRequest)` — замінює `middleware.ts` (Next.js 16)
- Правила: `/dashboard` → master only; `/my` → auth; `/login|/register` → guest only

### Utilities (`src/lib/utils/`)
| Файл | Експорти |
|---|---|
| `dates.ts` | `formatDate`, `formatDateFull`, `formatDayFull`, `timeAgo`, `formatDurationFull` |
| `pluralUk.ts` | `pluralUk(n, one, few, many)` — єдиний plural helper |
| `smartSlots.ts` | `generateAvailableSlots`, `scoreSlots`, `buildSlotRenderItems` |
| `dynamicPricing.ts` | `calculateDynamicPrice`, `stackRules` |
| `phone.ts` | E.164 нормалізація |
| `slug.ts` | slug генерація |
| `now.ts` | `getNow()` — debug clock override через cookie |
| `cn.ts` | `clsx` + `tailwind-merge` |
| `broadcastUtils.ts` | `matchesTagFilters`, `personalizeMessage`, `buildTargetUrl` (`?serviceId=`), `generateShortCode` |

### Validations
- `src/lib/validations/booking.ts` — Zod schema для BookingWizard

### API Routes (`src/app/api/`)
| Route | Метод | Призначення | Auth |
|---|---|---|---|
| `/api/auth/send-sms` | POST | OTP відправка (rate-limit: 3/15хв phone, 10/год IP) | Public |
| `/api/auth/verify-sms` | POST | OTP перевірка → magiclink token | Public |
| `/api/auth/link-booking` | POST | Прив'язка pending booking після SMS auth | Anon+token |
| `/api/billing/mono-webhook` | POST | Monobank Ed25519 verify → extend subscription + upsert recToken | Ed25519 |
| `/api/billing/test-charge` | POST | 5 UAH тестова оплата → checkout URL | Master auth |
| `/api/billing/paid` | POST | Redirect після оплати | Public |
| `/api/cron/reminders` | GET | Push+SMS нагадування на завтра (`0 7 * * *`) | CRON_SECRET |
| `/api/cron/rebooking` | GET | Smart rebooking push клієнтам (`0 10 * * *`) | CRON_SECRET |
| `/api/cron/reset-monthly` | GET | Скидання лічильників + downgrade прострочених (`5 0 1 * *`) | CRON_SECRET |
| `/api/cron/expire-subscriptions` | GET | Dunning cron: charge recurrent + dunning flow (`0 2 * * *`) | CRON_SECRET |
| `/api/cron/check-uncompleted` | GET | Нагадування майстру про незавершені записи (`0 * * * *`) | CRON_SECRET |
| `/api/push/subscribe` | POST/DELETE | CRUD Web Push підписок | Auth |
| `/api/notify` | — | (порожня директорія) | — |
| `/api/telegram` | — | Telegram webhook (внутрішній) | — |
| `/api/flash` | — | Flash deal API | — |

---

## [Database Layer] — Supabase PostgreSQL

### Identity
| Таблиця | Призначення |
|---|---|
| `profiles` | Всі юзери: `full_name`, `phone` (E.164), `role`, `telegram_chat_id` (клієнт), `onboarding_step`, `onboarding_data` |
| `master_profiles` | Бізнес-профіль: `slug`, `subscription_tier`, `working_hours` (jsonb), `pricing_rules` (jsonb), `telegram_chat_id` (бізнес), `theme`, `retention_cycle_days`, `lifetime_discount` |
| `client_master_relations` | CRM: `total_visits`, `total_spent`, `average_check`, `last_visit_at`, `is_vip`, `tags[]` |

### Catalog
| Таблиця | Призначення |
|---|---|
| `services` | Послуги: `duration` (хв), `price` (копійки), `category`, `position`, `is_active` |
| `service_categories` | Кастомні категорії послуг |
| `products` | Товари: `price`, `stock`, `is_active` |
| `product_service_links` | Рекомендовані товари до послуги |

### Schedule
| Таблиця | Призначення |
|---|---|
| `schedule_templates` | Шаблон робочих годин (резерв, legacy) |
| `schedule_exceptions` | Заблоковані дати (legacy) |
| `master_time_off` | Відпустки / вихідні / короткі дні (активний override, міграція 051) |

### Bookings
| Таблиця | Призначення |
|---|---|
| `bookings` | Записи: `slot_date`, `slot_time`, `total_duration`, `total_price`, `status`, `source`, `dynamic_pricing_label` |
| `booking_services` | Деталі послуг у multi-service |
| `booking_products` | Товари в записі (ціна на момент запису) |
| `orders` | Замовлення товарів з магазину: `master_id`, `client_name`, `phone`, `delivery_type` (pickup/nova_poshta), `delivery_address`, `status`, `total_kopecks` |
| `order_items` | Рядки замовлення: `product_id`, `quantity`, `price_kopecks` |

### Marketing
| Таблиця | Призначення |
|---|---|
| `loyalty_programs` | Програми лояльності майстра (tier model) |
| `flash_deals` | Flash-акції з TTL (`status`: active/expired/booked) |
| `referrals` | C2C реферальні запрошення |
| `master_alliances` | B2B граф: хто кого запросив (незмінний) |
| `master_referrals` | Білінговий трекер реферала (`status`, `is_first_payment_made`) |
| `waitlists` | Листи очікування на слот |
| `broadcasts` | Broadcast-кампанія: `master_id`, `message`, `discount_percent`, `target_tags[]`, `service_id`, `product_id`, `channels[]`, `status` |
| `broadcast_recipients` | Per-recipient трекінг: `broadcast_id`, `client_id`, `phone`, `push_sent`, `telegram_sent`, `sms_sent`, `clicked_at`, `booked_at`, `discount_used_at` |
| `broadcast_links` | Short links: `code` (6-char), `target_url`, `recipient_id`, `clicks` → `bookit.com.ua/r/[code]` |
| `phone_discounts` | Phone-bound одноразова знижка: `phone`, `master_id`, `discount_percent`, `service_id` (nullable), `broadcast_id`, `expires_at`, `used_at` |

### Payments
| Таблиця | Призначення |
|---|---|
| `payments` | Транзакції (provider: 'monobank') |
| `master_subscriptions` | Рекурентна підписка: `token` (vault), `status`, `failed_attempts`, `next_charge_at` |
| `billing_events` | Idempotency лог: `external_id` UNIQUE, `status`, `payload` |

### Studio
| Таблиця | Призначення |
|---|---|
| `studios` | Студія: `owner_id`, `name`, `slug`, `invite_token` |
| `studio_members` | Учасники студії |

### Portfolio & Reviews
| Таблиця | Призначення |
|---|---|
| `portfolio_items` | Кейси/роботи: `title`, `description`, `service_id` FK, `tagged_client_id` FK, `consent_status` (pending/approved/declined), `is_published`, `display_order` |
| `portfolio_item_photos` | Фото кейсу (до 5): `storage_path`, `url`, `display_order`; bucket `portfolios`, path `{master_id}/items/{item_id}/{file}` |
| `portfolio_item_reviews` | Many-to-many: `portfolio_item_id` + `review_id` (composite PK) |
| `reviews` | Відгуки 1–5 (UNIQUE per booking) |

### Notifications
| Таблиця | Призначення |
|---|---|
| `notifications` | In-app: `type`, `is_read`, `related_booking_id` — заповнюється DB-тригером |
| `push_subscriptions` | VAPID Web Push підписки |

### Security
| Таблиця | Призначення |
|---|---|
| `sms_otps` | OTP коди (TTL 10 хв, `used` flag) |
| `sms_verify_attempts` | Rate-limit верифікацій (10/15 хв) |
| `sms_ip_logs` | Rate-limit по IP (10/год) |

### Retention
| Таблиця | Призначення |
|---|---|
| `rebooking_reminders` | Дедуплікація rebooking push (`sent_at`) |
| `retention_cycle_days` | Custom retention window per master |

### Ключові RPC функції
| RPC | Призначення |
|---|---|
| `get_master_clients_with_vip` | CRM-дані + retention_status + VIP — міграція 068 |
| `get_rebooking_due_clients` | Smart rebooking trigger — міграція 078 |
| `check_and_log_sms_attempt` | Atomic advisory lock OTP rate-limit |
| `get_pending_subscriptions_for_billing` | FOR UPDATE SKIP LOCKED — race-safe cron batch |
| `increment_referral_bounty` | Atomic bounty increment |
| `get_retention_status` | Retention dashboard — міграція 076 |

### Міграції
119+ міграцій. Актуальна схема: міграції **116–119** (broadcasts, broadcast_recipients, broadcast_links, phone_discounts).
Місце: `supabase/migrations/*.sql`

Останні ключові:
- `114_portfolio_items.sql` — `portfolio_items`, `portfolio_item_photos`, `portfolio_item_reviews` + RLS
- `115_recreate_portfolios_bucket.sql` — bucket `portfolios` (10MB, public) + storage policies
