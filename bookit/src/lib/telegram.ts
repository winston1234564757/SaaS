const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  if (!BOT_TOKEN || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const json = await res.json();
    return json.ok === true;
  } catch {
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
  msg += `👤 <b>${clientName}</b>\n`;
  msg += `🗓 ${dateStr} о ${startTime.slice(0, 5)}\n`;
  msg += `💅 ${services}\n\n`;
  msg += `<i>Клієнт скасував запис самостійно</i>`;
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
  const dateStr = `${d.getDate()}-го ${UA_MONTHS[d.getMonth()]} о ${startTime.slice(0, 5)}`;

  let msg = `🔥 Новий запис from BookIt\n\n`;
  msg += `👤 Клієнт: ${clientName}\n`;
  msg += `📅 Коли: ${dateStr} на «${services}»\n`;
  if (products && products.length > 0) {
    const productLines = products.map(p => `  • ${p.name} × ${p.quantity}`).join('\n');
    msg += `🛍 Товари:\n${productLines}\n`;
  }
  msg += `💰 Сума: ${totalPrice} грн\n`;
  if (notes) msg += `📝 Коментар: ${notes}\n`;
  return msg;
}
