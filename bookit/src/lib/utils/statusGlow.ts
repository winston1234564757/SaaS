/**
 * Легкий пастельний radial-glow у кольорі статусу для тіла картки (M-CLI-05 / M-BOOK-01).
 *
 * Накладається через `backgroundImage` поверх `var(--surface)` bento-card — НЕ чіпає
 * background-color класу, тож тінт точковий у кутку, а не суцільний по всій картці.
 * Кут — лівий-верхній (біля статус-піла). `33` hex alpha ≈ 20% піку → плавно у прозорість.
 *
 * ЄДИНЕ джерело формули glow для карток клієнтів (retentionGlow) і записів — щоб
 * тюнити силу в одному місці. `color` — 6-значний hex (#RRGGBB) зі STATUS_CONFIG.
 */
export function statusGlow(color: string): string {
  return `radial-gradient(125% 90% at 0% 0%, ${color}33 0%, transparent 58%)`;
}
