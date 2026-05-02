# BookIT Telegram Mini App (TGAPP) Architecture

## 🔐 Authentication Flow (Native Phone)

The authentication in TMA is designed to be frictionless, using Telegram's native contact sharing.

1. **Detection**: `TelegramProvider` detects the environment via `window.Telegram`. If detected, `isTMA` state becomes `true`.
2. **Contact Sharing**: `TelegramWelcome` prompts the user to share their phone number via `tg.requestContact()`.
3. **Backend Link**: The phone is sent to `POST /api/auth/send-sms`, which:
    - Generates a virtual email: `{phone}@bookit.app`.
    - Creates a user/profile if not exists.
    - Sends a Magic Link/OTP token (handled internally for TMA).
4. **Verification**: The client calls `supabase.auth.verifyOtp` with the received token.
5. **Cookie Flush (Critical)**: After `verifyOtp`, we wait **800ms**. This ensures the browser persists the Supabase session cookies.
6. **Hard Redirect**: We use `window.location.href = '/dashboard'` to force a full page load, ensuring Middleware sees the cookies.

## 🚀 Key Components

- `TelegramProvider.tsx`: Context provider that handles SDK initialization, auto-login via `initData`, and reactive auth state listening.
- `RootPageClient.tsx`: The primary entry point. It bifurcates the flow between standard Web Landing and TMA Welcome based on `isTMA`.
- `proxy.ts`: Middleware-level protection that redirects based on `user_role` and session presence.

## 🛠 Troubleshooting & Gotchas

- **Zombie Sessions**: If a user is deleted from the DB but has a local session, `TelegramProvider` detects the missing profile and forces a `signOut()`.
- **Blank Screen (Race Condition)**: Resolved by adding a 800ms delay before redirecting after login to allow cookie persistence.
- **TMA Detection Delay**: Resolved by checking for the `window.Telegram` object directly instead of waiting for full SDK initialization.

## 📈 Quality Standards

- **Ultra-HD Marketing**: Story Generator renders at 3.5x scale (JPEG 0.9) for premium social sharing.
- **Beauty Loader**: Always show the peach-colored Mica loader during transitions to maintain a premium feel.
