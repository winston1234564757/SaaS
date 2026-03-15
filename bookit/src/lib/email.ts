// Email-сповіщення через Resend REST API (без npm-пакету)

const FROM = 'Bookit <no-reply@bookit.com.ua>';

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, ...params }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── HTML-шаблони ─────────────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bookit</title>
</head>
<body style="margin:0;padding:0;background:#FFD2C2;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFD2C2;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-family:Georgia,serif;font-size:26px;font-weight:600;color:#2C1A14;">
                Bookit<span style="color:#789A99;">.</span>
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(255,255,255,0.88);border-radius:24px;padding:32px;border:1px solid rgba(255,255,255,0.9);box-shadow:0 4px 24px rgba(44,26,20,0.08);">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0;font-size:11px;color:#A8928D;">
                © Bookit — твій розумний link in bio
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function statusBadge(status: 'confirmed' | 'cancelled'): string {
  const cfg = {
    confirmed: { bg: 'rgba(92,158,122,0.12)', color: '#5C9E7A', label: 'Підтверджено ✓' },
    cancelled:  { bg: 'rgba(192,91,91,0.12)',  color: '#C05B5B', label: 'Скасовано ✗' },
  }[status];
  return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;background:${cfg.bg};color:${cfg.color};">${cfg.label}</span>`;
}

