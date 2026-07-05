import type { ClientRow } from '@/lib/supabase/hooks/useClients';

const RETENTION_LABEL: Record<string, string> = {
  active: 'Активний',
  sleeping: 'Дрімає',
  at_risk: 'Під ризиком',
  lost: 'Втрачений',
};

/** CSV-екранування: обгортає в лапки якщо є кома/лапка/крапка з комою/перенос. */
function esc(value: string | number): string {
  const s = String(value ?? '');
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Серіалізує клієнтську базу у CSV (M-CLI-07).
 * `﻿` BOM спереду → Excel коректно читає Cyrillic UTF-8. Роздільник рядків CRLF.
 */
export function clientsToCsv(clients: ClientRow[]): string {
  const headers = ['Ім\'я', 'Телефон', 'Візитів', 'Витрачено (грн)', 'Середній чек (грн)', 'Статус', 'Останній візит'];
  const rows = clients.map(c => [
    esc(c.client_name),
    esc(c.client_phone),
    c.total_visits,
    c.total_spent,
    Math.round(c.average_check),
    esc(RETENTION_LABEL[c.retention_status] ?? c.retention_status),
    c.last_visit_at ? esc(new Date(c.last_visit_at).toLocaleDateString('uk-UA')) : '',
  ].join(','));
  return '﻿' + [headers.map(esc).join(','), ...rows].join('\r\n');
}

/** Тригерить завантаження CSV-файлу в браузері. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
