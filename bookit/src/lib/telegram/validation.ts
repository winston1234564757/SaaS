import { validate } from '@telegram-apps/init-data-node';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Validates Telegram initData and returns the parsed data if valid.
 * Throws an error if validation fails or token is missing.
 */
export function validateTelegramData(initData: string) {
  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }

  try {
    // Validate the data using the bot token
    // We use a 24-hour expiry by default (initData contains auth_date)
    validate(initData, BOT_TOKEN, {
      expiresIn: 24 * 60 * 60,
    });

    // If we are here, validation passed.
    // We can parse the data manually or use searchParams
    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    
    if (!userJson) {
      throw new Error('User data missing in initData');
    }

    return JSON.parse(userJson) as {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
      allows_write_to_pm?: boolean;
    };
  } catch (err) {
    console.error('[validateTelegramData] Validation failed:', err);
    throw new Error('Invalid Telegram authentication data');
  }
}