// ── Шаблон: підтвердження запису (відправляємо клієнту одразу після бронювання)
export function buildBookingConfirmationHtml(params: {
  clientName: string;
  masterName: string;
  masterSlug: string;
  date: string;
  startTime: string;
  endTime: string;
  services: { name: string; price: number }[];
  totalPrice: number;
  notes?: string | null;
}): string {
  const dateFormatted = new Date(params.date + 'T00:00:00').toLocaleDateString('uk-UA', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const servicesRows = params.services
    .map(s => `<tr>
      <td style="font-size:13px;color:#6B5750;padding:4px 0;">${s.name}</td>
      <td align="right" style="font-size:13px;color:#2C1A14;font-weight:600;padding:4px 0;">${s.price.toLocaleString('uk-UA')} ₴</td>
    </tr>`)
    .join('');

  return baseTemplate(`
    <!-- Emoji -->
    <div style="text-align:center;margin-bottom:20px;">
      <div style="display:inline-block;width:72px;height:72px;border-radius:20px;background:rgba(255,210,194,0.55);line-height:72px;font-size:40px;">📅</div>
    </div>

    <h1 style="margin:0 0 6px;text-align:center;font-family:Georgia,serif;font-size:22px;font-weight:600;color:#2C1A14;">Запис підтверджено!</h1>
    <p style="margin:0 0 24px;text-align:center;font-size:14px;color:#6B5750;">Привіт, ${params.clientName}! Твій запис до <strong>${params.masterName}</strong> прийнято.</p>

    <!-- Info block -->
    <div style="background:rgba(120,154,153,0.08);border-radius:16px;padding:16px 20px;margin-bottom:20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:12px;color:#A8928D;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:6px;">📅 Дата та час</td>
        </tr>
        <tr>
          <td style="font-size:15px;font-weight:700;color:#2C1A14;text-transform:capitalize;">${dateFormatted}</td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#789A99;font-weight:600;padding-top:2px;">${params.startTime} — ${params.endTime}</td>
        </tr>
      </table>
    </div>

    <!-- Services -->
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#A8928D;text-transform:uppercase;letter-spacing:0.05em;">Послуги</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      ${servicesRows}
      <tr>
        <td style="border-top:1px solid #F5E8E3;padding-top:8px;font-size:14px;font-weight:700;color:#2C1A14;">Разом</td>
        <td align="right" style="border-top:1px solid #F5E8E3;padding-top:8px;font-size:14px;font-weight:700;color:#5C9E7A;">${params.totalPrice.toLocaleString('uk-UA')} ₴</td>
      </tr>
    </table>

    ${params.notes ? `<p style="margin:16px 0 0;font-size:12px;color:#A8928D;background:#F5E8E3;border-radius:10px;padding:10px 14px;font-style:italic;">${params.notes}</p>` : ''}

    <!-- CTA -->
    <div style="text-align:center;margin-top:24px;">
      <a href="https://bookit.com.ua/${params.masterSlug}" style="display:inline-block;padding:12px 28px;border-radius:16px;background:#789A99;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
        Переглянути сторінку майстра →
      </a>
    </div>
  `);
}

// ── Шаблон: нагадування за 24 год до візиту
export function buildReminderHtml(params: {
  clientName: string;
  masterName: string;
  masterSlug: string;
  date: string;
  startTime: string;
  endTime: string;
  services: string;
}): string {
  const dateFormatted = new Date(params.date + 'T00:00:00').toLocaleDateString('uk-UA', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return baseTemplate(`
    <div style="text-align:center;margin-bottom:20px;">
      <div style="display:inline-block;width:72px;height:72px;border-radius:20px;background:rgba(212,147,90,0.12);line-height:72px;font-size:40px;">⏰</div>
    </div>

    <h1 style="margin:0 0 6px;text-align:center;font-family:Georgia,serif;font-size:22px;font-weight:600;color:#2C1A14;">Нагадування про запис</h1>
    <p style="margin:0 0 24px;text-align:center;font-size:14px;color:#6B5750;">
      Привіт, ${params.clientName}! Завтра у тебе запис до <strong>${params.masterName}</strong> 🌸
    </p>

    <div style="background:rgba(212,147,90,0.08);border-radius:16px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:12px;color:#A8928D;font-weight:600;text-transform:uppercase;">📅 Деталі</p>
      <p style="margin:0;font-size:15px;font-weight:700;color:#2C1A14;text-transform:capitalize;">${dateFormatted}</p>
      <p style="margin:4px 0 0;font-size:14px;color:#D4935A;font-weight:600;">${params.startTime} — ${params.endTime}</p>
      <p style="margin:6px 0 0;font-size:13px;color:#6B5750;">${params.services}</p>
    </div>

    <p style="margin:0 0 20px;text-align:center;font-size:13px;color:#A8928D;">
      Якщо плани змінились — скасуй запис заздалегідь 🙏
    </p>

    <div style="text-align:center;">
      <a href="https://bookit.com.ua/my/bookings" style="display:inline-block;padding:12px 28px;border-radius:16px;background:#789A99;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
        Мої записи →
      </a>
    </div>
  `);
}

// ── Шаблон: зміна статусу (підтверджено майстром / скасовано)
export function buildStatusChangeHtml(params: {
  clientName: string;
  masterName: string;
  masterSlug: string;
  date: string;
  startTime: string;
  services: string;
  status: 'confirmed' | 'cancelled';
}): string {
  const dateFormatted = new Date(params.date + 'T00:00:00').toLocaleDateString('uk-UA', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const isConfirmed = params.status === 'confirmed';

  return baseTemplate(`
    <!-- Emoji -->
    <div style="text-align:center;margin-bottom:20px;">
      <div style="display:inline-block;width:72px;height:72px;border-radius:20px;background:${isConfirmed ? 'rgba(92,158,122,0.12)' : 'rgba(192,91,91,0.1)'};line-height:72px;font-size:40px;">
        ${isConfirmed ? '✅' : '❌'}
      </div>
    </div>

    <div style="text-align:center;margin-bottom:16px;">
      ${statusBadge(params.status)}
    </div>

    <h1 style="margin:0 0 6px;text-align:center;font-family:Georgia,serif;font-size:20px;font-weight:600;color:#2C1A14;">
      ${isConfirmed ? 'Запис підтверджено майстром' : 'Запис скасовано'}
    </h1>
    <p style="margin:0 0 24px;text-align:center;font-size:14px;color:#6B5750;">
      Привіт, ${params.clientName}!
      ${isConfirmed
        ? ` Твій запис до <strong>${params.masterName}</strong> підтверджено — чекаємо на тебе!`
        : ` На жаль, <strong>${params.masterName}</strong> скасував твій запис.`
      }
    </p>

    <!-- Info -->
    <div style="background:rgba(120,154,153,0.08);border-radius:16px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:12px;color:#A8928D;font-weight:600;text-transform:uppercase;">📅 Деталі запису</p>
      <p style="margin:0;font-size:15px;font-weight:700;color:#2C1A14;text-transform:capitalize;">${dateFormatted}</p>
      <p style="margin:4px 0 0;font-size:14px;color:#789A99;font-weight:600;">${params.startTime}</p>
      <p style="margin:6px 0 0;font-size:13px;color:#6B5750;">${params.services}</p>
    </div>

    ${isConfirmed ? `
    <!-- CTA -->
    <div style="text-align:center;margin-top:20px;">
      <a href="https://bookit.com.ua/${params.masterSlug}" style="display:inline-block;padding:12px 28px;border-radius:16px;background:#789A99;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
        Записатися знову →
      </a>
    </div>` : `
    <div style="text-align:center;margin-top:20px;">
      <a href="https://bookit.com.ua/${params.masterSlug}" style="display:inline-block;padding:12px 28px;border-radius:16px;background:#789A99;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
        Записатися на новий час →
      </a>
    </div>`}
  `);
}
