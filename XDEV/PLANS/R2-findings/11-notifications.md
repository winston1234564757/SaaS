# R2 Notifications Audit — 11-notifications

Date: 2026-07-07 · Launch: 2026-07-10
Scope: NotificationOrchestrator + notifMap cascade, coverage per business event, dedup/idempotency, 5 crons, Telegram bot, Web Push lifecycle, TurboSMS spend, templates/copy.
Mode: READ-ONLY. No project files edited.

## Headline
The orchestrator itself is well built (correct Push-primary → TG-fallback → SMS-critical-only cascade, non-throwing channel senders, 410-Gone cleanup, notification_logs). The damage is around it: **the reminder cron is scheduled daily but written for hourly runs** — 24h/2h/30m reminders miss ~95% of bookings and the morning briefing can never fire; **most notification calls are detached promises in serverless** (incl. new shop order → master), a drop-risk the codebase itself documents and fixed in only 3 places; and **flash-deal in-app notifications silently fail on an enum mismatch** while stats record them as sent. Email channel does not exist anywhere in code (no Resend integration) despite being listed in the architecture.

---

## Coverage matrix

Legend: ✓ works · ✓(D) exists but detached promise → may be silently dropped in serverless · ✗ missing/broken · — not applicable by design. Email column: **no email channel exists in the codebase** (grep: zero Resend/nodemailer/sendgrid usage).

| Event | In-App | Push | Telegram | SMS | Email | Notes |
|---|---|---|---|---|---|---|
| New booking → master | ✓ | ✓ | ✓ | ✓ crit | ✗ | awaited (createBooking.ts:684) — reference implementation |
| New booking → client (pending ack) | — | — | — | — | ✗ | none by design; client sees UI state |
| Confirmed → client | ✓(D) | ✓(D) | ✓(D) | ✓(D) crit | ✗ | detached — bookings/actions.ts:94 |
| Cancelled by master → client | ✓ | ✓ | ✓ | ✓ crit | ✗ | via after() — correct |
| Cancelled by client → master | ✗ | ✓ | ✓ | ✗ | ✗ | legacy path, no in-app/SMS; orchestrated fn is dead code |
| Rescheduled → client | ✓(D) | ✓(D) | ✓(D) | ✓(D) crit | ✗ | detached — bookings/actions.ts:287 |
| Completed → client (review nudge) | ✓(D) | ✓(D) | ✓(D) | — | ✗ | detached — bookings/actions.ts:491 |
| Reminder 24h/30m → client | ✗* | ✗* | ✗* | — | ✗ | *templates fine; daily cron kills coverage (P1) |
| Reminder 2h → client | ✗* | ✗* | ✗* | ✗* crit | ✗ | same; SMS included when it does fire |
| Reminder 2h → master | ✗* | ✗* | ✗* | ✗* | ✗ | + "у undefined" copy, client URLs (P2) |
| Morning briefing → master | ✗ | ✗ | ✗ | — | ✗ | mathematically unreachable (P1) |
| New review → master | ✓ | ✓ | ✓ | — | ✗ | legacy path in submitReview, awaited; notifMap path dead code |
| Rebooking → client | ✓ | ✗ | ✓ | ✓ ⚠ | ✗ | push never tried; SMS for non-critical event (P2) |
| Flash deal → clients | ✗ | ✓ | ✓ | — | ✗ | in-app killed by enum mismatch (P1) |
| NEW shop order → master | ✓(D) | ✓(D) | ✓(D) | — | ✗ | `void` detached (P1) |
| Order shipped/completed → client | ✓(D) | ✓(D) | ✓(D) | — | ✗ | detached — products/actions.ts:645 |
| Order cancelled → client | ✗ | ✗ | ✗ | ✗ | ✗ | no notification at all (P3) |
| Stock alert → master | ✓(D) | ✓(D) | ✓(D) | — | ✗ | `void` detached ×2 sites |
| Broadcast → client | ✗ | ✓ | ✓ | ✓ ⚠ | ✗ | in-app insert never executes; SMS not suppressed by TG (P2) |
| Subscription paid/failed/downgraded → master | ✓(D) | ✓(D) | ✓(D) | ✓(D) crit* | ✗ | detached (already P3 in 10-billing); *failed is critical |
| Subscription expiring → master | ✗ | ✗ | ✗ | — | ✗ | lives in a monthly cron → ~90% never warned (P2) |
| Support msg → admin | — | — | ✓ | — | ✗ | TG-only by design, awaited |
| Support reply → user | ✓ | ✓ | ✓ | — | ✗ | awaited |
| Portfolio consent → client | ✓ | ✓ | ✓ | — | ✗ | awaited |

