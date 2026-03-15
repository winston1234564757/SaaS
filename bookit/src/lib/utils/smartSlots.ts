/**
 * Smart Slot Suggestion — scoring algorithm for suggesting optimal booking times.
 *
 * Scoring factors (all additive):
 *  +3  Client previously booked at this hour (personalized)
 *  +2  Golden hours: 10:00–13:00 (peak beauty service demand)
 *  +1  Good hours: 14:00–17:00
 *  -1  Early slots: before 9:30
 *  -1  Late slots: after 18:00
 *
 * Slots with score >= TOP_THRESHOLD are marked as "suggested" (up to MAX_SUGGESTIONS).
 */

export interface SlotWithScore {
  time: string;
  available: boolean;
  score: number;
  isSuggested: boolean;
}

const MAX_SUGGESTIONS = 3;

function getHour(time: string): number {
  return parseInt(time.slice(0, 2), 10);
}

function getMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function scoreSlots(
  slots: { time: string; available: boolean }[],
  options: {
    clientHistoryTimes?: string[]; // e.g. ['10:30', '11:00', '10:30']
  } = {}
): SlotWithScore[] {
  const { clientHistoryTimes = [] } = options;

  // Count client's preferred hours from history
  const hourFrequency: Record<number, number> = {};
  clientHistoryTimes.forEach(t => {
    const h = getHour(t);
    hourFrequency[h] = (hourFrequency[h] ?? 0) + 1;
  });
  const maxFreq = Math.max(...Object.values(hourFrequency), 0);

  const availableSlots = slots.filter(s => s.available);

  const scored = slots.map(slot => {
    if (!slot.available) {
      return { ...slot, score: -999, isSuggested: false };
    }

    const hour = getHour(slot.time);
    const mins = getMinutes(slot.time);
    let score = 0;

    // Client history bonus
    if (maxFreq > 0 && hourFrequency[hour]) {
      score += Math.round(3 * (hourFrequency[hour] / maxFreq));
    }

    // Golden hours: 10:00–13:30
    if (hour >= 10 && hour < 14) score += 2;

    // Good hours: 14:00–17:30
    else if (hour >= 14 && hour < 18) score += 1;

    // Early penalty
    if (mins < 570) score -= 1; // before 9:30

    // Late penalty
    if (hour >= 18) score -= 1;

    return { ...slot, score, isSuggested: false };
  });

  // Mark top N available slots as suggested
  const availableScored = scored
    .filter(s => s.available)
    .sort((a, b) => b.score - a.score);

  const topScore = availableScored[0]?.score ?? 0;

  // Only suggest if there are at least 3 available slots and score is positive
  if (availableSlots.length >= 3 && topScore > 0) {
    let suggestionCount = 0;
    for (const slot of availableScored) {
      if (suggestionCount >= MAX_SUGGESTIONS) break;
      if (slot.score >= topScore - 1) {
        const target = scored.find(s => s.time === slot.time);
        if (target) target.isSuggested = true;
        suggestionCount++;
      }
    }
  }

  return scored;
}
