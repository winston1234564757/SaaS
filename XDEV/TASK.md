# Vercel Runtime Log

## Request
ID: jlplz-1777654644845-f92585eda7df
Time: 2026-05-01T16:57:24.845Z
POST /api/auth/telegram/link-phone → 500
Host: bookit-five-psi.vercel.app
Duration: 931ms
Cache: MISS
Region: arn1
User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148
Referer: https://bookit-five-psi.vercel.app/

## Lifecycle

### Middleware
Status: 200
Route: /_middleware
Duration: 41ms
Runtime: nodejs24.x
Memory: 262MB / 2048MB
Region: fra1

### Function
Status: 500
Duration: 725ms
Runtime: nodejs24.x
Memory: 284MB / 2048MB
Region: iad1

## External APIs (3)
GET sqlrxsopllgztvgrerqk.supabase.co/rest/v1/profiles ×2 → 200 180-372ms
POST sqlrxsopllgztvgrerqk.supabase.co/auth/v1/admin/users → 422 151ms

## Deployment
ID: dpl_8WSwmXjhYg1UrRXt3dQd4caP3gNT
Environment: production


# Vercel Runtime Log

## Request
ID: 9d4wx-1777654622356-3530382f9966
Time: 2026-05-01T16:57:02.356Z
POST /api/auth/telegram → 400
Host: bookit-five-psi.vercel.app
Duration: 176ms
Cache: MISS
Region: arn1
User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148
Referer: https://bookit-five-psi.vercel.app/

## Lifecycle

### Middleware
Status: 200
Route: /_middleware
Duration: 8ms
Runtime: nodejs24.x
Memory: 262MB / 2048MB
Region: fra1

### Function
Status: 400
Duration: 10ms
Runtime: nodejs24.x
Memory: 264MB / 2048MB
Region: iad1

## Deployment
ID: dpl_8WSwmXjhYg1UrRXt3dQd4caP3gNT
Environment: production


# Vercel Runtime Log

## Request
ID: s9zbw-1777654605903-555c3a0408dc
Time: 2026-05-01T16:56:45.903Z
POST /api/auth/telegram → 200
Host: bookit-five-psi.vercel.app
Duration: 3153ms
Cache: MISS
Region: arn1
User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148
Referer: https://bookit-five-psi.vercel.app/

## Lifecycle

### Function
Status: 200
Duration: 381ms
Runtime: nodejs24.x
Memory: 296MB / 2048MB
Region: iad1

### Middleware
Status: 200
Route: /_middleware
Duration: 13ms
Runtime: nodejs24.x
Memory: 264MB / 2048MB
Region: fra1

## External APIs (1)
GET sqlrxsopllgztvgrerqk.supabase.co/rest/v1/profiles → 200 246ms

## Deployment
ID: dpl_8WSwmXjhYg1UrRXt3dQd4caP3gNT
Environment: production


# Vercel Runtime Log

## Request
ID: s9zbw-1777654605166-ddd15fc32cdc
Time: 2026-05-01T16:56:45.166Z
GET /lib/telegram-web-app.js → 304
Host: bookit-five-psi.vercel.app
Duration: 347ms
Cache: HIT
Region: arn1
User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148
Referer: https://bookit-five-psi.vercel.app/

## Lifecycle

### Middleware
Status: 200
Route: /_middleware
Duration: 11ms
Runtime: nodejs24.x
Memory: 267MB / 2048MB
Region: fra1

### Cache
Status: 304
Cache: HIT
Region: arn1

## Deployment
ID: dpl_8WSwmXjhYg1UrRXt3dQd4caP3gNT
Environment: production

# Vercel Runtime Log

## Request
ID: d5wx5-1777654528203-2ea78b099130
Time: 2026-05-01T16:55:28.203Z
POST /api/telegram/webhook → 200
Host: bookit-five-psi.vercel.app
Duration: 2083ms
Cache: MISS
Region: fra1

## Lifecycle

### Middleware
Status: 200
Route: /_middleware
Duration: 413ms
Runtime: nodejs24.x
Memory: 257MB / 2048MB
Region: fra1

### Function
Status: 200
Duration: 1691ms
Runtime: nodejs24.x
Memory: 342MB / 2048MB
Region: iad1

## External APIs (3)
GET sqlrxsopllgztvgrerqk.supabase.co/rest/v1/profiles → 200 794ms
POST sqlrxsopllgztvgrerqk.supabase.co/rest/v1/telegram_webhook_logs → 201 362ms
POST api.telegram.org/bot***/sendMessage → 200 279ms

## Deployment
ID: dpl_EZ5JZv8dzi4jhxqmpyeuHBPkAR4g
Environment: production