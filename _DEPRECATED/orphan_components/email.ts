/**
 * Email module — NOTIFICATION POLICY
 *
 * Bookit does NOT send email notifications to clients.
 * All client notifications go through:
 *   • Telegram Bot (lib/telegram.ts)
 *   • Web Push     (lib/push.ts)
 *
 * This file exists only to satisfy any lingering imports.
 * Magiclink generation for SMS auth uses Supabase Admin SDK directly
 * in /api/auth/verify-sms — it does NOT go through this module.
 */

// No exports — email notification functionality has been intentionally removed.