---

## Findings

### P0 — none found

---

### P1

`[P1] vercel.json:8-9 + src/app/api/cron/reminders/route.ts:6-14,30-34,47` — The reminders route is written for an **hourly** cron (header comment "щогодини"; windows: 24h/2h ±29 min, 30m ±14 min) but vercel.json schedules it **once a day at 07:00 UTC** (Hobby-plan limit; MEMORY notes the pending Pro upgrade). Failure: only bookings starting inside one fixed ±29-min slice per day get a 24h reminder (those starting ~07:00 UTC next day), a 2h reminder (starting ~09:00 UTC), or a 30m reminder (starting 07:16–07:44 UTC) — **~95%+ of bookings get no reminder at all**, including the SMS-backed critical 2h one. Worse, the morning briefing gate `kyivHour() === 8` (line 47) requires the run to happen at 05:00 UTC — the cron runs at 07:00 UTC, so `master_day_briefing` **can never fire**: the feature is dead in production. Same disease on check-uncompleted (comment says `0 * * * *`, scheduled `0 17 * * *` — it degrades gracefully to once-daily nudges, acceptable). Fix = Vercel Pro + hourly schedules, or re-derive windows for the actual cadence; the 30m window additionally has a structural blind gap on hourly runs (a booking starting exactly on the hour falls outside every ±14-min window — see P2 dedup note before re-enabling).

`[P1] src/app/(master)/dashboard/products/actions.ts:435 (+425, :645; src/app/(master)/dashboard/bookings/actions.ts:94,287,464,491)` — `void notifyMasterNewOrder(...)` fires the new-shop-order notification as a **detached promise inside a server action**. On Vercel the invocation can freeze/terminate right after the response is returned; the unawaited orchestrator chain (4 DB round-trips + external HTTP) is then silently dropped → **the master is never told a client placed an order** (COD flow: nobody else will tell them; the client is waiting for confirmation). The codebase explicitly knows this failure mode — bookings/actions.ts:166-168 says "run the client notification after the response flushes so the serverless invocation doesn't drop the detached promise" and wraps exactly 2 call-sites in `after()` — but the same fix was never applied to: order_new (:435), stock_alert (products:425, bookings:464), order shipped/completed (:645), booking confirmed (bookings:94), rescheduled (:287), completed/review-nudge (:491), plus the billing sites already logged as P3 in 10-billing. Fix: wrap every fire-and-forget notify in `after(() => …)` (already imported in bookings/actions.ts).

`[P1] src/app/(master)/dashboard/flash/actions.ts:77-86 vs supabase/migrations/001_initial_schema.sql:15` — Flash-deal in-app inserts set `channel: 'in_app'`, but the `notification_channel` enum is `('push','telegram','sms')` and **no migration ever added `'in_app'`** (grep: zero `ADD VALUE`). Postgres rejects the entire batch insert (`invalid input value for enum`), the result object is discarded, and execution continues — then line 128-135 writes `flash_deal_recipients` with `in_app_sent: true` for every client. Failure: **no flash-deal recipient ever gets an in-app notification** (the only channel guaranteed for clients without push/TG — they get nothing at all), while the master's delivery stats sheet reports in-app as delivered. This silently degrades the auto-flash-on-cancel revenue feature (M-REV-02/03). Note the orchestrator/rebooking/broadcast inserts omit `channel` (default `'push'`) and succeed — only the flash path hits the enum.

---

### P2

`[P2] src/app/my/bookings/actions.ts:79-138 + src/lib/notifications.ts:134 (dead)` — Client-initiated cancellation notifies the master via a pre-orchestrator legacy path: raw TG (buildCancellationMessage) + raw push, **no in-app row and no SMS fallback**, even though `booking_cancelled` is `isCritical: true` in notifMap. The orchestrated `notifyMasterBookingCancelled` has **zero callers** (dead code). Failure: a master without Telegram and without push subscription (fresh signup — the common day-1 state) gets *no signal at all* that their client cancelled; even connected masters get no in-app record and get double delivery (TG **and** push, no cascade dedup). Also skips notification_logs. Fix: replace lines 79-138 with `notifyMasterBookingCancelled(...)` inside `after()`.

