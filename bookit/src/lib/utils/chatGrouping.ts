/**
 * Shared message-grouping helpers for chat surfaces (DM + Support).
 *
 * Messenger feel = consecutive messages from one sender collapse into a single
 * visual group (one tail, tight spacing), and the stream is broken by centered
 * day separators. These helpers keep that logic identical across every chat.
 */

const DAY_MS = 86_400_000;
/** Messages from the same sender within this window belong to one group. */
const GROUP_WINDOW_MS = 5 * 60_000;

/** Local midnight for a given date — used to compare calendar days, not hours. */
function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Human day label for a separator pill: "Сьогодні" / "Вчора" / "12 червня"
 * (year added once the message falls outside the current calendar year).
 */
export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / DAY_MS);
  if (diffDays === 0) return 'Сьогодні';
  if (diffDays === 1) return 'Вчора';
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/** True when `curr` opens a new calendar day relative to `prev`. */
export function isNewDay(prevIso: string | null, currIso: string): boolean {
  if (!prevIso) return true;
  return startOfDay(new Date(prevIso)) !== startOfDay(new Date(currIso));
}

/**
 * True when `curr` starts a new visual group: different sender, a day break,
 * or more than the grouping window since the previous message.
 */
export function startsGroup(
  prev: { sender_id: string; created_at: string } | null,
  curr: { sender_id: string; created_at: string },
): boolean {
  if (!prev) return true;
  if (prev.sender_id !== curr.sender_id) return true;
  if (isNewDay(prev.created_at, curr.created_at)) return true;
  return new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime() > GROUP_WINDOW_MS;
}

/**
 * True when `curr` ends a visual group — i.e. the next message starts a new
 * one (or there is no next). The group's tail + timestamp render on this bubble.
 */
export function endsGroup(
  curr: { sender_id: string; created_at: string },
  next: { sender_id: string; created_at: string } | null,
): boolean {
  if (!next) return true;
  return startsGroup(curr, next);
}
