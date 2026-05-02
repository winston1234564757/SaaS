const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Escapes user-supplied values for Telegram HTML parse mode.
 * Safely handles null, undefined, and any non-string type —
 * converts to string first, returns '' for nullish values.
 */
export function escHtml(s: unknown): string {
  if (s === null || s === undefined) return '';
  const str = typeof s === 'string' ? s : String(s);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: unknown): Promise<boolean> {
  if (!BOT_TOKEN || !chatId) {
    console.warn(`[Telegram] Missing BOT_TOKEN or chatId. BOT_TOKEN exists: ${!!BOT_TOKEN}`);
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      console.error(`[Telegram] API error: ${json.description}`, json);
    }
    return json.ok === true;
  } catch (error) {
    console.error(`[Telegram] Network/Fetch error:`, error);
    return false;
  }
}

export function buildCancellationMessage(params: {
  clientName: string;
  date: string;
  startTime: string;
  services: string;
}): string {
  const { clientName, date, startTime, services } = params;
  const d = new Date(date + 'T00:00:00');
  const months = ['січ','лют','бер','квіт','трав','черв','лип','серп','вер','жовт','лист','груд'];
  const dateStr = `${d.getDate()} ${months[d.getMonth()]}`;

  let msg = `❌ <b>Скасування запису</b>\n\n`;
  msg += `👤 <b>${escHtml(clientName)}</b>\n`;
  msg += `🗓 ${dateStr} о ${escHtml(startTime).slice(0, 5)}\n`;
  msg += `💅 ${escHtml(services)}\n\n`;
  msg += `<i>Клієнт скасував запис самостійно</i>`;
  return msg;
}

export function buildReviewMessage(params: {
  clientName: string;
  rating: number;
  comment?: string | null;
}): string {
  const { clientName, rating, comment } = params;
  const stars = '⭐'.repeat(rating);
  let msg = `${stars} <b>Новий відгук</b>\n\n`;
  msg += `👤 <b>${escHtml(clientName)}</b> — ${rating}/5\n`;
  if (comment) msg += `💬 ${escHtml(comment)}\n`;
  return msg;
}

export const UA_MONTHS = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];

export function buildBookingMessage(params: {
  clientName: string;
  date: string;
  startTime: string;
  services: string;
  totalPrice: number;
  notes?: string | null;
  products?: { name: string; quantity: number }[];
}): string {
  const { clientName, date, startTime, services, totalPrice, notes, products } = params;
  const d = new Date(date + 'T00:00:00');
  const dateStr = `${d.getDate()}-го ${UA_MONTHS[d.getMonth()]} о ${escHtml(startTime).slice(0, 5)}`;

  let msg = `🔥 Новий запис from BookIt\n\n`;
  msg += `👤 Клієнт: ${escHtml(clientName)}\n`;
  msg += `📅 Коли: ${dateStr} на «${escHtml(services)}»\n`;
  if (products && products.length > 0) {
    const productLines = products.map(p => `  • ${escHtml(p.name)} × ${p.quantity}`).join('\n');
    msg += `🛍 Товари:\n${productLines}\n`;
  }
  msg += `💰 Сума: ${totalPrice} грн\n`;
  if (notes) msg += `📝 Коментар: ${escHtml(notes)}\n`;
  return msg;
}