`[P2] src/app/api/cron/reminders/route.ts:142-155 + notifMap.ts:272-295` — The master-side 2h reminder reuses the client template with `masterName: undefined`. Rendered output for the master: in-app body `"о 14:00 — Манікюр у undefined"`, TG line `👤 ` (empty), and — because `reminder_2h.isCritical` — an **SMS the platform pays for reading "…Манікюр у undefined."**; push/TG buttons deep-link to `/my/bookings?...` (the client desk, where a master sees nothing). Failure: every 2h master reminder that fires is malformed and mis-linked. Needs a dedicated `reminder_2h_master` template (clientName, `/dashboard/bookings` URL, arguably not SMS-critical).

`[P2] src/app/api/cron/reminders/route.ts:197` — Morning briefing builds TG HTML with `<b>${b.client_name}</b>` — **no escHtml** on user-supplied client_name (set by the client at public booking). A name containing `<`/`&` makes Telegram reject the whole message (400 parse error) → briefing lost for that master; a crafted name injects markup (e.g. `<a href="…">`) into the master's trusted bot chat — phishing surface. check-uncompleted does this correctly (route.ts:121 escapes every field); copy that pattern. (Dormant until the P1 schedule fix revives briefings — fix both together.)

`[P2] SMS spend has no guard rails` — three independent leaks, none rate-limited (sendTurboSMS and the orchestrator have **no per-recipient, per-master, or global cap**; only OTP SMS has `check_and_log_sms_attempt`):
  (a) `src/app/api/cron/rebooking/route.ts:103-119` — sends SMS for `rebooking_reminder`, which notifMap declares non-critical with `sms: null`; the route bypasses the map and **never tries the free push channel** (TG → SMS directly), so every due client without Telegram costs an SMS daily-forever until they rebook.
  (b) `src/lib/notifications.ts:371` — broadcast SMS fallback checks only `!pushDelivered`; a successful **Telegram** delivery does not suppress SMS → clients with TG but no push get TG + paid SMS for the same broadcast.
  (c) `booking_created` is critical → each anon-created booking to a channel-less master = 1 SMS; combined with the unauthenticated, un-rate-limited public booking/order surface (01-security P2 on createOrder), a spam script converts directly into TurboSMS spend. Recommend: monthly SMS budget counter + per-recipient daily cap before launch.

`[P2] src/lib/notifications.ts:332,361` — `void admin.from('notifications').insert(...)` and `void admin.from('push_subscriptions').delete()...` in `notifyClientBroadcast`. Supabase-js query builders are **lazy thenables — the HTTP request only fires on `.then()/await`**; `void` discards them unexecuted. Failure: broadcast recipients **never get the in-app notification** (matrix gap), and expired (410) push subscriptions found during broadcasts are never cleaned up. This is different from the detached-promise P1: these queries never even start. Two-character fix each (`await`), or `.then(()=>{})`.

`[P2] src/app/api/cron/reset-monthly/route.ts:45-58 (schedule 5 3 1 * *)` — The "підписка закінчується за 3 дні" warning lives in a **monthly** cron: only subscriptions expiring on the 3rd–5th of a month are ever warned; the other ~90% of masters get `subscription_failed`/`downgraded` with zero advance notice. Move the expiring-check into the **daily** expire-subscriptions cron. (Complements 10-billing's P2 on the same route's downgrade gap.)

