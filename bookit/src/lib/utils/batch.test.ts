import { describe, it, expect } from 'vitest';
import { runBatched } from './batch';

describe('runBatched', () => {
  it('processes every item and preserves input order', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    const out = await runBatched(items, 3, async (n) => n * 2);
    expect(out).toEqual([2, 4, 6, 8, 10, 12, 14]);
  });

  it('passes the correct global index to fn', async () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const out = await runBatched(items, 2, async (item, i) => `${i}:${item}`);
    expect(out).toEqual(['0:a', '1:b', '2:c', '3:d', '4:e']);
  });

  it('never exceeds the concurrency cap of in-flight promises', async () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    let inFlight = 0;
    let maxInFlight = 0;

    await runBatched(items, 4, async (n) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 1));
      inFlight--;
      return n;
    });

    expect(maxInFlight).toBeLessThanOrEqual(4);
  });

  it('treats concurrency < 1 as serial (cap 1)', async () => {
    const items = [1, 2, 3];
    let inFlight = 0;
    let maxInFlight = 0;

    const out = await runBatched(items, 0, async (n) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 1));
      inFlight--;
      return n;
    });

    expect(out).toEqual([1, 2, 3]);
    expect(maxInFlight).toBe(1);
  });

  it('returns an empty array for empty input without calling fn', async () => {
    let calls = 0;
    const out = await runBatched([], 5, async (n) => {
      calls++;
      return n;
    });
    expect(out).toEqual([]);
    expect(calls).toBe(0);
  });

  it('counts successes correctly when fn returns booleans (broadcast use case)', async () => {
    const items = [true, false, true, true, false];
    const results = await runBatched(items, 2, async (ok) => ok);
    expect(results.filter(Boolean).length).toBe(3);
  });
});
