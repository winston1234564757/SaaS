/**
 * Українське відмінювання числівників.
 *
 * pluralUk(1,  'запис', 'записи', 'записів') → 'запис'
 * pluralUk(2,  'запис', 'записи', 'записів') → 'записи'
 * pluralUk(5,  'запис', 'записи', 'записів') → 'записів'
 * pluralUk(11, 'запис', 'записи', 'записів') → 'записів'
 * pluralUk(21, 'запис', 'записи', 'записів') → 'запис'
 */
export function pluralUk(
  n: number,
  one: string,   // 1, 21, 31 …
  few: string,   // 2–4, 22–24 …
  many: string   // 5–20, 11–19 …
): string {
  const mod10  = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1)                   return one;
  if (mod10 >= 2 && mod10 <= 4)      return few;
  return many;
}