`[P2] src/app/api/cron/reminders/route.ts:61-166 — no dedup/idempotency at all` — processWindow has no sent-flag, no notification_logs lookup, no `rebooking_reminders`-style ledger. Vercel crons have been observed double-firing (the premise 10-billing P1#3 also rests on); a double-fire duplicates every reminder in the window — including **paid duplicate SMS** on the 2h window — and once the schedule is fixed to hourly, the 24h/2h windows (±29 min = 58-min span vs 60-min cadence) additionally leave a 2-min blind gap and the 30m window (±14 min) permanently misses **every booking starting exactly on the hour**. check-uncompleted shows the correct pattern (55-min idempotency via the notifications table, route.ts:90-100) — apply it here per (booking, window).

`[P2] src/app/api/telegram/webhook/route.ts:144` — After a successful contact-share link, the bot's "Відкрити BookIT" button opens hardcoded `https://bookit-five-psi.vercel.app/` — a Vercel preview domain. Launching 2026-07-10 on the public domain, every user completing TG phone confirmation lands on the dev deployment (separate cookies/session → appears logged out; also pins the preview URL in users' chats forever). Use `NEXT_PUBLIC_SITE_URL`.

Deepening the known P2 (01-security, telegram /start <uuid> hijack — route.ts:201): the hijacked `profiles.telegram_chat_id` is exactly what the orchestrator reads for **every client-role notification** (NotificationOrchestrator.ts:71) and what rebooking/broadcast use — so the attacker receives the victim's booking confirmations, cancellations, 2h reminders (master name + время + services = the victim's physical whereabouts schedule), and personal discount links. The old chat gets no "account was re-linked" notice, so the victim just experiences silence. Raises the urgency of binding that branch to a connect-token like the master flow.

---

### P3

`[P3] src/lib/notifications/NotificationOrchestrator.ts:77-128,156-159` — If a template fn (`def.inApp`/`def.push`) throws inside the parallel IIFEs, `Promise.all` rejects → Telegram/SMS stages are skipped **and the logs array is never persisted** — an eventType with a bad payload fails all channels invisibly. Also the `notification_logs` insert result (:158) is unchecked (silent observability loss). Channel senders themselves never throw (verified), so exposure is template-level only (all templates use `d.date!`/`d.startTime!` non-null assertions — a caller omitting them yields "NaN undefined" copy rather than a throw). Wrap each stage in try/catch and log in `finally`.

`[P3] src/app/(master)/dashboard/flash/actions.ts:114-124` — `sendTelegramMessage` returns `false` on failure but never rejects, so every result is `'fulfilled'` → `telegram_sent: true` recorded and `sentCount++` even for failed sends; `tgFailed` is always 0. Master's flash stats overreport reach. Check the boolean, not settledness.

`[P3] src/app/api/cron/reminders/route.ts:16-19` — `kyivHour()` hardcodes UTC+3; Ukraine is UTC+2 in winter → all windows and the briefing hour shift by 1h Oct–Mar. Use `Intl.DateTimeFormat('uk-UA', { timeZone: 'Europe/Kyiv' })`.

`[P3] src/lib/notifications/constants/notifMap.ts:326,331` — `Сьогодні ${pluralUk(d.count!, 'запис', …)}` — pluralUk returns **only the word**, so the briefing title reads "Сьогодні записів" with no number (push body same). Should be `` `Сьогодні ${d.count} ${pluralUk(…)}` ``. (All other pluralUk usages — flash, check-uncompleted — are correct.)

`[P3] rebooking dedup design` — (a) dedup ledger is same-day `notifications` rows (migration 079:47-52) written **after** the TG/SMS sends complete (route step 4 after step 3) → a near-simultaneous double-fire duplicates paid SMS; (b) `lv.last_date = p_today - mc.cycle` is an exact-date match → one missed cron day (deploy, outage) silently skips that cohort forever; (c) the `rebooking_reminders` table (migration 012) has zero code references — SYSTEM_MAP.md still documents it as the dedup mechanism (doc drift).

`[P3] notifMap.ts:348,351,373 + flash/actions.ts:73 — emoji in in-app UI strings` — `'⭐'.repeat(rating)` in new_review in-app body, `⚡ Флеш-акція` in-app title, `💆 Час до…` push title render inside the app's notification center — no-emoji policy violation on an owned UI surface (TG/system-push emoji is defensible; in-app is not).

`[P3] src/app/api/telegram/webhook/route.ts:177-180` — Bare `/start` (no deep-link param) returns silently: no welcome, no instructions — the bot looks dead to anyone who finds it organically. Any non-/start text is also ignored. One static reply fixes it.

`[P3] src/app/(master)/dashboard/products/actions.ts:610-645` — `updateOrderStatus('cancelled')` restocks correctly but notifies nobody: a client whose COD order was cancelled keeps waiting (matrix gap). Also `order_shipped`/`order_completed` push URLs go to `/my/bookings` — verify orders are actually visible there.

