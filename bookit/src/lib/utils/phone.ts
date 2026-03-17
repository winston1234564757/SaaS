/** Format 9-digit phone (without leading 0) as "0XX XXX XX XX" */
export function formatPhoneDisplay(raw: string): string {
  const d = '0' + raw.replace(/\D/g, '');
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
}

/** Normalize user phone input: strip non-digits, remove leading 0, limit to 9 chars */
export function normalizePhoneInput(val: string): string {
  let raw = val.replace(/\D/g, '');
  if (raw.startsWith('0')) raw = raw.slice(1);
  return raw.slice(0, 9);
}

/** Convert 9-digit phone to full E.164 format: 380XXXXXXXXX */
export function toFullPhone(phone9: string): string {
  return `380${phone9}`;
}
