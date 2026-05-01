# Vercel Runtime Log

## Request
ID: hcdgr-1777654063929-85b330031a7e
Time: 2026-05-01T16:47:43.929Z
POST /api/auth/telegram/link-phone → 500
Host: bookit-five-psi.vercel.app
Duration: 918ms
Cache: MISS
Region: arn1
User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148
Referer: https://bookit-five-psi.vercel.app/

## Lifecycle

### Middleware
Status: 200
Route: /_middleware
Duration: 31ms
Runtime: nodejs24.x
Memory: 262MB / 2048MB
Region: fra1

### Function
Status: 500
Duration: 572ms
Runtime: nodejs24.x
Memory: 268MB / 2048MB
Region: iad1

## External APIs (1)
POST sqlrxsopllgztvgrerqk.supabase.co/auth/v1/admin/users → 422 540ms

## Deployment
ID: dpl_EZ5JZv8dzi4jhxqmpyeuHBPkAR4g
Environment: production

# Vercel Runtime Log

## Request
ID: kpl7l-1777654055718-65e717bd0741
Time: 2026-05-01T16:47:35.718Z
POST /api/auth/telegram → 400
Host: bookit-five-psi.vercel.app
Duration: 170ms
Cache: MISS
Region: arn1
User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148
Referer: https://bookit-five-psi.vercel.app/

## Lifecycle

### Function
Status: 400
Duration: 9ms
Runtime: nodejs24.x
Memory: 262MB / 2048MB
Region: iad1

### Middleware
Status: 200
Route: /_middleware
Duration: 10ms
Runtime: nodejs24.x
Memory: 261MB / 2048MB
Region: fra1

## Deployment
ID: dpl_EZ5JZv8dzi4jhxqmpyeuHBPkAR4g
Environment: production

# Vercel Runtime Log

## Request
ID: flst7-1777654040171-80c87151cecf
Time: 2026-05-01T16:47:20.171Z
GET /lib/telegram-web-app.js → 304
Host: bookit-five-psi.vercel.app
Duration: 328ms
Cache: HIT
Region: arn1
User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148
Referer: https://bookit-five-psi.vercel.app/

## Lifecycle

### Middleware
Status: 200
Route: /_middleware
Duration: 15ms
Runtime: nodejs24.x
Memory: 267MB / 2048MB
Region: fra1

### Cache
Status: 304
Cache: HIT
Region: arn1

## Deployment
ID: dpl_EZ5JZv8dzi4jhxqmpyeuHBPkAR4g
Environment: production

# Vercel Runtime Log

## Request
ID: ng8lm-1777654040929-2663382a5546
Time: 2026-05-01T16:47:20.929Z
POST /api/auth/telegram → 200
Host: bookit-five-psi.vercel.app
Duration: 1255ms
Cache: MISS
Region: arn1
User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148
Referer: https://bookit-five-psi.vercel.app/

## Lifecycle

### Middleware
Status: 200
Route: /_middleware
Duration: 14ms
Runtime: nodejs24.x
Memory: 263MB / 2048MB
Region: fra1

### Function
Status: 200
Duration: 545ms
Runtime: nodejs24.x
Memory: 293MB / 2048MB
Region: iad1

## External APIs (1)
GET sqlrxsopllgztvgrerqk.supabase.co/rest/v1/profiles → 200 421ms

## Deployment
ID: dpl_EZ5JZv8dzi4jhxqmpyeuHBPkAR4g
Environment: production