`[P3] guest bookings get zero notifications` — every client-directed path keys off `client_id`/profiles (reminders route:125 `if (b.client_id)`, orchestrator requires a profile row); a booking with only `client_name`/`client_phone` receives no confirmation, no cancellation notice, no reminders despite the phone being on file. Low priority if PostBookingAuth makes accountless bookings rare — confirm the actual share before launch.

`[P3] src/app/(master)/dashboard/marketing/actions.ts:285-366` — sendBroadcast sets status `'sending'`, then loops; an unexpected throw mid-loop leaves the broadcast stuck in `'sending'` forever (resend blocked by the `status='draft'` fetch at :250) with recipients partially notified. Low likelihood (senders don't throw), but there's no catch/finally to mark partial completion. Also dead code: `notifyMasterNewReview` (notifications.ts:191) and `notifyClientReviewNudge` (bookings/actions.ts:510) have zero callers — the live review path in my/bookings/actions.ts:205-249 is a third, manual implementation (in-app + TG + push, awaited, works — but no cascade dedup: TG and push both fire).

---

## [OK] — verified safe

- **Cascade logic** (NotificationOrchestrator.ts:74-154): In-App + Push in parallel; TG fires **only** when no push subscription returned 2xx (fallback works — a TG API failure is caught by `.catch(() => false)` and correctly does not block SMS); SMS gated on `!freeDelivered && def.isCritical && def.sms && phone` — critical-only enforcement is real at the orchestrator level. `skipped` states are logged.
- **Channel error isolation**: sendTelegramMessage (telegram.ts:43), sendTurboSMS (turbosms.ts:24, with 8s AbortController timeout), sendPush (push.ts:33) all catch internally and return status objects — one channel's outage cannot kill another.
- **410/404 Gone cleanup** works in the orchestrator (awaited delete, :120-121) and flash paths; subscribe route upserts on endpoint conflict and DELETE scopes by `user_id` (subscribe/route.ts:44-77).
- **booking_created → master is awaited** with an explicit serverless rationale (createBooking.ts:682-694) — the pattern the P1 asks to be applied everywhere.
- **after() usage** in cancelBooking/updateBookingStatus (bookings/actions.ts:168,353) and my/bookings auto-flash (:42) — correct.
- **Cron auth**: all 5 cron routes gate on `verifyCronSecret` as the first statement (re-confirmed; matches 01-security). TG webhook checks `TELEGRAM_WEBHOOK_SECRET` before parsing (route.ts:47-50). Debug fire-notifs is prod-404 + token-gated (01-security).
- **check-uncompleted** is the model cron: escHtml on every interpolated field (:121), 55-min idempotency window via notifications table (:90-100), per-master allSettled isolation, 24h max-age bound.
- **Per-item batch isolation**: reminders (BATCH=30, allSettled + per-send try/catch), rebooking (allSettled), flash TG (allSettled) — one bad row cannot kill the loop. Broadcast `continue`s on recipient-row failure.
- **escHtml** (telegram.ts:10-18) escapes `& < > "` and handles non-strings — all notifMap TG templates route user data through it; sole gap is the briefing (P2 above).
- **notification_logs** (migration 136): written by the orchestrator on every send with per-channel success/failed/skipped + error_text; RLS `master_id = auth.uid()` read-only; FKs `ON DELETE SET NULL`.
- **sw.js push handler**: JSON-with-text fallback, suppresses system notification when a tab is focused (in-app toast covers it), notificationclick uses postMessage navigation for iOS PWA + openWindow fallback. Payloads are title/body/url — far under the 4KB push limit.
- **Support notifications** awaited inside try/catch; a notification failure never fails the ticket action (support.ts:79-112,180-226).
- **Flash targeting**: Starter 5/month limit enforced on both manual and auto paths; `excludeClientId` keeps the cancelling client out of their own freed slot's deal.

---

## Severity counts

| Severity | Count |
|----------|-------|
| P0 | 0 |
| P1 | 3 (daily-vs-hourly cron kills reminders + briefing · detached notify promises incl. order_new · flash in-app enum mismatch) |
| P2 | 8 |
| P3 | 10 |
